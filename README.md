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

Docs: [dependencies](docs/DEPENDENCIES.md) · [working rules](CLAUDE.md)
