// netlify/functions/check-name.js
// Looks up a trainee name in the dedicated results log for this course
// (results/troubleshooting-results.json in this repo) via the GitHub Contents API.
//
// Required Netlify environment variables:
//   GITHUB_TOKEN   - a fine-grained GitHub PAT with contents:read/write on this repo
//   GITHUB_REPO    - "owner/repo", e.g. "kmcanallyALI/Bendix-Troubleshooting-Course"
//   GITHUB_BRANCH  - optional, defaults to "main"

const RESULTS_PATH = "results/troubleshooting-results.json";

exports.handler = async (event) => {
  try {
    const name = (event.queryStringParameters && event.queryStringParameters.name || "").trim().toLowerCase();
    if (!name) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing name parameter" }) };
    }

    const { GITHUB_TOKEN, GITHUB_REPO, GITHUB_BRANCH } = process.env;
    const branch = GITHUB_BRANCH || "main";
    const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${RESULTS_PATH}?ref=${branch}`;

    const ghRes = await fetch(url, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json"
      }
    });

    if (ghRes.status === 404) {
      // No results file yet — nobody has completed the course.
      return { statusCode: 200, body: JSON.stringify({ found: false, passed: false }) };
    }
    if (!ghRes.ok) {
      return { statusCode: 502, body: JSON.stringify({ error: "GitHub lookup failed" }) };
    }

    const fileData = await ghRes.json();
    const decoded = Buffer.from(fileData.content, "base64").toString("utf-8");
    const records = JSON.parse(decoded || "[]");

    // Find the most recent PASSING record for this name (case-insensitive exact match).
    const matches = records
      .filter(r => (r.name || "").trim().toLowerCase() === name && r.passed)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    if (matches.length === 0) {
      return { statusCode: 200, body: JSON.stringify({ found: false, passed: false }) };
    }

    const latest = matches[0];
    return {
      statusCode: 200,
      body: JSON.stringify({
        found: true,
        passed: true,
        name: latest.name,
        score: latest.score,
        date: latest.date
      })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
