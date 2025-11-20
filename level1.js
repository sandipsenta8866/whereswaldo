// level1.js (ES Module)
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

// Character Hitboxes (Percentage based for 1024x768 image)
// Character Hitboxes (Obfuscated)
const waldoArea = {
  x: "MjgxMDE=",
  y: "NDE0MQ==",
  width: "NDE5MzE=",
  height: "NDY0Njk=",
};
const odlawArea = {
  x: "NjM1NjE=",
  y: "NDUwNQ==",
  width: "NDExMjc=",
  height: "NDY0NzA=",
};
const wizardArea = {
  x: "MTkxMTE=",
  y: "NjAzMw==",
  width: "NDE5NzM=",
  height: "NDg2Nzg=",
};

const scene = document.getElementById("scene");
const message = document.getElementById("message");
const clickMenu = document.getElementById("click-menu");

let lastClick = { x: 0, y: 0 };

// Timer system
let startTime = null;

window.addEventListener("waldo-game-start", () => {
  startTime = Date.now();
});

let charTime = {
  waldo: null,
  odlaw: null,
  wizard: null,
};

function secondsSinceStart() {
  if (!startTime) return 0;
  return (Date.now() - startTime) / 1000;
}

// Mark found character in the top status bar
function markFound(char) {
  const el = document.querySelector(`.char-status[data-char="${char}"]`);
  if (!el) return;

  el.classList.add("found");
  el.querySelector(".time").textContent = secondsSinceStart().toFixed(1) + "s";
}

// Check if all characters are found
function checkAllFound() {
  if (charTime.waldo && charTime.odlaw && charTime.wizard) {
    markLevelCompleted(1);

    const total = Math.max(charTime.waldo, charTime.odlaw, charTime.wizard);

    const popup = document.getElementById("level-complete");
    popup.style.display = "flex";
    const levelText = document.getElementById("level-text");
    levelText.textContent = `🎉 You completed Level One in ${total.toFixed(
      1
    )} seconds!`;
  }
}

// Check if clicked inside hitbox
function isInside(clickX, clickY, area) {
  const rect = scene.getBoundingClientRect();
  const xp = clickX / rect.width;
  const yp = clickY / rect.height;

  const x = _0x1a2b(area.x);
  const y = _0x1a2b(area.y);
  const w = _0x1a2b(area.width);
  const h = _0x1a2b(area.height);

  return xp >= x && xp <= x + w && yp >= y && yp <= y + h;
}

// Decide message logic
function checkSelection(target, x, y) {
  const areas = { waldo: waldoArea, odlaw: odlawArea, wizard: wizardArea };
  const names = { waldo: "Waldo", odlaw: "Odlaw", wizard: "Wizard" };

  const found = isInside(x, y, areas[target]);

  if (found) {
    if (!charTime[target]) {
      charTime[target] = secondsSinceStart();
      markFound(target);
      playSound("found");
      checkAllFound();
    }
    return `You Found ${names[target]}`;
  }

  playSound("error");
  return `${names[target]} Is Not Here`;
}

// Show character menu on click
scene.addEventListener("click", function (event) {
  const rect = scene.getBoundingClientRect();
  lastClick.x = event.clientX - rect.left;
  lastClick.y = event.clientY - rect.top;

  // 1. Filter menu options first (determines height)
  const buttons = clickMenu.querySelectorAll("button");
  buttons.forEach((btn) => {
    const char = btn.dataset.char;
    if (charTime[char]) {
      btn.style.display = "none";
    } else {
      btn.style.display = "flex";
    }
  });

  // 2. Show menu to measure dimensions
  clickMenu.style.display = "block";

  const menuWidth = clickMenu.offsetWidth;
  const menuHeight = clickMenu.offsetHeight;

  // 3. Smart positioning (flip if overflows)
  let x = lastClick.x;
  let y = lastClick.y;

  // Check right edge
  if (x + menuWidth > rect.width) {
    x -= menuWidth;
  }

  // Check bottom edge
  if (y + menuHeight > rect.height) {
    y -= menuHeight;
  }

  clickMenu.style.left = x + "px";
  clickMenu.style.top = y + "px";
});

// Handle menu selection
clickMenu.addEventListener("click", function (event) {
  const btn = event.target.closest("button");
  if (!btn || !btn.dataset.char) return;

  const selected = btn.dataset.char;
  const result = checkSelection(selected, lastClick.x, lastClick.y);

  message.textContent = result;
  clickMenu.style.display = "none";
});

// Hide menu when clicking outside image
document.addEventListener("click", function (e) {
  const container = document.getElementById("game-container");
  if (!container.contains(e.target)) {
    clickMenu.style.display = "none";
  }
});

// Next level button
// Next level button handling
document
  .getElementById("next-level-btn")
  .addEventListener("click", async () => {
    const btn = document.getElementById("next-level-btn");
    const commentBox = document.getElementById("level-comment");
    const errorMsg = document.getElementById("level-submission-error");

    const totalTime = Math.max(charTime.waldo, charTime.odlaw, charTime.wizard);
    const comment = commentBox.value.trim();

    btn.disabled = true;
    btn.textContent = "Submitting...";
    errorMsg.style.display = "none";

    try {
      await submitLevelScore(1, totalTime, comment);
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
fetchLevelLeaderboard(1, "level-leaderboard-body");
