# ClipMitra AI — Phase 5 Test Report

**Date:** 2026-11-25 · **Machine:** RTX 4050 Laptop (6,141 MiB VRAM, ~1.3 GB used by Windows at idle),
24 GB RAM, Ryzen 7 7435HS · **Models:** faster-whisper large-v3-turbo (int8_float16), Qwen3-4B via Ollama,
MediaPipe Face Landmarker (CPU).

Everything below was actually run. Reproduce with:

```powershell
backend\.venv\Scripts\python scripts\phase5_fixtures.py    # builds the test videos (backend\temp\phase5)
backend\.venv\Scripts\python scripts\phase5_matrix.py --cold   # runs them all, writes docs\phase5_results.json
```

The matrix uploads each video to the live backend, processes it, samples GPU memory/utilisation (nvidia-smi),
backend + Ollama RAM and system RAM every 0.5 s (tagged by pipeline stage), verifies every clip with ffprobe
(1080×1920, duration, audio) and computes word error rate (WER) where the spoken text is known.
`--cold` deletes cached transcripts so every stage is measured.

## 1. Result: 15 / 15 cases pass

| Case | Source | Total | Transcribe | Highlights | Tracking | Render | Clips | Layout | WER |
|---|---|---|---|---|---|---|---|---|---|
| **Milestone** ~5 min English talking head | 1920×1080 30fps 4:22 | **50 s** | 17 s | 14 s | 8 s | 9 s | **4** | track | 1.4% |
| 480p, 25 fps | 854×480 | 39 s | 17 s | 12 s | 5 s | 4 s | 2 | track | |
| 720p, 60 fps | 1280×720 | 43 s | 16 s | 11 s | 6 s | 9 s | 2 | track | |
| 4K | 3840×2160 | 41 s | 16 s | 10 s | 6 s | 6 s | 2 | track | |
| Square | 1080×1080 | 37 s | 16 s | 11 s | 3 s | 5 s | 2 | track | |
| Phone video stored sideways + rotation flag | 1080×1920 shown | 47 s | 18 s | 22 s | — | 5 s | 2 | native | |
| Two people in frame | 1920×1080 | 48 s | 20 s | 13 s | 9 s | 5 s | 2 | track | |
| Female voice (Zira) | 1280×720 1:49 | 45 s | 9 s | 21 s | 3 s | 10 s | 3 | fit | 3.3% |
| Male voice, clean | 1280×720 2:07 | 69 s | 22 s | 30 s | 4 s | 12 s | 4 | fit | 3.9% |
| Noise ~7 dB below speech | 2:07 | 56 s | 11 s | 29 s | 5 s | 11 s | 3 | fit | 3.9% |
| Noise as loud as speech (≈0 dB SNR) | 2:07 | 58 s | 12 s | 27 s | 5 s | 14 s | 4 | fit | 3.9% |
| Noise louder than speech (≈−4.5 dB SNR) | 2:07 | 55 s | 12 s | 27 s | 4 s | 12 s | 4 | fit | 4.9% |
| Truncated / corrupt MP4 | | rejected at upload: *"This file is not a readable video."* | | | | | | | |
| 5:30 video | | rejected at upload: *"Video is longer than 5 minutes."* | | | | | | | |
| Music only, no speech | | job fails cleanly: *"We couldn't hear any speech in this video."* | | | | | | | |

Notes: times are wall-clock from upload to completed, including the Qwen3 load. The very first job after
starting Ollama adds ~60 s (model loaded from disk; seen once at 77 s for the milestone). WER compares Whisper's
words with the script that was spoken (numbers/punctuation normalised), so it measures transcription accuracy.
The milestone video is 4:22 rather than 5:00: the 5-minute limit allows 1 s of tolerance and the slowest
built-in voice ran 5:01. The rotated case's "Source" shows the displayed size.

Tracking quality on tracked clips (from the saved crop paths): **0 unwanted cuts**, fastest pan 50–320 px/s at
1080p (speed limit 0.55 frame-widths/s). The single cut in the milestone is correct: that test video loops and
the face jumps across the frame at the loop point.

## 2. Resource use (peaks across all cases)

| Stage | Peak VRAM | Peak GPU | Backend RAM | Ollama RAM | System RAM |
|---|---|---|---|---|---|
| Idle (Windows desktop) | 1.3 GB | — | — | — | — |
| Upload / extract audio | 1.9 GB | 7% | 0.9 GB | 0.1 GB | 13.7 GB |
| Transcribing (Whisper on GPU) | 3.1 GB | 100% | 2.5 GB | 0.1 GB | 15.2 GB |
| Finding highlights (Qwen3-4B, 8k ctx) | **5.7 GB** | 100% | 1.0 GB | 0.4 GB | 15.0 GB |
| Tracking speakers (MediaPipe, CPU) | 1.8 GB | 14% | 1.4 GB | 0.3 GB | 14.3 GB |
| Rendering (NVENC) | 2.0 GB | 29% | 1.7 GB | 0.2 GB | 14.1 GB |

- The models never share the GPU: VRAM drops back after Whisper and after Qwen3 (`keep_alive: 0`).
- **Headroom is tight during highlight finding** (5.7 of 6.1 GB). With other GPU-heavy apps open, Ollama will
  partly run Qwen3 on the CPU — slower, not a failure. The 24 GB of RAM is never a constraint
  (ClipMitra itself stays under 2.5 GB; the ~13 GB baseline is the rest of the system).

## 3. Failure and recovery tests

| Scenario | Result |
|---|---|
| Ollama stopped | Job fails at *Finding highlights* with *"The local AI (Ollama) isn't running. Start Ollama, then press Retry."*; Settings shows "Ollama is not running". After restarting Ollama, Retry completed in 27 s (transcript reused). ✅ |
| Backend killed at 38% of transcription | On restart the job resumed by itself, completed in 67 s, exactly 2 clips, no duplicate or partial files. ✅ |
| Too little free GPU memory for Whisper | See bug 5: now runs the same model on the CPU — accurate (270 words, same text), 105 s for 65 s of audio. ✅ |
| Cancel during transcription (Phase 2) | Stops in ~3 s, frees VRAM, no partial files; Retry completes. ✅ |
| Corrupt / too long / no speech | Rejected or failed with a clear message (table above). ✅ |

## 4. Bugs found by Phase 5 — all fixed, each with a regression test

1. **Phone videos stored sideways were treated as landscape.** iPhones often save portrait video as 1920×1080
   pixels plus a "rotate 90°" flag; ClipMitra read the stored size, so the clip got a blurred-background layout.
   Fix: the probe applies the display rotation (`media.py`), and the worker re-probes the source at every job
   so old uploads benefit too.
2. **With two people on screen the camera drifted to the other person.** The detector followed only the face it
   saw last, so after a cutaway the original speaker was found only once per second. Fix: every known face is
   followed in its own window each frame (`face.py`).
3. **Brief look-aways and cutaways caused a switch of person.** Fix: the target counts as lost only while
   *someone else* is visible, and the camera switches only after 3 s of that.
4. **Switching person was a slow pan across the room.** Fix: a jump larger than the frame width is a hard cut
   on a single frame, like an editor would do.
5. **Low-VRAM fallback produced unusable Hindi.** The `small` model returned garbled Devanagari and under half
   the words (120 vs 268). Fix: when VRAM is short, run the same large-v3-turbo on the CPU instead
   (`whisper_low_vram_strategy = "cpu"`, default). The old behaviour remains available as `small_gpu`.
6. (Side effect caught while fixing 3) layout choice used "target visible" instead of "any face visible",
   which pushed a clip with a face 58% of the time to the blurred layout. Fix: layout uses any-face coverage.

Test count: 89 → **96** automated tests, all passing.

## 5. Known limitations (not fixed in the MVP)

- **No active-speaker switching** in multi-person podcasts: the camera stays with one person and changes only
  if they're absent for 3 s. Proper switching needs speaker diarization (Pyannote, a later phase).
- **Test speech is synthetic.** Noise and voice tests use Windows SAPI voices (clean diction, known text). Real
  speech, accents and Hinglish code-switching are only covered by the creator's own reel (Hindi, real, no
  ground-truth text). A few real recordings with hand-checked transcripts would strengthen this.
- **Two-person test uses the same person mirrored**, which also confuses the face detector more than two real
  people would.
- **First job after starting Ollama is ~60 s slower** (model load).
- **CPU fallback is slow:** ~1.6× real time for transcription (≈8 min for a 5-minute video).
- Highlight choice quality was judged by eye on a handful of videos, not measured.
