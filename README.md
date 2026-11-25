# ClipMitra AI

Turn long videos into 3–4 vertical, captioned, ready-to-post clips — fully local, using open-source models.

**Status:** Phase 4 done — upload → transcribe → AI highlights → speaker-tracked 9:16 clips with
word-by-word Hinglish captions → editor (trim, caption styles, word fixes, live preview) → export.
Phase 5 testing done: 15/15 matrix cases, milestone met — see [docs/TEST_REPORT.md](docs/TEST_REPORT.md)
and [PROJECT_PLAN.md](PROJECT_PLAN.md).

## Quick start (Windows)

```powershell
./scripts/setup.ps1          # one-time: Python 3.12 venv, pip + npm deps
ollama pull qwen3:4b         # one-time: local LLM (~2.5 GB)
./scripts/dev-backend.ps1    # API on http://127.0.0.1:8000
./scripts/dev-frontend.ps1   # UI  on http://localhost:3000
```

Verify the AI stack: `backend/.venv/Scripts/python scripts/verify_stack.py`

The UI is served under `/clipmitra` (dev: http://localhost:3000/clipmitra/).

## Live: https://nishtek.in/clipmitra

The interface is a static site on GitHub Pages (repo `Nishkam-b/nishkam-b.github.io`, folder `clipmitra/`).
All processing still runs on the visitor's own computer: the page talks to the engine at `http://127.0.0.1:8000`.

- Start Ollama and `scripts\dev-backend.ps1`, then open the live URL. Chrome/Edge ask once to allow
  **local network access** for nishtek.in — choose Allow (the page explains how if it was blocked).
- The engine only accepts requests from nishtek.in and localhost; other websites get 403.

Publish a new version:

```powershell
cd frontend; npm run build          # static export -> frontend/out
# replace clipmitra/ in a clone of Nishkam-b/nishkam-b.github.io with frontend/out, commit, push
```

Docs: [dependencies](docs/DEPENDENCIES.md) · [working rules](CLAUDE.md)
