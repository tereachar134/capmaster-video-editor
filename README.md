# CapMaster Video Editor

A CapCut-style, browser-based video editor prototype built with plain HTML, CSS, and JavaScript.

## Features

- Professional 3-panel editor layout (Media, Preview/Timeline, Inspector)
- Interactive timeline clips with trim handles
- Clip inspector controls:
  - Rename clip
  - Speed adjustment
  - Volume adjustment
  - Mute toggle
  - Notes
- Playback transport controls (play/pause, rewind/forward)
- Timeline zoom + snapping
- Project summary metrics:
  - Clip count
  - Total duration
  - Average speed
  - Muted clips
- Export summary modal

## Project Structure

- `index.html` – editor layout and UI structure
- `styles.css` – styling and responsive layout
- `app.js` – editor behavior and interaction logic

## Run Locally

```bash
python3 -m http.server 4173 --bind 0.0.0.0
```

Then open:

- `http://localhost:4173`

## Why files might not show in your repository

If files are visible locally but not on your Git hosting UI (GitHub/GitLab), common causes are:

1. **No remote is configured** for this local repository.
2. **Commits were made on a local branch** but not pushed.
3. **You are viewing a different branch** (e.g., `main`) on the hosting UI.
4. **Push failed** due to authentication/permissions.

In this environment, `git remote -v` returns nothing, which means there is currently **no connected remote** for this repo.

To publish files to GitHub, you typically:

```bash
git remote add origin <your-repo-url>
git push -u origin work
```

Then switch to the `work` branch in your repository UI (or merge into your default branch).
