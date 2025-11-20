// level2.js - ES Module Version
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

// ===== Hitbox for Waldo (Percentage based for Level 2 image) =====
// ===== Hitbox for Waldo (Obfuscated) =====
const waldoArea = {
  x: "MTIzNDMx",
  y: "NTEyODc=",
  width: "NDQzNDE=",
  height: "NDM4MzU=",
};

const scene = document.getElementById("scene");
const message = document.getElementById("message");
const clickMenu = document.getElementById("click-menu");

let lastClick = { x: 0, y: 0 };

// Timer system for Level 2
let startTime = null;

window.addEventListener("waldo-game-start", () => {
  startTime = Date.now();
});

let waldoFoundTime = null;

function secondsSinceStart() {
  if (!startTime) return 0;
  return (Date.now() - startTime) / 1000;
}

// Mark found character in top status bar
function markFound() {
  const el = document.querySelector(`.char-status[data-char="waldo"]`);
  if (!el) return;

  el.classList.add("found");
  el.querySelector(".time").textContent = secondsSinceStart().toFixed(1) + "s";
}

// Check if clicked inside hitbox
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

// Handle selection logic
function checkSelection(target, x, y) {
  const found = target === "waldo" && isInside(x, y, waldoArea);

  if (found) {
    if (!waldoFoundTime) {
      waldoFoundTime = secondsSinceStart();
      playSound("found");
      markFound();

      // Mark Level 2 completed
      markLevelCompleted(2);

      const popup = document.getElementById("level-complete");
      const levelText = document.getElementById("level-text");
      levelText.textContent = `🎉 You found Waldo in ${waldoFoundTime.toFixed(
        1
      )} seconds!`;
      popup.style.display = "flex";
    }
    return "You Found Waldo";
  }

  playSound("error");
  return "Waldo Is Not Here";
}

// ===== CLICK HANDLERS =====

scene.addEventListener("click", (event) => {
  const rect = scene.getBoundingClientRect();
  lastClick.x = event.clientX - rect.left;
  lastClick.y = event.clientY - rect.top;

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

clickMenu.addEventListener("click", (event) => {
  const btn = event.target.closest("button");
  if (!btn || !btn.dataset.char) return;

  const selected = btn.dataset.char;
  const result = checkSelection(selected, lastClick.x, lastClick.y);

  message.textContent = result;
  clickMenu.style.display = "none";
});

// Hide menu when clicking outside
document.addEventListener("click", (e) => {
  const container = document.getElementById("game-container");
  if (!container.contains(e.target)) {
    clickMenu.style.display = "none";
  }
});

// ===== Next Level =====
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
      await submitLevelScore(2, totalTime, comment);
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
fetchLevelLeaderboard(2, "level-leaderboard-body");
