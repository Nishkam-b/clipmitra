# ClipMitra AI

Turn long talking-head videos and podcasts into **3–4 vertical, captioned, ready-to-post clips** for
Instagram Reels, YouTube Shorts and TikTok — **entirely on your own computer**, for free.

**Open the app:** https://nishtek.in/clipmitra

- Upload a video or **paste a link** (YouTube, Instagram, Facebook, X, Vimeo…)
- AI finds the best moments, follows the speaker's face into a 9:16 frame and adds word-by-word captions
- Hindi speech is captioned in **Roman Hinglish** ("itna aasan nahi tha")
- Edit any clip: trim, 4 caption styles, 9 fonts, colours, fix misheard words — then download MP4s

Your videos never leave your machine. The page at nishtek.in only shows the interface; all AI work
(Whisper, Qwen3 via Ollama, MediaPipe, FFmpeg) runs in the ClipMitra engine on your PC.

## Install (Windows 10/11)

**[Download ClipMitra-Setup.exe](https://github.com/Nishkam-b/clipmitra/releases/latest/download/ClipMitra-Setup.exe)**,
open it and click **Install**. No administrator rights needed; it takes about 5–15 minutes.

> Windows may show *"Windows protected your PC"* because the installer isn't code-signed yet —
> click **More info → Run anyway**.

Setup installs FFmpeg, Ollama, Deno and uv (via winget), sets up the engine in `%LOCALAPPDATA%\ClipMitra`,
downloads the AI models (~4 GB) and adds a **ClipMitra** shortcut to your Desktop and Start menu.
Run it again any time to update — your videos and clips are kept. Uninstall from *Settings → Apps*.

Prefer PowerShell? This does the same:

```powershell
irm https://raw.githubusercontent.com/Nishkam-b/clipmitra/main/install.ps1 | iex
```

**Requirements:** 64-bit Windows 10/11, ~8 GB free disk. An NVIDIA GPU with 6 GB+ VRAM is recommended;
without one ClipMitra still works on the CPU, several times slower.

## Use

1. Double-click **ClipMitra** (starts the engine and opens https://nishtek.in/clipmitra).
2. The first time, your browser asks to allow the site to access apps on this device — choose **Allow**.
3. Upload a video (up to 5 minutes) or paste a link and tick *"I own this video or have permission"*.
4. Click **Generate Clips**, then edit and download.

Only fetch videos you own or have permission to use.

**Stop the engine:** `%LOCALAPPDATA%\ClipMitra\app\scripts\stop_clipmitra.ps1`
**Uninstall:** delete `%LOCALAPPDATA%\ClipMitra` and the ClipMitra shortcuts (Ollama, FFmpeg, Deno and uv
can be removed from *Settings → Apps*).

## How it works

| Stage | Local model / tool |
|---|---|
| Transcription with word timestamps | faster-whisper large-v3-turbo (GPU, CPU fallback) |
| Highlight selection | Qwen3-4B via Ollama |
| Speaker tracking → 9:16 crop | MediaPipe Face Landmarker |
| Captions + rendering | libass + FFmpeg (NVENC when available) |
| Link fetching | yt-dlp |

Test results on an RTX 4050 Laptop (6 GB): a ~5-minute video becomes 4 tracked, captioned clips in about
50 seconds. See [docs/TEST_REPORT.md](docs/TEST_REPORT.md).

## Developers

```powershell
./scripts/setup.ps1          # Python 3.12 venv + packages, frontend npm deps
ollama pull qwen3:4b
./scripts/dev-backend.ps1    # engine on http://127.0.0.1:8000
./scripts/dev-frontend.ps1   # UI on http://localhost:3000/clipmitra/
backend/.venv/Scripts/python -m pytest backend/tests
```

The UI is a static Next.js export (`frontend/out`) published to the `clipmitra/` folder of the
nishtek.in GitHub Pages site. The engine only accepts requests from nishtek.in and localhost.

Docs: [project plan](PROJECT_PLAN.md) · [dependencies](docs/DEPENDENCIES.md) · [test report](docs/TEST_REPORT.md)

## License

ClipMitra's code is released under the [MIT License](LICENSE). Bundled caption fonts are Google Fonts under the
SIL Open Font License ([backend/assets/fonts/licenses](backend/assets/fonts/licenses)). The AI models are
downloaded at install time under their own licenses: Whisper large-v3-turbo (MIT), Qwen3-4B (Apache-2.0),
MediaPipe Face Landmarker (Apache-2.0). FFmpeg, Ollama, yt-dlp and Deno are installed separately.
