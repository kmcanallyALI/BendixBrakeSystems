// netlify/functions/record-result.js
// Appends a completion record to results/troubleshooting-results.json in this
// repo via the GitHub Contents API — same pattern used by the PM training course,
// but writing to a dedicated log so the two courses' results never mix.
//
// Required Netlify environment variables:
//   GITHUB_TOKEN, GITHUB_REPO, GITHUB_BRANCH (see check-name.js)

const RESULTS_PATH = "results/troubleshooting-results.json";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const payload = JSON.parse(event.body || "{}");
    if (!payload.name) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing name" }) };
    }

    const { GITHUB_TOKEN, GITHUB_REPO, GITHUB_BRANCH } = process.env;
    const branch = GITHUB_BRANCH || "main";
    const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${RESULTS_PATH}?ref=${branch}`;

    let existingRecords = [];
    let sha = undefined;

    const getRes = await fetch(url, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json"
      }
    });

    if (getRes.ok) {
      const fileData = await getRes.json();
      sha = fileData.sha;
      const decoded = Buffer.from(fileData.content, "base64").toString("utf-8");
      existingRecords = JSON.parse(decoded || "[]");
    } else if (getRes.status !== 404) {
      return { statusCode: 502, body: JSON.stringify({ error: "GitHub read failed" }) };
    }

    existingRecords.push({
      name: payload.name,
      score: payload.score,
      passed: !!payload.passed,
      date: payload.date || new Date().toISOString(),
      sectionResults: payload.sectionResults || {}
    });

    const newContent = Buffer.from(JSON.stringify(existingRecords, null, 2)).toString("base64");

    const putRes = await fetch(url.split("?")[0], {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json"
      },
      body: JSON.stringify({
        message: `Record training result for ${payload.name}`,
        content: newContent,
        branch,
        ...(sha ? { sha } : {})
      })
    });

    if (!putRes.ok) {
      const errBody = await putRes.text();
      return { statusCode: 502, body: JSON.stringify({ error: "GitHub write failed", detail: errBody }) };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
