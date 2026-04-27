let ws = null;
        let currentUser = { phone: '', name: '' };
        let currentGroupId = null;

        async function login() {
    const phone = document.getElementById("phoneId").value;
    const first = document.getElementById("firstName").value;
    const last = document.getElementById("lastName").value;
    const pseudo = document.getElementById("pseudo").value;

    // Validation des champs obligatoires
    if(!phone || !first || !last) {
        return alert("Le téléphone, le nom et le prénom sont obligatoires !");
    }

    currentUser.phone = phone;
    currentUser.name = pseudo.trim() !== "" ? pseudo : `${first} ${last}`;

    await fetch('http://localhost:8000/users/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            phone_number: phone, 
            first_name: first, 
            last_name: last,
            pseudo: pseudo 
        })
    });

    document.getElementById("login-overlay").style.display = "none";
    loadAllGroups(); 
}


        async function loadGroupsUI() {
            // 1. Récupérer TOUS les groupes du serveur
            const resAll = await fetch('http://localhost:8000/groups/');
            const allGroups = await resAll.json();

            // 2. Récupérer MES groupes
            const resMine = await fetch(`http://localhost:8000/users/${currentUser.phone}/groups`);
            const myGroups = await resMine.json();
            
            // Créer une liste simple d'IDs pour vérifier facilement l'appartenance
            const myGroupIds = myGroups.map(g => g.id);

            const listDiv = document.getElementById("group-list");
            listDiv.innerHTML = "";
            
            allGroups.forEach(g => {
                const isMember = myGroupIds.includes(g.id);
                const isActive = g.id === currentGroupId;

                const div = document.createElement("div");
                div.className = `group-item ${isActive ? 'active' : ''}`;
                div.style.display = "flex";
                div.style.justifyContent = "space-between";
                div.style.alignItems = "center";

                // Si je ne suis pas membre, le texte est un peu grisé
                const nameSpan = document.createElement("span");
                nameSpan.innerText = g.name;
                nameSpan.style.flex = "1";
                nameSpan.style.opacity = isMember ? "1" : "0.5";
                
                // On ne peut cliquer pour ouvrir le chat QUE si on est membre
                if (isMember) {
                    nameSpan.style.cursor = "pointer";
                    nameSpan.onclick = () => selectGroup(g.id, g.name);
                }

                // Le bouton d'action à droite (Rejoindre ou Quitter)
                const actionBtn = document.createElement("button");
                if (isMember) {
                    actionBtn.innerText = "✖"; // Petite croix pour quitter
                    actionBtn.className = "btn-leave";
                    actionBtn.title = "Quitter le groupe";
                    actionBtn.onclick = (e) => {
                        e.stopPropagation(); // Évite de déclencher le clic sur le groupe, pour être sur que l'on veuille bien quitter ce groupe
                        leaveGroup(g.id);
                    };
                } else {
                    actionBtn.innerText = "Rejoindre";
                    actionBtn.className = "btn-join";
                    actionBtn.onclick = (e) => {
                        e.stopPropagation();
                        joinGroup(g.id);
                    };
                }

                div.appendChild(nameSpan);
                div.appendChild(actionBtn);
                listDiv.appendChild(div);
            });
        }

        async function joinGroup(groupId) {
            await fetch(`http://localhost:8000/groups/${groupId}/join/${currentUser.phone}`, { method: 'POST' });
            loadGroupsUI(); // Rafraîchit la liste
        }

        async function leaveGroup(groupId) {
            if(!confirm("Êtes-vous sûr de vouloir quitter ce groupe ?")) return;

            await fetch(`http://localhost:8000/groups/${groupId}/leave/${currentUser.phone}`, { method: 'DELETE' });
            
            // Si on quitte le groupe actuellement ouvert, on nettoie la zone de chat
            if (currentGroupId === groupId) {
                if (ws) ws.close();
                currentGroupId = null;
                document.getElementById("current-group-name").innerText = "Sélectionnez un groupe";
                document.getElementById("input-area").style.visibility = "hidden";
                document.getElementById("messages").innerHTML = "";
            }
            
            loadGroupsUI(); // Rafraîchit la liste
        }

        async function promptNewGroup() {
            const name = prompt("Nom du nouveau salon public :");
            if(!name) return;

            const res = await fetch('http://localhost:8000/groups/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name })
            });
            const newGroup = await res.json();

            // Le créateur rejoint automatiquement
            await fetch(`http://localhost:8000/groups/${newGroup.id}/join/${currentUser.phone}`, { method: 'POST' });

            await loadGroupsUI();
            selectGroup(newGroup.id, newGroup.name);
        }

        async function selectGroup(groupId, groupName) {
            if (ws) ws.close();
            currentGroupId = groupId;

            document.getElementById("current-group-name").innerText = groupName;
            document.getElementById("input-area").style.visibility = "visible";
            document.getElementById("messages").innerHTML = "";

            loadGroupsUI(); // Met à jour la surbrillance active

            const historyRes = await fetch(`http://localhost:8000/groups/${groupId}/messages`);
            const history = await historyRes.json();
            history.forEach(msg => displayMessage(msg));

            ws = new WebSocket(`ws://localhost:8000/ws/chat/${groupId}/${currentUser.phone}`);
            ws.onmessage = (e) => displayMessage(JSON.parse(e.data));
        }

        async function promptNewGroup() {
            const id = prompt("ID du nouveau groupe :");
            const name = prompt("Nom du groupe :");
            if(!id || !name) return;

            // Créer le groupe
            await fetch('http://localhost:8000/groups/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id, name: name })
            });

            //Rejoindre le groupe
            await fetch(`http://localhost:8000/groups/${id}/join/${currentUser.phone}`, { method: 'POST' });

            loadGroupsUI();
        }

        async function selectGroup(groupId, groupName) {
            if (ws) ws.close(); //Fermer l'ancienne connexion
            currentGroupId = groupId;

            document.getElementById("current-group-name").innerText = groupName;
            document.getElementById("input-area").style.visibility = "visible";
            document.getElementById("messages").innerHTML = ""; //Nettoyer l'écran

            //Mettre à jour l'UI de la sidebar
            loadGroupsUI();

            //Charger historique
            const historyRes = await fetch(`http://localhost:8000/groups/${groupId}/messages`);
            const history = await historyRes.json();
            history.forEach(msg => displayMessage(msg));

            //Nouveau WebSocket
            ws = new WebSocket(`ws://localhost:8000/ws/chat/${groupId}/${currentUser.phone}`);
            ws.onmessage = (e) => displayMessage(JSON.parse(e.data));
        }

        function displayMessage(data) {
            const messagesDiv = document.getElementById('messages');
            const isMine = data.sender.includes(currentUser.name);
            
            const msgDiv = document.createElement('div');
            msgDiv.className = `message ${isMine ? 'mine' : 'others'}`;
            msgDiv.innerHTML = `
                <span class="sender">${data.sender}</span>
                ${data.content}
                <span class="time">${new Date(data.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            `;
            messagesDiv.appendChild(msgDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }

        function sendMessage(e) {
            e.preventDefault();
            const input = document.getElementById("messageText");
            if(input.value && ws) {
                ws.send(input.value);
                input.value = "";
            }
        }