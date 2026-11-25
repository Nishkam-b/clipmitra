# CLAUDE.md — working rules for ClipMitra AI

Read `PROJECT_PLAN.md` first; it has the phase status and hardware facts.

## Hard rules
- **No paid AI APIs, no cloud GPUs.** Only local open-source models (faster-whisper, Ollama/Qwen3, MediaPipe, FFmpeg).
- **6 GB VRAM** (RTX 4050 Laptop). Never hold two GPU models at once. Load → use → `del` + `gc.collect()`; Ollama calls use `keep_alive: 0`, and unload any resident Ollama model *before* loading Whisper.
- Keep the project at a **short path** — deep paths break CTranslate2's DLL load (Windows MAX_PATH).
- Hindi captions are shown in **Roman Hinglish** by default (user decision, `caption_script`); keep transliteration word-for-word so timings stay exact.
- Test every text-processing change on **Hindi/Hinglish** too: Whisper may emit no punctuation, and `\w` regexes break Devanagari (vowel signs are combining marks).
- Never let faster-whisper decode files itself (PyAV ≥ 19 incompatibility); pass `app.services.audio.load_audio()` output.
- Never mark a feature done until it was executed and its output files verified (exist, ffprobe-valid, non-zero duration).
- No mock data in the production workflow. Test fixtures live in `backend/tests/` only.
- Never return filesystem paths in API responses or errors. Use IDs.
- Never invent transcript text; LLM highlight output must be validated against the transcript and video duration.
- Don't download videos from URLs (YouTube etc.) — direct uploads only.
- Don't commit models, uploads, outputs, temp files, `.env`.

- Caption fonts live in `backend/assets/fonts` (static Google Fonts TTFs, `scripts/fetch_fonts.ps1`); the same files serve libass and the editor preview. Register new fonts in `app/services/fonts.py`.
- Keep `frontend/lib/captions.ts` in sync with `backend/app/services/captions.py` (pagination/timing) so the preview matches renders.
- If a CSS change doesn't show in `next dev`, stop the server and delete `frontend/.next` (Turbopack persistent cache).

- Before changing tracking, transcription or rendering: run `scripts/phase5_matrix.py --cold` (backend running) and compare with `docs/TEST_REPORT.md`. Check tracking with the saved `clip_N.reframe.json` paths, not just pass/fail.
- Low VRAM must never silently degrade Hindi: the default fallback runs the same Whisper model on CPU.

## Layout
- `backend/` FastAPI (Python **3.12** venv at `backend/.venv`, created by `scripts/setup.ps1`)
  - `app/main.py` app factory · `app/config.py` settings (env prefix `CLIPMITRA_`)
  - `app/api/` routes · `app/services/` logic · `app/models/` schemas/store · `app/workers/` GPU worker
- `frontend/` Next.js App Router + TypeScript + Tailwind. API base URL: `NEXT_PUBLIC_API_URL` (default `http://127.0.0.1:8000`).
- `scripts/` setup, dev, and verification scripts (PowerShell).

## Commands
```powershell
./scripts/setup.ps1              # venv + pip deps + npm install
./scripts/dev-backend.ps1        # uvicorn on 127.0.0.1:8000
./scripts/dev-frontend.ps1       # next dev: http://localhost:3000/clipmitra/
backend/.venv/Scripts/python -m pytest backend/tests
backend/.venv/Scripts/python scripts/verify_stack.py   # GPU / FFmpeg / Ollama / Whisper smoke test
./scripts/make_sample_video.ps1                         # 3.5 min speech test video -> backend/temp/
backend/.venv/Scripts/python scripts/e2e_pipeline.py backend/temp/sample_podcast.mp4 [--force]  # needs backend running
```

## Conventions
- Python: type hints, pydantic models for every response, `subprocess` with arg lists (never shell strings).
- FFmpeg/ffprobe paths come from settings, not hard-coded.
- UI: light mode, restrained violet accent (`#7c3aed` family), generous spacing, beginner-friendly copy.
- After each phase: run tests, update `PROJECT_PLAN.md` status + log.
