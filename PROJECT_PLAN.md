# ClipMitra AI — Project Plan

> Living document. Update the status table and "Log" at the end of every phase.
> Rule: a feature is ✅ only after it was run and its output verified.

## 1. Goal

Turn a long video (start: ≤ 5 min, MP4/MOV) into 3–4 vertical 9:16 clips (1080×1920)
with animated word-level captions and speaker reframing, using **only local,
open-source models** (₹0/month, no paid APIs, no cloud GPUs).

**Milestone 1:** upload one 5-minute video → 4 captioned vertical clips, fully local.

## 2. Actual hardware (inspected 2026-11-24)

| Item | Brief assumed | **Actual machine** | Impact |
|---|---|---|---|
| GPU | RTX 3060 | **RTX 4050 Laptop, 6 GB VRAM** (~1.2 GB used by desktop) | ~4.5 GB usable → strictly one model on GPU at a time |
| Driver / CUDA | – | 591.66 / CUDA 13.1 driver | CTranslate2 needs CUDA 12 libs → installed via pip wheels |
| RAM | 16 GB | **24 GB** | Comfortable |
| CPU | – | Ryzen 7 7435HS, 8C/16T | MediaPipe runs on CPU fine |
| Disk | – | ~40 GB free on C: | Retention policy matters |
| OS | Windows 11 | Windows 11 Home | – |
| Python | – | Only 3.14 system-wide | **Backend uses a uv-managed Python 3.12 venv** (MediaPipe/CTranslate2 lack 3.14 wheels) |
| Node | – | 24.20 / npm 11.19 | OK |
| FFmpeg | – | 8.1.1 full build, has `h264_nvenc` | GPU encoding available |
| Ollama | – | Not installed → installed in Phase 1 | – |

### VRAM budget (sequential pipeline)

| Stage | Model | Device | Approx. VRAM | Released after? |
|---|---|---|---|---|
| Transcribe | faster-whisper `large-v3-turbo`, `int8_float16` (fallback `small`) | GPU | ~1.5–2 GB | Yes – model deleted + `gc` |
| Highlights | `qwen3:4b` (Q4_K_M) via Ollama, ctx 8192 | GPU | ~3–3.5 GB | Yes – `keep_alive: 0` |
| Face tracking | MediaPipe Face Landmarker | CPU | 0 | n/a |
| Render | FFmpeg `h264_nvenc` (fallback `libx264`) | NVENC | small | n/a |

All model choices are configurable through `backend/.env` (see `app/config.py`).

## 3. Architecture

```
frontend (Next.js, :3000)  ──HTTP──>  backend (FastAPI, :8000)
                                         ├── api/        routes (no filesystem paths ever returned)
                                         ├── services/   ffprobe, storage, system checks, (later) whisper/llm/face/render
                                         ├── workers/    single sequential GPU job worker (Phase 2)
                                         ├── models/     pydantic schemas + SQLite job store
                                         └── utils/
                       Ollama (:11434, local)   FFmpeg (CLI)
```

- **Job store:** SQLite (stdlib) — survives restarts, enables retry & duplicate detection.
- **Worker:** one in-process thread consuming a queue → GPU work never overlaps.
- **Duplicate prevention:** SHA-256 of each upload; identical file → same upload/job returned.
- **Privacy:** files addressed by random IDs only; API never returns disk paths; CORS limited to the frontend origin; server binds to 127.0.0.1.
- **Retention:** `RETENTION_HOURS` (default 72) – sweeper deletes old uploads/temp/outputs.

## 4. API

| Endpoint | Phase | Status |
|---|---|---|
| `GET /api/health` | 1 | ✅ |
| `GET /api/system` (GPU, FFmpeg, Ollama, Whisper readiness) | 1 | ✅ |
| `POST /api/upload` | 1 | ✅ |
| `GET /api/uploads/{id}`, `/thumbnail` | 1 | ✅ |
| `POST /api/process` `{upload_id, force}` — idempotent; retries failed/cancelled; `force` regenerates | 2 | ✅ |
| `GET /api/jobs`, `GET /api/jobs/{job_id}` | 2 | ✅ |
| `POST /api/jobs/{job_id}/cancel` | 2 | ✅ |
| `GET /api/jobs/{job_id}/clips` | 2 | ✅ |
| `GET /api/clips/{clip_id}`, `/video` (range requests), `/thumbnail` | 2 | ✅ |
| `GET /api/clips/{clip_id}/download` (attachment, Unicode filename) | 2 | ✅ |
| `GET /api/clips/{clip_id}/editor` (words, style, presets, fonts, crop path, limits) | 4 | ✅ |
| `PUT /api/clips/{clip_id}` `{start_time, end_time, style, word_edits}` → queued re-render | 4 | ✅ |
| `GET /api/uploads/{id}/video` (original, for live preview), `GET /api/fonts/{file}` (whitelist) | 4 | ✅ |
| `GET /api/jobs/{job_id}/export.zip` | 4 | ✅ |

Processing states: `uploading → extracting_audio → transcribing → finding_highlights →
tracking_speakers → creating_captions → rendering_clips → completed | failed`.

## 5. Phases & status

### Phase 1 — Basic infrastructure ✅ (2026-11-24, one caveat: see log)
- [x] Folder structure, docs, .gitignore
- [x] Backend: FastAPI app, config, upload endpoint (streamed, validated by ffprobe, size/duration limits, SHA-256 dedupe)
- [x] Backend: `/api/system` readiness report, `/api/uploads/{id}`, `/api/uploads/{id}/thumbnail`
- [x] Frontend: Next.js 16 + Tailwind 4 shell (sidebar, upload screen per mockup, Settings = live system status), real upload progress, size + duration display
- [x] Verify GPU visible to CTranslate2
- [x] Verify FFmpeg (+ NVENC 1080×1920 encode)
- [x] Install Ollama 0.40.18 + pull `qwen3:4b`, verify schema-constrained JSON
- [x] faster-whisper `large-v3-turbo` GPU transcription with word timestamps on real speech
- [x] Automated tests: 10 passing (upload validation, dedupe, path-leak check, temp cleanup, audio decode)

### Phase 2 — AI processing ✅ (2026-11-25)
- [x] Job + clip tables in SQLite, sequential worker thread, retry, cancel, resume-after-restart, retention sweep
- [x] Audio extraction (16 kHz mono WAV via FFmpeg)
- [x] Transcription with word timestamps → `outputs/<job>/transcript.json` (cached: retries/regenerations skip it)
- [x] Highlight selection with Qwen3 by *sentence index* (schema JSON), validated: 20–60 s, no overlap, inside video,
      whole-sentence boundaries, hook must be real transcript words, fallback windows if the AI gives too few
- [x] Cut clips (original framing, NVENC → libx264 fallback), each verified with ffprobe before it is listed
- [x] Processing page (live stages, %, ETA, live transcript line, cancel, retry) + results grid (play, download, regenerate) + My Projects

### Phase 3 — Video intelligence ✅ (2026-11-25)
- [x] MediaPipe Face Landmarker at 5 fps — tiled scan + ROI follow (see log for why)
- [x] Target-face selection (size × mouth movement, then nearest), crop path: median → dead-zone → eased, speed-limited camera
- [x] Layouts: `track` (moving 9:16 crop), `native` (already vertical), `fit` (blurred background: screen recordings / no face)
- [x] 1080×1920 render in one FFmpeg pass (sendcmd crop + scale + subtitles), NVENC with x264 fallback, ffprobe-verified
- [x] Word-level ASS captions from Whisper timestamps; presets `bold` (active-word highlight), `karaoke` (fill), `minimal` (box); Devanagari via Nirmala UI

### Phase 4 — Editor ✅ (2026-11-25)
- [x] Results grid (thumbnails, title, duration, play, download, regenerate, **Edit**, render status)
- [x] Trim start/end: dual-handle timeline with word ticks, ±0.1 s nudges, set-to-playhead, snap-to-words
- [x] Caption editor: 4 presets (bold / karaoke / minimal / headline), 9 Google Fonts (static TTFs, 4 with
      Devanagari), regular/bold, size, words per line, highlight/karaoke/none, text/highlight/outline colours,
      outline + shadow, box background + opacity, top/middle/bottom
- [x] Word corrections (fix Whisper mishearings, hide a word) — text only, timing untouched
- [x] Live preview (original video in 9:16 frame following the saved crop path + HTML captions using the same
      font files and layout logic) and "Saved render" tab showing the exact output
- [x] Re-render through the same worker queue; old clip kept until the new one is ffprobe-verified
- [x] Export page: per-clip MP4 + download-all ZIP

### Phase 5 — Testing ✅ (2026-11-25) — full results in [docs/TEST_REPORT.md](docs/TEST_REPORT.md)
- [x] Repeatable matrix: `scripts/phase5_fixtures.py` + `scripts/phase5_matrix.py --cold` (15 cases, all pass)
- [x] **Milestone met:** ~5-min (4:22) talking-head video → 4 speaker-tracked, captioned 1080×1920 clips in 50 s
- [x] Resolutions 480p25 / 720p60 / 1080p / 4K / square / rotated phone; two people; male + female voices;
      noise down to −4.5 dB SNR (WER 1.4–4.9%); corrupt / too long / no-speech inputs
- [x] Failure recovery: Ollama stopped → clear error + Retry; backend killed mid-job → resumes; low VRAM → CPU
- [x] GPU/RAM per stage measured (peak 5.7 / 6.1 GB VRAM during Qwen3; ClipMitra < 2.5 GB RAM)
- [x] 6 bugs found and fixed with regression tests (rotation, two-person drift, cutaway switching,
      pan-instead-of-cut, unusable low-VRAM Hindi, layout coverage); tests 89 → 96

### Go-live (2026-11-25) — https://nishtek.in/clipmitra
- Frontend is a static export (`output: "export"`, `basePath: "/clipmitra"`, query-string routes `?id=`)
  published as a folder of the existing GitHub Pages site; engine stays on the user's PC (₹0, private).
- Engine: CORS allows nishtek.in, answers Private Network Access preflights, and rejects any other website
  (403) — browsers allow blind cross-site uploads to 127.0.0.1 otherwise.
- Verified: static build served under /clipmitra against the engine (upload page, projects, job, editor,
  deep-link reload, auto-reconnect, offline screen). On the live domain, Chrome 156 enforces Local Network
  Access: needs the visitor's one-time Allow. The page shows fix-it steps when blocked.
- ✅ Live connection confirmed by the user in their own browser (2026-11-25): nishtek.in/clipmitra →
  Allow → connected to the local engine.

### Paste-a-link + public release (2026-11-25)
- **Paste video link** (user decision: any platform + rights tick): `POST /api/fetch` requires
  `confirm_rights`; yt-dlp reads metadata first (rejects live, playlists, > 5 min without downloading),
  downloads ≤1080p MP4, then the normal upload checks. YouTube needs a JS runtime (Deno via installer, or Node).
  Verified: Creative-Commons YouTube talk (3:35) fetched in ~10 s → 4 clips in 54 s; 10:35 video refused
  from metadata; private/unavailable/unsupported links get plain-language errors. 112 tests.
- **Public repo:** https://github.com/Nishkam-b/clipmitra (MIT). Commit author rewritten to the GitHub
  no-reply address before publishing (user decision).
- **One-click installer** (`install.ps1`, `irm … | iex`): winget FFmpeg/Ollama/Deno/uv, app in
  `%LOCALAPPDATA%\ClipMitra\app`, data in `…\data` (kept on update), Python 3.12 env, models, shortcuts.
  Verified: fresh install into a folder with a space in 302 s (incl. 1.6 GB Whisper); update in 9–13 s keeping
  data; installed engine processed a video (2 tracked clips, 38 s) and fetched YouTube via Deno; shortcut
  command starts the engine; public path (script + GitHub ZIP) tested. Bugs fixed: unquoted args with spaces,
  stale PATH making winget abort on re-run, running engine blocking the update.
- Not tested: a truly fresh Windows PC (tools were already present here except Deno/uv), non-NVIDIA PCs,
  Safari/Firefox.

## 6. Deferred / out of scope for MVP
- ~~"Paste video link"~~ — built (see "Paste-a-link + public release" above), with a rights confirmation.
- Pyannote diarization (later phase, needs HF token + license acceptance).
- Multi-speaker switching beyond simple "largest/most active face".
- Videos > 5 min (raise `MAX_DURATION_SECONDS` once pipeline is proven; mockups show 30 min).

## 7. Log

### 2026-11-24 — Phase 1 complete

**Verified (actually run):**
- `pytest`: 10/10 pass. Fixtures are real FFmpeg-generated videos.
- Browser E2E: dropped a 58 MB, 2:00, 1280×720 MP4 onto the upload zone → progress 0→42→85→100% →
  "Checking video…" → verified card with server thumbnail and metadata. File stored as `<uuid>.mp4`, no `.part` leftovers.
  Dropping a fake `.mp4` shows "This file is not a readable video."
- `scripts/verify_stack.py`: GPU ✅ · NVENC 1080×1920 ✅ · Whisper large-v3-turbo on CUDA, exact transcript,
  19 word timestamps, ~0.6 GB VRAM, released after `del` ✅ · Qwen3-4B 100% GPU, ~3.9 GB incl. 8k ctx,
  56–63 tok/s warm, 2.5 s load (first cold load ~75 s), schema-valid JSON, unloads with `keep_alive: 0` ✅
- `next build`, `tsc`, `eslint`: clean.

**Problems found & fixed:**
- MOV uploads reported container "mp4" (probe ran on the `.part` temp file) → pass original extension.
- faster-whisper 1.2.1 + PyAV 19 incompatibility (`metadata_errors` kwarg removed) → we decode audio with
  FFmpeg to a float32 array (`app/services/audio.py`) and never use PyAV decoding.

**Caveat — project path length:** CTranslate2's `_ext.pyd` fails to load ("filename or extension is too long")
when the project sits under a very deep folder: venv paths exceed Windows' 260-char MAX_PATH. Keep the project
at a short path (e.g. `C:\dev\clipmitra`) or enable Win32 long paths. Whisper verified from a short-path venv.

**Lessons for Phase 2:**
- An Ollama model left resident (default keep_alive 5 min) left only 786 MB free VRAM. The worker must
  unload Ollama models (`keep_alive: 0` / check `/api/ps`) **before** loading Whisper, not only after.
- Check free VRAM before each GPU stage; fall back to `whisper_fallback_model` / CPU if below `min_free_vram_mb`.

**Update:** project moved to `C:\dev\clipmitra\clipmitra`. venv rebuilt with `scripts/setup.ps1` (fixed: it
aborted on uv's stderr progress output in PowerShell 5.1). `pytest` 10/10 and `verify_stack.py` 4/4 PASS in the
project's own venv — Whisper now loads directly, path-length caveat resolved.

### 2026-11-25 — Phase 2 complete

**Verified (actually run):**
- `pytest`: 35/35 (upload, audio, highlight validation incl. Hindi/unpunctuated cases, job API idempotency/retry/cancel).
- `scripts/e2e_pipeline.py` on a 3:37 English speech video (`scripts/make_sample_video.ps1`): **4 clips in 120 s**
  cold (Whisper ~17 s for 3.6 min of audio; Qwen3 cold load dominated). Regenerate with cached transcript: **24 s**.
  Peak VRAM 5.1 GB / 6 GB (during Qwen3). All clips ffprobe-verified, 22–28 s.
- Browser E2E with a real 65 s 1080×1920 **Hindi** talking-head video: upload → Generate → live processing page →
  2 clips (target for 65 s) → played in-page at 1080×1920, downloaded as valid MP4, range requests (206) work.
- Cancel mid-transcription: stopped in 3.1 s, VRAM released (2549 → 1521 MiB), no partial files; retry completed.

**Problems found & fixed during testing:**
- Clips started mid-sentence (30-word force split) → split only at sentence ends/pauses; forced splits flagged and
  boundaries snapped to whole sentences.
- "300 ,000", "80 %", "10 -minute" → tokens joined with punctuation-aware rules.
- Whisper hallucinated a lone "4." in a pause (prob 0.07) → words with prob < 0.1 ignored when building sentences.
- Clips ran into the "thanks for watching" outro; all clips hugged the 20 s minimum → prompt: skip intros/outros,
  aim for 30–45 s, explicit length formula.
- **Hindi video produced zero clips**: Whisper emitted Hindi with no punctuation → transcripts with < 1 sentence end
  per 40 words now split at Whisper segment boundaries; validator relaxes whole-sentence rule rather than reject all.
- `\w` regex drops Devanagari vowel signs → broke hook grounding and download filenames; switched to whitespace
  tokenisation / Unicode-category check.
- LLM pasted a whole sentence as the title → titles over 10 words are shortened.
- Next 16: `usePathname`/`useParams` must be inside `<Suspense>`.

**Known limitations (for later phases):**
- Clips keep the original framing (16:9 stays 16:9) — 9:16 reframing + captions are Phase 3.
- Whisper writes Hindi in Devanagari; many Indian creators caption in Roman-script Hinglish → decide in Phase 3
  (option: transliteration step).
- Editorial quality depends on Qwen3-4B; on a 65 s video it picked a reasonable intro + feature segment.
- Clip times can't be edited yet (Phase 4).
- The preview tool in this desktop app still points at the session's old scratch folder; run servers with
  `scripts/dev-backend.ps1` / `scripts/dev-frontend.ps1`.

### 2026-11-25 — Phase 3 complete

**Verified (actually run):**
- `pytest`: 57/57 — adds caption timing/escaping/Devanagari, crop-path smoothing, layout choice, real FFmpeg renders
  of all three layouts with Devanagari captions, LLM retry/fallback.
- Tracking accuracy on a landscape test (the 9:16 reel sliding across a 1920×1080 frame, ground truth known):
  face inside the crop in **99%** of frames, max crop step 12 px/frame (smooth), ~33 analysed frames/s on CPU.
  Frames without detections were checked by eye: they genuinely show graphics / head down.
- E2E through the API: landscape talking head → 2 × `track` (full pipeline 43 s for 65 s input);
  no-face 3:37 video → 4 × `fit` (regenerate 42 s); already-vertical Hindi reel → 2 × `native` (20 s).
  All clips 1080×1920, ffprobe-verified. Results page shows 9:16 players with layout badges; playback verified.
- Captions visually checked at full resolution: Devanagari shaping correct (HarfBuzz), outline crisp.

**Problems found & fixed:**
- MediaPipe's detector (short-range/selfie model) found **zero** faces in 16:9 frames where the face is ~8% of
  the width → scan overlapping square tiles (side = frame height) and then follow the face in a tight ROI.
- Regenerate took 152 s: Qwen3 at higher temperature produced 3,651 tokens (runaway) → `num_predict` cap,
  schema `maxItems`/`maxLength`, one retry on unreadable output, then fallback windows (never a failed job).
- No-face clips were slow: full 3-tile scan every frame + full-res blur → adaptive scan (every other frame after
  1 s without faces) and quarter-res blur. 69 s → 42 s.
- FFmpeg runs in the clip folder to avoid Windows path escaping in filter args; inputs resolved to absolute paths.

**Known limitations:**
- One speaker at a time; no switching between speakers in two-person podcasts (needs diarization — later phase).
- ~~Captions use the transcript script as-is~~ → resolved below (Roman Hinglish).
- Caption style is a server setting (`CLIPMITRA_CAPTION_STYLE`); the visual editor is Phase 4.
- Bold preset uppercases Latin words inside Hindi lines ("का AUTO CAPTION").

### 2026-11-25 — Roman Hinglish captions (user decision)
- `app/services/translit.py`: deterministic Devanagari → Hinglish (dictionary of common words + creator
  loanwords → English spelling, akshara parser, schwa deletion, "long vowel only in first syllable" style).
  Word-for-word, so caption timing is untouched and no model can alter what was said.
- `CLIPMITRA_CAPTION_SCRIPT=roman` (default) or `native`. Applies to captions, hook, title, transcript shown in
  the app; `transcript.json` keeps the original Devanagari.
- Verified against the creator's own burned-in Hinglish captions in the test reel: "lekin ise banana itna aasan
  nahi tha", "suraj ke saath", "sab kuch ek hi" match exactly. 64/64 tests pass; reel + landscape jobs
  re-rendered and checked visually.
- Remaining errors are Whisper mishearings (e.g. "toobhi" for "tool bhi", "votar maarkin" for "watermark"),
  not transliteration. Possible later fix: Whisper `initial_prompt` with creator vocabulary.

### 2026-11-25 — Phase 4 complete

**Verified (actually run):**
- `pytest`: 89/89 — adds editor payload, edit validation (range, length, style, word edits, path-like keys),
  409 while rendering, font whitelist, ZIP export, CORS preflight for PUT, style validation.
- Font test card rendered through FFmpeg/libass: all 9 families load, Regular vs Bold pick distinct files,
  Devanagari shapes correctly in Poppins/Mukta/Hind/Kalam.
- Browser E2E on a tracked clip: switched to Headline preset, typed corrections "cloud"→"Claude" and
  "jaamne"→"Gemini" (real Whisper mishearings), nudged start −0.5 s, Save & render → `rendering → ready` in 7 s,
  v2, 21.7 s, 1080×1920; `clip_1.ass` uses Anton 112 and contains CLAUDE/GEMINI, no trace of the old words;
  frames show "MAINE CLAUDE" / "GEMINI DONO" on a face-centred crop. Export ZIP downloaded with both clips;
  temp ZIP removed afterwards. `next build` passes.

**Problems found & fixed:**
- Save failed: CORS preflight rejected `PUT` (allow_methods was GET/POST) → added PUT + regression test.
  The UI correctly kept the unsaved edits and showed "Couldn't save".
- Trim handles rendered as default sliders: Turbopack's persistent cache served stale CSS even after a dev-server
  restart → cleared `.next` (documented in CLAUDE.md).
- Clips made before Phase 4 have no saved crop path → preview centres the crop until the first re-render.
- Font licences in the fonts folder made libass log errors → moved to `assets/fonts/licenses/`.

**Known limitations:**
- The live preview approximates the blurred background (uses the clip thumbnail) and libass line-wrapping;
  the "Saved render" tab is the exact output.
- When the trim extends beyond the previously rendered range, the preview holds the nearest crop position;
  the render recomputes tracking for the new range.
- Regenerating a whole job replaces its clips, including manual edits.
- Word *timing* can't be edited (by design: text-only corrections).
