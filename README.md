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
