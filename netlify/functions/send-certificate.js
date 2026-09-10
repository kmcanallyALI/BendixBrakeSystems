// netlify/functions/send-certificate.js
// Emails a completion certificate summary via Resend (https://resend.com) when a
// trainee finishes the course. Fires alongside record-result.js but is entirely
// independent of it — if email sending fails, the GitHub results log is unaffected.
//
// Required Netlify environment variables:
//   RESEND_API_KEY - API key from your Resend account (resend.com)
//   CERT_EMAIL_TO  - optional, defaults to kmcanally@andrewslogistics.com
//   CERT_EMAIL_FROM - optional, defaults to "onboarding@resend.dev" (Resend's
//                     no-setup sender — works immediately but can only deliver to
//                     the email address your Resend account itself is registered
//                     under, until you verify your own sending domain)

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const payload = JSON.parse(event.body || "{}");
    const { name, score, date, sectionResults } = payload;
    if (!name) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing name" }) };
    }

    const { RESEND_API_KEY } = process.env;
    if (!RESEND_API_KEY) {
      return { statusCode: 500, body: JSON.stringify({ error: "RESEND_API_KEY not configured" }) };
    }

    const toAddress = process.env.CERT_EMAIL_TO || "kmcanally@andrewslogistics.com";
    const fromAddress = process.env.CERT_EMAIL_FROM || "onboarding@resend.dev";

    const sectionRows = Object.entries(sectionResults || {})
      .map(([key, r]) => `<tr>
          <td style="padding:6px 12px;border:1px solid #ddd;">${escapeHtml(key)}</td>
          <td style="padding:6px 12px;border:1px solid #ddd;">${r.score}/${r.total}</td>
          <td style="padding:6px 12px;border:1px solid #ddd;color:${r.passed ? "#1e8f4e" : "#c23a2e"};">
            ${r.passed ? "Passed" : "Not passed"}
          </td>
        </tr>`)
      .join("");

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#0b2545;color:#fff;padding:16px 20px;border-radius:8px 8px 0 0;">
          <h2 style="margin:0;">Bendix EC-80 / Fusion Troubleshooting Training</h2>
          <p style="margin:4px 0 0;">Certificate of Completion</p>
        </div>
        <div style="border:1px solid #d5dfe8;border-top:none;padding:20px;border-radius:0 0 8px 8px;">
          <p>This certifies that</p>
          <h1 style="color:#1560bd;border-bottom:2px solid #e8a628;display:inline-block;padding-bottom:4px;">
            ${escapeHtml(name)}
          </h1>
          <p>has successfully completed the course with a final score of <b>${escapeHtml(String(score))}%</b>.</p>
          <p style="color:#555;font-size:.9rem;">Completed: ${escapeHtml(String(date))}</p>

          <h3 style="margin-top:24px;">Section-by-section results</h3>
          <table style="border-collapse:collapse;width:100%;font-size:.9rem;">
            <tr style="background:#eef2f6;">
              <th style="padding:6px 12px;border:1px solid #ddd;text-align:left;">Section</th>
              <th style="padding:6px 12px;border:1px solid #ddd;text-align:left;">Score</th>
              <th style="padding:6px 12px;border:1px solid #ddd;text-align:left;">Result</th>
            </tr>
            ${sectionRows}
          </table>

          <p style="margin-top:20px;color:#555;font-size:.85rem;">
            Andrews Logistics LP — Preventive Maintenance Training
          </p>
        </div>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: `Bendix Troubleshooting Course <${fromAddress}>`,
        to: [toAddress],
        subject: `Certificate of Completion — ${name}`,
        html
      })
    });

    if (!res.ok) {
      const errBody = await res.text();
      return { statusCode: 502, body: JSON.stringify({ error: "Resend send failed", detail: errBody }) };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

function escapeHtml(str){
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
