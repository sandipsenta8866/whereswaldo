// level4.js
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

// Hitboxes (Obfuscated)
const waldoArea = {
  x: "MTAyNzM1",
  y: "NDc0ODM=",
  width: "NDQxNTk=",
  height: "NDM5NDE=",
};

const odlawArea = {
  x: "NDM4MjU=",
  y: "MTEzNTgx",
  width: "NDE2Njk=",
  height: "NDU0MTE=",
};

const scene = document.getElementById("scene");
const clickMenu = document.getElementById("click-menu");
const message = document.getElementById("message");

let startTime = null;

window.addEventListener("waldo-game-start", () => {
  startTime = Date.now();
});

let lastClick = { x: 0, y: 0 };

let times = {
  waldo: null,
  odlaw: null,
};

function secondsSinceStart() {
  if (!startTime) return 0;
  return (Date.now() - startTime) / 1000;
}

// Mark found in UI bar
function markFound(char) {
  const el = document.querySelector(`.char-status[data-char="${char}"]`);
  if (!el) return;
  el.classList.add("found");
  el.querySelector(".time").textContent = secondsSinceStart().toFixed(1) + "s";
}

// Check completion (Waldo + Odlaw)
function checkAllFound() {
  if (times.waldo && times.odlaw) {
    markLevelCompleted(4);

    const total = Math.max(times.waldo, times.odlaw);

    const popup = document.getElementById("level-complete");
    const levelText = document.getElementById("level-text");
    levelText.textContent = `🎉 You completed Level Four in ${total.toFixed(
      1
    )} seconds!`;
    popup.style.display = "flex";
  }
}

// Hitbox detection helper
function isInside(x, y, area) {
  const r = scene.getBoundingClientRect();
  const xp = x / r.width;
  const yp = y / r.height;

  const ax = _0x1a2b(area.x);
  const ay = _0x1a2b(area.y);
  const aw = _0x1a2b(area.width);
  const ah = _0x1a2b(area.height);

  return xp >= ax && xp <= ax + aw && yp >= ay && yp <= ay + ah;
}

function getAreaFor(char) {
  if (char === "waldo") return waldoArea;
  if (char === "odlaw") return odlawArea;
  return null;
}

// CLICK → show menu
scene.addEventListener("click", (e) => {
  const r = scene.getBoundingClientRect();
  lastClick.x = e.clientX - r.left;
  lastClick.y = e.clientY - r.top;

  // 1. Filter menu options first
  const buttons = clickMenu.querySelectorAll("button");
  buttons.forEach((btn) => {
    const char = btn.dataset.char;
    if (times[char]) {
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

  if (x + menuWidth > r.width) x -= menuWidth;
  if (y + menuHeight > r.height) y -= menuHeight;

  clickMenu.style.left = x + "px";
  clickMenu.style.top = y + "px";
});

// MENU selection
clickMenu.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn || !btn.dataset.char) return;

  const char = btn.dataset.char;
  const area = getAreaFor(char);

  const found = area ? isInside(lastClick.x, lastClick.y, area) : false;

  if (found) {
    message.textContent =
      char === "waldo"
        ? "You Found Waldo"
        : char === "odlaw"
        ? "You Found Odlaw"
        : "You Found Character";

    if (!times[char]) {
      times[char] = secondsSinceStart();
      markFound(char);
      playSound("found"); // Added playSound
      checkAllFound();
    }
  } else {
    message.textContent =
      char === "waldo"
        ? "Waldo Is Not Here"
        : char === "odlaw"
        ? "Odlaw Is Not Here"
        : "Character Is Not Here";
    playSound("error"); // Added playSound
  }

  clickMenu.style.display = "none";
});

// Hide menu when clicking outside
document.addEventListener("click", (e) => {
  if (!document.getElementById("game-container").contains(e.target)) {
    clickMenu.style.display = "none";
  }
});

// NEXT LEVEL button
// Next level button handling
document
  .getElementById("next-level-btn")
  .addEventListener("click", async () => {
    const btn = document.getElementById("next-level-btn");
    const commentBox = document.getElementById("level-comment");
    const errorMsg = document.getElementById("level-submission-error");

    const totalTime = Math.max(times.waldo, times.odlaw);
    const comment = commentBox.value.trim();

    btn.disabled = true;
    btn.textContent = "Submitting...";
    errorMsg.style.display = "none";

    try {
      await submitLevelScore(4, totalTime, comment);
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
fetchLevelLeaderboard(4, "level-leaderboard-body");
