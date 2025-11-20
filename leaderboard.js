// leaderboard.js

const leaderboardBody = document.getElementById("leaderboard-body");

async function fetchLeaderboard() {
  try {
    // Fetch top 50 scores ordered by time (ascending)
    const snapshot = await db
      .collection("leaderboard")
      .orderBy("time", "asc")
      .limit(50)
      .get();

    if (snapshot.empty) {
      leaderboardBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 30px;">
            No scores yet. Be the first!
          </td>
        </tr>`;
      return;
    }

    let html = "";
    let rank = 1;

    snapshot.forEach((doc) => {
      const data = doc.data();
      const date = data.timestamp
        ? new Date(data.timestamp.seconds * 1000).toLocaleDateString()
        : "-";

      // Sanitize output to prevent stored XSS
      const safeName = (data.name || "Anonymous")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      const safeComment = (data.comment || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

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

    leaderboardBody.innerHTML = html;
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    leaderboardBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; color: red; padding: 20px;">
          Failed to load scores. Please try again later.
        </td>
      </tr>`;
  }
}

// Load on start
fetchLeaderboard();
