import uuid
from datetime import datetime, timezone
from typing import List, Dict, Optional
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException
from sqlmodel import Field, Relationship, Session, SQLModel, create_engine, select

# --- BASE DE DONNÉES ---
sqlite_url = "sqlite:///./whatsapp_clone.db"
engine = create_engine(sqlite_url, echo=False)

def get_session():
    with Session(engine) as session:
        yield session

class UserGroupLink(SQLModel, table=True):
    user_phone: Optional[str] = Field(default=None, foreign_key="user.phone_number", primary_key=True)
    group_id: Optional[str] = Field(default=None, foreign_key="group.id", primary_key=True)

# --- Modifie le modèle User ---
class User(SQLModel, table=True):
    phone_number: str = Field(primary_key=True, index=True)
    first_name: str  # Obligatoire par défaut
    last_name: str   # Obligatoire par défaut
    pseudo: Optional[str] = Field(default=None) # Optionnel
    is_online: bool = Field(default=False)
    
    groups: List["Group"] = Relationship(back_populates="users", link_model=UserGroupLink)
    messages: List["Message"] = Relationship(back_populates="sender")

# --- Fonction utilitaire pour le nom d'affichage ---
def get_display_name(user: User) -> str:
    if user.pseudo and user.pseudo.strip():
        return user.pseudo
    return f"{user.first_name} {user.last_name}"



class Group(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    name: str
    
    users: List[User] = Relationship(back_populates="groups", link_model=UserGroupLink)
    messages: List["Message"] = Relationship(back_populates="group")

class Message(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    content: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    sender_phone: str = Field(foreign_key="user.phone_number")
    group_id: str = Field(foreign_key="group.id", index=True)
    
    sender: User = Relationship(back_populates="messages")
    group: Group = Relationship(back_populates="messages")

# --- BROADCASTER WEBSOCKET ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, group_id: str):
        await websocket.accept()
        if group_id not in self.active_connections:
            self.active_connections[group_id] = []
        self.active_connections[group_id].append(websocket)

    def disconnect(self, websocket: WebSocket, group_id: str):
        if group_id in self.active_connections:
            self.active_connections[group_id].remove(websocket)
            if not self.active_connections[group_id]:
                del self.active_connections[group_id]

    async def broadcast_to_group(self, message_data: dict, group_id: str):
        if group_id in self.active_connections:
            for connection in self.active_connections[group_id]:
                await connection.send_json(message_data)

manager = ConnectionManager()

# --- APP FASTAPI ---
app = FastAPI(title="WhatsApp Clone API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],  # Autorise les méthodes GET, POST, DELETE, etc.
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    SQLModel.metadata.create_all(engine)

# --- ROUTES REST ---
@app.post("/users/")
def create_user(user: User, session: Session = Depends(get_session)):
    db_user = session.get(User, user.phone_number)
    if db_user:
        return db_user # Retourne l'utilisateur s'il existe déjà
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

@app.post("/groups/")
def create_group(group: Group, session: Session = Depends(get_session)):
    db_group = session.get(Group, group.id)
    if db_group:
        return db_group # Retourne le groupe s'il existe déjà
    session.add(group)
    session.commit()
    session.refresh(group)
    return group

@app.get("/groups/{group_id}/messages")
def get_group_messages(group_id: str, session: Session = Depends(get_session)):
    statement = select(Message).where(Message.group_id == group_id).order_by(Message.timestamp)
    messages = session.exec(statement).all()
    return [{
        "id": msg.id,
        "content": msg.content,
        "timestamp": msg.timestamp.isoformat(),
        "sender": get_display_name(msg.sender) 
    } for msg in messages]

@app.get("/groups/")
def get_all_groups(session: Session = Depends(get_session)):
    """Récupère tous les groupes existants sur le serveur."""
    statement = select(Group)
    groups = session.exec(statement).all()
    return [{"id": g.id, "name": g.name} for g in groups]

@app.post("/groups/{group_id}/join/{phone_number}")
def join_group_officially(group_id: str, phone_number: str, session: Session = Depends(get_session)):
    """Rejoint un groupe."""
    statement = select(UserGroupLink).where(
        UserGroupLink.group_id == group_id, 
        UserGroupLink.user_phone == phone_number
    )
    existing_link = session.exec(statement).first()
    
    if not existing_link:
        new_link = UserGroupLink(user_phone=phone_number, group_id=group_id)
        session.add(new_link)
        session.commit()
    return {"status": "success"}

@app.delete("/groups/{group_id}/leave/{phone_number}")
def leave_group(group_id: str, phone_number: str, session: Session = Depends(get_session)):
    """Permet à un utilisateur de quitter un groupe."""
    statement = select(UserGroupLink).where(
        UserGroupLink.group_id == group_id, 
        UserGroupLink.user_phone == phone_number
    )
    link = session.exec(statement).first()
    
    if link:
        session.delete(link)
        session.commit()
    return {"status": "success"}

@app.get("/users/{phone_number}/groups")
def get_user_groups(phone_number: str, session: Session = Depends(get_session)):
    user = session.get(User, phone_number)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    # Grâce à SQLModel Relationship, on accède directement à la liste
    return [{"id": g.id, "name": g.name} for g in user.groups]


# --- ROUTE WEBSOCKET ---
@app.websocket("/ws/chat/{group_id}/{phone_number}")
async def websocket_endpoint(websocket: WebSocket, group_id: str, phone_number: str):
    await manager.connect(websocket, group_id)
    
    with Session(engine) as session:
        user = session.get(User, phone_number)
        if user:
            user.is_online = True
            session.commit()
  
    try:
        while True:
            data = await websocket.receive_text()
            
            with Session(engine) as session:
                new_msg = Message(content=data, sender_phone=phone_number, group_id=group_id)
                session.add(new_msg)
                session.commit()
                session.refresh(new_msg)
                
                sender = session.get(User, phone_number)
                if sender:
                    sender_name = get_display_name(sender)
                else:
                    sender_name = phone_number 
            message_payload = {
                "id": new_msg.id,
                "content": new_msg.content,
                "timestamp": new_msg.timestamp.isoformat(),
                "sender": sender_name
            }
            await manager.broadcast_to_group(message_payload, group_id)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, group_id)
        with Session(engine) as session:
            user = session.get(User, phone_number)
            if user:
                user.is_online = False
                session.commit()