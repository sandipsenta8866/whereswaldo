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

// ===== Hitboxes (percent values for 1365x768 image) =====
// Make sure your coordinates are correct for all 4 characters.
// ===== Hitboxes (fill these later with real percentages) =====
// ===== Hitboxes (Obfuscated) =====
const waldoArea = {
  x: "MTIwNjM3",
  y: "NDM3MDM=",
  width: "NDE0OTM=",
  height: "NDQ1NjM=",
};

const odlawArea = {
  x: "MTE2NTI1",
  y: "MzE4MjU=",
  width: "NDE0OTM=",
  height: "NDY0MDk=",
};

const wizardArea = {
  x: "NTE3Nzc=",
  y: "MTQzMzM=",
  width: "NDQzNDE=",
  height: "NDU0ODM=",
};

const wendaArea = {
  x: "NTI2MTc=",
  y: "MjMwMTg=",
  width: "NDE0OTM=",
  height: "NDQ0MzM=",
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
  wenda: null,
};

function secondsSinceStart() {
  if (!startTime) return 0;
  return (Date.now() - startTime) / 1000;
}

// Mark found in status bar
function markFound(char) {
  const el = document.querySelector(`.char-status[data-char="${char}"]`);
  if (!el) return;
  el.classList.add("found");
  el.querySelector(".time").textContent = secondsSinceStart().toFixed(1) + "s";
}

// Check completion
function checkAllFound() {
  if (charTime.waldo && charTime.odlaw && charTime.wizard && charTime.wenda) {
    markLevelCompleted(3);

    const total = Math.max(
      charTime.waldo,
      charTime.odlaw,
      charTime.wizard,
      charTime.wenda
    );

    const popup = document.getElementById("level-complete");
    const levelText = document.getElementById("level-text");
    levelText.textContent = `🎉 You completed Level Three in ${total.toFixed(
      1
    )} seconds!`;
    popup.style.display = "flex";
  }
}

// Collision check
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

// Selection handling (safe against missing characters)
function checkSelection(target, x, y) {
  const areas = {
    waldo: waldoArea,
    odlaw: odlawArea,
    wizard: wizardArea,
    wenda: wendaArea,
  };

  const names = {
    waldo: "Waldo",
    odlaw: "Odlaw",
    wizard: "Wizard",
    wenda: "Wenda",
  };

  if (!areas[target]) return "This character is not in this level";

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

// Show click menu
scene.addEventListener("click", (event) => {
  const rect = scene.getBoundingClientRect();
  lastClick.x = event.clientX - rect.left;
  lastClick.y = event.clientY - rect.top;
  clickMenu.style.left = lastClick.x + "px";
  clickMenu.style.top = lastClick.y + "px";

  // Filter menu options
  const buttons = clickMenu.querySelectorAll("button");
  buttons.forEach((btn) => {
    const char = btn.dataset.char;
    if (charTime[char]) {
      btn.style.display = "none";
    } else {
      btn.style.display = "flex";
    }
  });

  clickMenu.style.display = "block";
});

// Handle menu selection
clickMenu.addEventListener("click", (event) => {
  const btn = event.target.closest("button");
  if (!btn || !btn.dataset.char) return;
  const selected = btn.dataset.char;
  message.textContent = checkSelection(selected, lastClick.x, lastClick.y);
  clickMenu.style.display = "none";
});

// Hide menu when outside game
document.addEventListener("click", (e) => {
  const container = document.getElementById("game-container");
  if (!container.contains(e.target)) clickMenu.style.display = "none";
});

// Next level button
// Next level button handling
document
  .getElementById("next-level-btn")
  .addEventListener("click", async () => {
    const btn = document.getElementById("next-level-btn");
    const commentBox = document.getElementById("level-comment");
    const errorMsg = document.getElementById("level-submission-error");

    const totalTime = Math.max(
      charTime.waldo,
      charTime.odlaw,
      charTime.wizard,
      charTime.wenda
    );
    const comment = commentBox.value.trim();

    btn.disabled = true;
    btn.textContent = "Submitting...";
    errorMsg.style.display = "none";

    try {
      await submitLevelScore(3, totalTime, comment);
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
fetchLevelLeaderboard(3, "level-leaderboard-body");
