// level6.js
import {
  markLevelCompleted,
  allLevelsCompleted,
  showFinalRunPopup,
  game,
  submitLevelScore,
  fetchLevelLeaderboard,
  _0x1a2b,
  playSound,
} from "./game.js";

// ===== Waldo hitbox (Obfuscated) =====
const waldoArea = {
  x: "NDA1Nzc=",
  y: "MTI0NTE3",
  width: "NDMwMjU=",
  height: "NDY0Njk=",
};

const scene = document.getElementById("scene");
const clickMenu = document.getElementById("click-menu");
const message = document.getElementById("message");

let startTime = null;

window.addEventListener("waldo-game-start", () => {
  startTime = Date.now();
});

let lastClick = { x: 0, y: 0 };
let waldoFoundTime = null;

function secondsSinceStart() {
  if (!startTime) return 0;
  return (Date.now() - startTime) / 1000;
}

// Hitbox test
function isInside(x, y, area) {
  const rect = scene.getBoundingClientRect();
  const xp = x / rect.width;
  const yp = y / rect.height;

  const ax = _0x1a2b(area.x);
  const ay = _0x1a2b(area.y);
  const aw = _0x1a2b(area.width);
  const ah = _0x1a2b(area.height);

  return xp >= ax && xp <= ax + aw && yp >= ay && yp <= ay + ah;
}

function markWaldoFound() {
  const el = document.querySelector('.char-status[data-char="waldo"]');
  if (el) {
    el.classList.add("found");
    el.querySelector(".time").textContent = waldoFoundTime.toFixed(1) + "s";
  }
}

// Show basic level completion popup (if not final)
function showLevelComplete() {
  const popup = document.getElementById("level-complete");
  const levelText = document.getElementById("level-text");

  levelText.textContent = `🎉 You completed Level Six in ${waldoFoundTime.toFixed(
    1
  )} seconds!`;

  popup.style.display = "flex";
}

// ===== CLICK HANDLER =====
scene.addEventListener("click", (e) => {
  const rect = scene.getBoundingClientRect();
  lastClick.x = e.clientX - rect.left;
  lastClick.y = e.clientY - rect.top;

  // 1. Filter menu options first
  const buttons = clickMenu.querySelectorAll("button");
  buttons.forEach((btn) => {
    if (waldoFoundTime) {
      btn.style.display = "none";
    } else {
      btn.style.display = "flex";
    }
  });

  // 2. Show menu to measure
  clickMenu.style.display = "block";

  const menuWidth = clickMenu.offsetWidth;
  const menuHeight = clickMenu.offsetHeight;

  // 3. Smart positioning
  let x = lastClick.x;
  let y = lastClick.y;

  if (x + menuWidth > rect.width) x -= menuWidth;
  if (y + menuHeight > rect.height) y -= menuHeight;

  clickMenu.style.left = x + "px";
  clickMenu.style.top = y + "px";
});

// ===== MENU SELECTION =====
clickMenu.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const rect = scene.getBoundingClientRect();
  const xp = lastClick.x / rect.width;
  const yp = lastClick.y / rect.height;

  // Call isInside directly - no need to check width/height since they're always defined
  let found = isInside(lastClick.x, lastClick.y, waldoArea);

  if (found) {
    if (!waldoFoundTime) {
      waldoFoundTime = secondsSinceStart();
      playSound("found");

      // Mark Level 6 completed
      markLevelCompleted(6);

      // Always show level completion popup first
      showLevelComplete();
    }
    message.textContent = "You Found Waldo";
  } else {
    playSound("error");
    message.textContent = "Waldo Is Not Here";
  }

  clickMenu.style.display = "none";
});

// Hide click menu if outside game area
document.addEventListener("click", (e) => {
  if (!document.getElementById("game-container").contains(e.target)) {
    clickMenu.style.display = "none";
  }
});

// Next-level button → Restart run
// Next level button handling
document
  .getElementById("next-level-btn")
  .addEventListener("click", async () => {
    const btn = document.getElementById("next-level-btn");
    const commentBox = document.getElementById("level-comment");
    const errorMsg = document.getElementById("level-submission-error");

    const totalTime = waldoFoundTime;
    const comment = commentBox.value.trim();

    btn.disabled = true;
    btn.textContent = "Submitting...";
    errorMsg.style.display = "none";

    try {
      await submitLevelScore(6, totalTime, comment);
      const current = document.body.dataset.level;
      game.goToNextLevel(current);
    } catch (error) {
      btn.disabled = false;
      btn.textContent = "Submit & Play Next Level";
      errorMsg.textContent =
        error.message || "Error submitting score. Try again.";
      errorMsg.style.display = "block";
    }
  });

// Load leaderboard on start
fetchLevelLeaderboard(6, "level-leaderboard-body");
