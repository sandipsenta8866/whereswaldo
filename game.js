// game.js
window.__waldoGameCheck = "OK";

// ====================
// PLAYER NAME HANDLER
// ====================
export function requirePlayerName() {
  const modal = document.getElementById("name-modal"); // FIXED ID
  const input = document.getElementById("player-name-input");
  const btn = document.getElementById("save-player-name");

  function startTimer() {
    if (!localStorage.getItem("waldoRunStart")) {
      localStorage.setItem("waldoRunStart", Date.now());
    }
    window.dispatchEvent(new Event("waldo-game-start"));
  }

  function check() {
    const name = localStorage.getItem("waldoPlayerName");
    if (!name) modal.style.display = "flex";
    else {
      modal.style.display = "none";
      modal.style.zIndex = "-1"; // important

      startTimer();
    }
  }

  btn.onclick = () => {
    // Basic sanitization to prevent XSS
    const rawName = input.value.trim();
    const name = rawName.replace(/[<>]/g, ""); // Remove potential HTML tags
    if (name.length < 2) {
      alert("Name must be at least 2 characters");
      return;
    }
    localStorage.setItem("waldoPlayerName", name);
    modal.style.display = "none";
    modal.style.zIndex = "-1"; // important

    startTimer();
  };

  check();
}

document.addEventListener("DOMContentLoaded", requirePlayerName);

// ====================
// LEVEL COMPLETION TRACKER
// ====================
export function markLevelCompleted(n) {
  let d = JSON.parse(localStorage.getItem("waldoLevelCompleted") || "{}");
  d[n] = true;
  localStorage.setItem("waldoLevelCompleted", JSON.stringify(d));
}

export function allLevelsCompleted() {
  const d = JSON.parse(localStorage.getItem("waldoLevelCompleted") || "{}");
  return [1, 2, 3, 4, 5, 6].every((lvl) => d[lvl]);
}

export function getRunTimeSeconds() {
  const start = localStorage.getItem("waldoRunStart");
  if (!start) return null;
  return ((Date.now() - Number(start)) / 1000).toFixed(1);
}

// ====================
// FINAL RUN POPUP
// ====================
export function showFinalRunPopup() {
  const modal = document.getElementById("final-run-modal");
  const text = document.getElementById("final-run-time-text");
  const commentBox = document.getElementById("final-comment");
  const submitBtn = document.getElementById("submit-final-score");
  const playAgainBtn = document.getElementById("play-again");

  const total = getRunTimeSeconds();
  text.textContent = `You completed all levels in ${total} seconds!`;

  modal.style.display = "flex";
  playSound("victory");

  submitBtn.onclick = () => {
    const username = localStorage.getItem("waldoPlayerName");
    const comment = commentBox.value.trim();

    const errorMsg = document.getElementById("submission-error");
    errorMsg.style.display = "none";

    if (containsForbiddenWords(comment)) {
      errorMsg.textContent =
        "Comment contains forbidden words (locations). Please remove them.";
      errorMsg.style.display = "block";
      return;
    }

    // Submit to Firestore
    db.collection("leaderboard")
      .add({
        name: username,
        time: Number(total),
        comment: comment,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      })
      .then(() => {
        // Clear storage on success
        localStorage.removeItem("waldoRunStart");
        localStorage.removeItem("waldoLevelCompleted");
        localStorage.removeItem("waldoPlayerName");

        alert("Score submitted successfully!");
        window.location.href = "leaderboard.html";
      })
      .catch((error) => {
        console.error("Error adding document: ", error);
        errorMsg.textContent = "Error submitting score. Please try again.";
        errorMsg.style.display = "block";
      });
  };

  playAgainBtn.onclick = () => {
    localStorage.removeItem("waldoRunStart");
    localStorage.removeItem("waldoLevelCompleted");
    localStorage.removeItem("waldoPlayerName"); // Force re-entry of name
    window.location.href = "level1.html";
  };
}

// ====================
// LEVEL ORDER
// ====================
export const game = {
  levelOrder: [
    "level1.html",
    "level2.html",
    "level3.html",
    "level4.html",
    "level5.html",
    "level6.html",
  ],

  goToNextLevel(current) {
    // 1. Check if ALL levels are complete
    if (allLevelsCompleted()) {
      import("./game.js").then((module) => {
        module.showFinalRunPopup();
      });
      return;
    }

    // 2. Find the next incomplete level
    const idx = this.levelOrder.indexOf(current);
    const completed = JSON.parse(
      localStorage.getItem("waldoLevelCompleted") || "{}"
    );

    // Check levels after current
    for (let i = idx + 1; i < this.levelOrder.length; i++) {
      if (!completed[i + 1]) {
        window.location.href = this.levelOrder[i];
        return;
      }
    }

    // Check levels before current (wrap around)
    for (let i = 0; i < idx; i++) {
      if (!completed[i + 1]) {
        window.location.href = this.levelOrder[i];
        return;
      }
    }

    // Fallback: go to home if somehow everything is confused
    window.location.href = "home.html";
  },
};

window.game = game;

// ====================
// HELPER FUNCTIONS
// ====================

// Levenshtein distance for fuzzy matching
function levenshtein(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) == a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          )
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

function containsForbiddenWords(text) {
  // Define forbidden words with allowed edit distance thresholds
  // Stricter (0) for short words to avoid false positives (e.g. "top" vs "to", "left" vs "lift")
  const forbidden = [
    { word: "top", maxDist: 0 },
    { word: "left", maxDist: 0 },
    { word: "right", maxDist: 0 },
    { word: "bottom", maxDist: 1 },
    { word: "center", maxDist: 1 },
    { word: "location", maxDist: 2 },
  ];

  // Normalize text: lowercase and remove punctuation
  const words = text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
    .split(/\s+/);

  for (const w of words) {
    for (const bad of forbidden) {
      // Skip if word is much shorter than target (optimization)
      if (Math.abs(w.length - bad.word.length) > bad.maxDist) continue;

      const dist = levenshtein(w, bad.word);
      if (dist <= bad.maxDist) {
        console.log(
          `Blocked word: "${w}" matches "${bad.word}" (dist: ${dist})`
        );
        return true;
      }
    }
  }
  return false;
}

// Obfuscation Decoder (Anti-Cheat)
// Key: 42069, Multiplier: 100000
export const _0x1a2b = (str) => (parseInt(atob(str)) ^ 42069) / 100000;

// ====================
// LEVEL LEADERBOARD
// ====================

export async function submitLevelScore(levelId, time, comment) {
  const username = localStorage.getItem("waldoPlayerName") || "Anonymous";
  const collectionName = `leaderboard_level${levelId}`;

  if (containsForbiddenWords(comment)) {
    throw new Error("Comment contains forbidden words.");
  }

  try {
    await db.collection(collectionName).add({
      name: username,
      time: Number(time),
      comment: comment,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error submitting level score:", error);
    throw error;
  }
}

export async function fetchLevelLeaderboard(levelId, tableBodyId) {
  const tbody = document.getElementById(tableBodyId);
  if (!tbody) return;

  try {
    const snapshot = await db
      .collection(`leaderboard_level${levelId}`)
      .orderBy("time", "asc")
      .limit(20)
      .get();

    if (snapshot.empty) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center">No scores yet. Be the first!</td></tr>`;
      return;
    }

    let html = "";
    let rank = 1;

    snapshot.forEach((doc) => {
      const data = doc.data();
      const date = data.timestamp
        ? new Date(data.timestamp.seconds * 1000).toLocaleDateString()
        : "-";

      // Sanitize
      const safeName = (data.name || "Anonymous").replace(/[<>]/g, "");
      const safeComment = (data.comment || "").replace(/[<>]/g, "");

      html += `
        <tr>
          <td>${rank++}</td>
          <td>${safeName}</td>
          <td>${Number(data.time).toFixed(1)}s</td>
          <td>${safeComment}</td>
          <td>${date}</td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
  } catch (error) {
    console.error("Error fetching level leaderboard:", error);
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:red">Error loading scores</td></tr>`;
  }
}

// ====================
// SOUND MANAGER
// ====================
const sounds = {
  found: new Audio("assets/sounds/found.mp3"),
  error: new Audio("assets/sounds/error.mp3"),
  victory: new Audio("assets/sounds/victory.mp3"),
};

// Preload sounds
Object.values(sounds).forEach((s) => {
  s.load();
  s.volume = 0.5; // Default volume
});

export function playSound(type) {
  const sound = sounds[type];
  if (sound) {
    sound.currentTime = 0; // Reset to start
    sound.play().catch((e) => console.warn("Sound play failed:", e));
  }
}
