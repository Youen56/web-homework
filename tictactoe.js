document.addEventListener("DOMContentLoaded", () => {
  // Initial clean up. DO NOT REMOVE.
  initialCleanup();
  
  const grid = document.getElementById("grid");
  const cells = grid.querySelectorAll("div");
  const resetBtn = document.getElementById("reset-btn");
  
  let turn = 1; // 1 pour Joueur 1, 2 pour Joueur 2
  let gameOver = false;

  // Gestion du clic sur les cases
  cells.forEach((cell) => {
    cell.addEventListener("click", () => {
      if (cell.classList.contains("player1") || cell.classList.contains("player2") || gameOver) {
        return;
      }

      cell.classList.add(`player${turn}`);

      if (checkWin()) {
        setTimeout(() => alert(`Le joueur ${turn} a gagné !`), 10);
        gameOver = true;
      } else if (Array.from(cells).every(c => c.classList.contains("player1") || c.classList.contains("player2"))) {
        setTimeout(() => alert("Match nul !"), 10);
        gameOver = true;
      }

      turn = turn === 1 ? 2 : 1;
    });
  });

  // Logique du bouton Rejouer
  resetBtn.addEventListener("click", () => {
    cells.forEach(cell => {
      cell.classList.remove("player1", "player2");
    });
    turn = 1;
    gameOver = false;
  });

  function checkWin() {
    const wins = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];

    return wins.some(combination => {
      const [a, b, c] = combination;
      return cells[a].classList.contains(`player${turn}`) &&
             cells[b].classList.contains(`player${turn}`) &&
             cells[c].classList.contains(`player${turn}`);
    });
  }
});

function initialCleanup() {
  const nodesToRemove = [];
  document.getElementById("grid").childNodes.forEach((node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) {
      nodesToRemove.push(node);
    }
  });
  for (const node of nodesToRemove) {
    node.remove();
  }
}