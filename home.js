document.querySelectorAll(".level-card").forEach((card) => {
  card.addEventListener("click", () => {
    const link = card.dataset.link;
    window.location.href = link;
  });
});

document.querySelector(".leaderboard-btn").addEventListener("click", () => {
  window.location.href = "leaderboard.html";
});
