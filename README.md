# Bendix ESP EC-80 / Fusion Troubleshooting Training

Browser-based training course for Andrews Logistics technicians, covering
troubleshooting of the **Bendix ESP EC-80 controller** (the tier equipped on
Andrews units) and the Bendix Fusion driver-assistance system (FLC-25 camera /
FLR-25 radar). Course content is deliberately built from the ESP service data
sheet rather than the base ABS/ATC sheet, since ABS/ATC-only controllers are
not what's on our fleet.

## What's in this repo

- `index.html` — the whole course (content, quizzes, certificate, reference viewer)
- `docs/` — the four source Bendix service data PDFs. `EC-80_ESP.pdf` is the
  primary reference used throughout the course; `EC-80_ABS-ATC.pdf` is kept in
  the library only as background reading (labeled as such in the reference
  picker) since it's not the controller tier on our trucks. All four are
  opened in-page via each section's "Reference Documents" buttons.
- `netlify/functions/check-name.js` — looks up a trainee's name in the results
  log; if they already passed, the course opens straight into **reference mode**
- `netlify/functions/record-result.js` — appends a completion record to
  `results/troubleshooting-results.json` in this repo via the GitHub Contents API
- `netlify/functions/send-certificate.js` — emails a certificate summary (name,
  score, date, section-by-section breakdown) to you via Resend whenever someone
  passes the full course
- `netlify.toml` — Netlify build/redirect config

This is a **separate** repo/site from the existing PM-Training-Classes course,
with its own dedicated results log — passing one course does not mark the
other as passed, and vice versa.

## One-time setup

1. **Create a new GitHub repo** (public), e.g. `kmcanallyALI/Bendix-Troubleshooting-Course`,
   and upload everything in this folder to it (including the `docs/` PDFs).
2. **Create a GitHub Personal Access Token** (fine-grained, scoped to just this
   repo, with Contents: Read and write).
3. **Create a new Netlify site** from that repo (or drag-and-drop deploy).
4. In Netlify: **Site settings → Environment variables**, add:
   - `GITHUB_TOKEN` = the PAT from step 2
   - `GITHUB_REPO` = `kmcanallyALI/Bendix-Troubleshooting-Course` (or whatever you name it)
   - `GITHUB_BRANCH` = `main` (optional, defaults to main)
5. Deploy. The first time anyone passes the course, this repo will automatically
   get a new `results/troubleshooting-results.json` file committed by the
   Netlify function — you don't need to create it by hand.

## Getting certificates emailed to you

Certificate emails are sent through [Resend](https://resend.com), which has a
free tier that's enough for this course's volume.

1. Sign up at resend.com **using kmcanally@andrewslogistics.com** as the account
   email. On Resend's free/unverified-domain tier, you can only send email *to*
   the address your account is registered under — so signing up with that
   address is what makes delivery to yourself work without any extra setup.
2. In the Resend dashboard, go to **API Keys** and create a new key.
3. In Netlify, add one more environment variable:
   - `RESEND_API_KEY` = the key from step 2
   - (Optional) `CERT_EMAIL_TO` — only needed if you ever want certificates to
     go somewhere other than kmcanally@andrewslogistics.com
   - (Optional) `CERT_EMAIL_FROM` — only needed once you verify your own sending
     domain in Resend; until then it defaults to Resend's built-in
     `onboarding@resend.dev` sender, which works with no setup
4. Redeploy (or just wait for the next deploy) so the function picks up the new
   variable.

That's it — from then on, whenever a trainee passes all sections, you'll get an
email with their name, final score, completion date, and a section-by-section
breakdown, in addition to the record being committed to
`results/troubleshooting-results.json`. If you later want certificates sent to
the trainee as well, that needs a name field for their email added to the
welcome screen — let me know and I'll wire that up.

## How the "already passed" check works

On the welcome screen, the trainee types their name and clicks Continue. The
page calls `check-name`, which reads `results/troubleshooting-results.json`
from GitHub and looks for a case-insensitive name match with `passed: true`.

- **Match found:** the trainee is dropped into reference mode — all sections
  and their reference-document buttons are available, no quiz required, with
  an option to retake the full test anyway.
- **No match:** the trainee proceeds through the five sections in order, each
  gated by an 80%-required quiz, ending in a printable certificate.

## Editing content

All course text, quiz questions, and section order live in the `SECTIONS`
array near the top of the `<script>` block in `index.html`. Reference PDFs are
listed in `REFERENCE_DOCS` at the top of the same script and just need to
exist under `docs/` with matching filenames.
