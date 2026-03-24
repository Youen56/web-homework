document.addEventListener("DOMContentLoaded", () => {
  // Initial clean up. DO NOT REMOVE.
  initialCleanup();
  const grid = document.getElementById("grid");

  // Hey! Pssst! In here ...
  function addLine() {
    for (let i = 0; i < 10; i++) {
      const newbox = document.createElement("div");
      newbox.addEventListener("click",(event)=>wasClicked(event.target))
      newbox.addEventListener("mouseover",(event)=>wasHovered(event.target))
      newbox.addEventListener("mouseout",(event)=>noLongerHovered(event.target))
      grid.appendChild(newbox)
    ;

    }
  }
  document.getElementById("btn-add-line").addEventListener("click", addLine);


  function toggleColor(element) {
    const currentColor = element.style.backgroundColor;

    if (currentColor === "blue") {
      element.style.backgroundColor = "white";
    }
    else if (currentColor === "white") {
      element.style.backgroundColor = "red";
    }
    else {
      element.style.backgroundColor = "blue";
    }
    // if (element.style.backgroundColor === "blue") {
    //   element.style.backgroundColor = "white";
    // }
    // else if (element.style.backgroundColor === "white") {
    //   element.style.backgroundColor = "red";
    // }
  }

  function addCallbackToAllCells() {
    for (const box of document.querySelectorAll("#grid div")) {
      box.addEventListener("click", (event) =>toggleColor(event.target) );
      box.addEventListener("mouseover", (event) =>wasHovered(event.target) );
      box.addEventListener("mouseout", (event) =>noLongerHovered(event.target) )
    }
  }
  addCallbackToAllCells()

let isDragging=false;
grid.addEventListener("mousemove",(event)=>{
  if (isDragging){
    const target=event.target;
  }
  if (target && target.tagName==='DIV'){
    wasClicked(target);
  }
})
  /**
   * Cleans up the document so that the exercise is easier.
   *
   * There are some text and comment nodes that are in the initial DOM, it's nice
   * to clean them up beforehand.
   */
  function initialCleanup() {
    const nodesToRemove = [];
    document.getElementById("grid").childNodes.forEach((node, key) => {
      if (node.nodeType !== Node.ELEMENT_NODE) {
        nodesToRemove.push(node);
      }
    });
    for (const node of nodesToRemove) {
      node.remove();
    }
  }
});
function wasClicked(element){
element.style.backgroundColor="red";
}
function wasHovered(element){
  element.classList.add("hovered")
}
function noLongerHovered(element){
  element.classList.remove("hovered")
}
function updateCounters() {
  const grid = document.getElementById("grid");
  const total = grid.childElementCount; 
  const clicked = document.querySelectorAll("#grid > div.clicked").length;
  const blue = document.querySelectorAll("#grid > div.blue").length;
  const original = total - clicked - blue;
  document.getElementById("count-total").innerText = total;
  document.getElementById("count-clicked").innerText = clicked;
  document.getElementById("count-blue").innerText = blue;
  document.getElementById("count-original").innerText = original;
}
