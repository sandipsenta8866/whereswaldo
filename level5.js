// level5.js
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

// ===== Hitboxes (Obfuscated) =====
const waldoArea = {
  x: "MTgwNDE=",
  y: "MzM1Njk=",
  width: "NDQ0MTE=",
  height: "NDQ5MTk=",
};

const odlawArea = {
  x: "NTM2Nzc=",
  y: "MjIzMjM=",
  width: "NDQ0MTE=",
  height: "NDQ2Mjk=",
};

const wizardArea = {
  x: "MTE0MjEx",
  y: "MTI2OTMx",
  width: "NDQ0NDM=",
  height: "NDE4NzU=",
};

const wendaArea = {
  x: "NTE1MDk=",
  y: "MTE4Njk1",
  width: "NDQ0MTE=",
  height: "NDQyMjE=",
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
  wizard: null,
  wenda: null,
};

function secondsSinceStart() {
  if (!startTime) return 0;
  return (Date.now() - startTime) / 1000;
}

function getArea(char) {
  return char === "waldo"
    ? waldoArea
    : char === "odlaw"
    ? odlawArea
    : char === "wizard"
    ? wizardArea
    : char === "wenda"
    ? wendaArea
    : null;
}

// Generic hit detection
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

function markFound(char) {
  const el = document.querySelector(`.char-status[data-char="${char}"]`);
  if (el) {
    el.classList.add("found");
    el.querySelector(".time").textContent =
      secondsSinceStart().toFixed(1) + "s";
  }
}

// Completion check: Waldo + Odlaw + Wizard + Wenda
function checkAllFound() {
  if (times.waldo && times.odlaw && times.wizard && times.wenda) {
    markLevelCompleted(5);

    const total = Math.max(times.waldo, times.odlaw, times.wizard, times.wenda);

    const popup = document.getElementById("level-complete");
    const levelText = document.getElementById("level-text");
    levelText.textContent = `🎉 You completed Level Five in ${total.toFixed(
      1
    )} seconds!`;
    popup.style.display = "flex";
  }
}

// ===== CLICK HANDLER =====
scene.addEventListener("click", (e) => {
  const r = scene.getBoundingClientRect();
  lastClick.x = e.clientX - r.left;
  lastClick.y = e.clientY - r.top;

  clickMenu.style.left = lastClick.x + "px";
  clickMenu.style.top = lastClick.y + "px";

  // Filter menu options
  const buttons = clickMenu.querySelectorAll("button");
  buttons.forEach((btn) => {
    const char = btn.dataset.char;
    if (times[char]) {
      btn.style.display = "none";
    } else {
      btn.style.display = "flex";
    }
  });

  clickMenu.style.display = "block";
});

// ===== MENU SELECTION =====
clickMenu.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const char = btn.dataset.char;
  const names = {
    waldo: "Waldo",
    odlaw: "Odlaw",
    wizard: "Wizard",
    wenda: "Wenda",
  };

  const r = scene.getBoundingClientRect();
  const xp = lastClick.x / r.width;
  const yp = lastClick.y / r.height;

  const area = getArea(char);
  if (!area) {
    // Character not in this level
    message.textContent = "This character is not in this level";
    clickMenu.style.display = "none";
    return;
  }

  let found = isInside(lastClick.x, lastClick.y, area);

  if (found) {
    if (!times[char]) {
      times[char] = secondsSinceStart();
      markFound(char);
      playSound("found");
      checkAllFound();
    }
    message.textContent = `You Found ${names[char]}`;
  } else {
    playSound("error");
    message.textContent = `${names[char]} Is Not Here`;
  }

  clickMenu.style.display = "none";
});

// Close menu if clicking outside
document.addEventListener("click", (e) => {
  if (!document.getElementById("game-container").contains(e.target)) {
    clickMenu.style.display = "none";
  }
});

// Next Level button
// Next level button handling
document
  .getElementById("next-level-btn")
  .addEventListener("click", async () => {
    const btn = document.getElementById("next-level-btn");
    const commentBox = document.getElementById("level-comment");
    const errorMsg = document.getElementById("level-submission-error");

    const totalTime = Math.max(
      times.waldo,
      times.odlaw,
      times.wizard,
      times.wenda
    );
    const comment = commentBox.value.trim();

    btn.disabled = true;
    btn.textContent = "Submitting...";
    errorMsg.style.display = "none";

    try {
      await submitLevelScore(5, totalTime, comment);
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
fetchLevelLeaderboard(5, "level-leaderboard-body");
