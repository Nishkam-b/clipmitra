# Dependencies

All free / open-source. Nothing here calls a paid API.

## System tools

| Tool | Version verified | Install | Used for |
|---|---|---|---|
| NVIDIA driver | 591.66 (CUDA 13.1) | GeForce driver | GPU access |
| FFmpeg + ffprobe | 8.1.1 full build (NVENC enabled) | `winget install Gyan.FFmpeg` | probe, audio extract, cut, crop, captions, encode |
| Ollama | see PROJECT_PLAN log | `winget install Ollama.Ollama` | local LLM server (:11434) |
| Qwen3 4B | `qwen3:4b` (Q4_K_M, ~2.5 GB) | `ollama pull qwen3:4b` | highlight selection |
| uv | 0.13.x | `py -m pip install --user uv` | creates the Python 3.12 venv |
| Python | 3.12 (uv-managed, backend only) | `uv venv --python 3.12` | backend |
| Node.js / npm | 24.20 / 11.19 | nodejs.org | frontend |

## Python (backend/requirements.txt)

| Package | Why |
|---|---|
| fastapi, uvicorn[standard], python-multipart | HTTP API + streaming uploads |
| pydantic-settings | config from env / `.env` |
| httpx | Ollama client, tests |
| faster-whisper | transcription with word timestamps (CTranslate2). Verified 1.2.1 / ctranslate2 4.9.1. Audio is passed as a numpy array decoded by FFmpeg, because its PyAV decode path breaks with PyAV ≥ 19 |
| nvidia-cublas-cu12, nvidia-cudnn-cu12 (9.x) | CUDA 12 runtime DLLs for CTranslate2 on Windows (no system CUDA toolkit needed) |
| mediapipe | Face Landmarker (Phase 3, CPU) |
| opencv-python-headless, numpy | frame decoding for face tracking |
| pytest | tests |

## Model files (downloaded on first use, never committed)
- faster-whisper weights → `backend/models/whisper/` (HF hub cache, ~1.6 GB for large-v3-turbo, ~0.5 GB for small)
- Qwen3 → Ollama's own store (`%USERPROFILE%\.ollama\models`)
- MediaPipe `face_landmarker.task` → `backend/models/mediapipe/face_landmarker.task` (3,758,596 bytes,
  SHA-256 `64184E229B263107BC2B804C6625DB1341FF2BB731874B0BCC2FE6544E0BC9FF`), from
  `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`.
  mediapipe ≥ 1.x ships no legacy `solutions` models, so this file is required. Missing → landscape clips fall back
  to the blurred-background layout.
- Caption fonts: Google Fonts under the SIL Open Font License, static TTFs in `backend/assets/fonts`
  (`scripts/fetch_fonts.ps1`; licences in `assets/fonts/licenses/`): Poppins, Mukta, Hind, Kalam (Latin +
  Devanagari), Anton, Bebas Neue, Archivo Black, Lilita One, Bangers. ~3.4 MB. FFmpeg's libass must have
  HarfBuzz (Gyan full build does).

## Frontend (frontend/package.json)
Next.js (App Router), React, TypeScript, Tailwind CSS, ESLint. Fonts via `next/font/google`.
