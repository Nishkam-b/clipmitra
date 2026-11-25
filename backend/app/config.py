"""Application settings. Override with env vars prefixed CLIPMITRA_ or backend/.env."""
from __future__ import annotations

import shutil
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="CLIPMITRA_", env_file=BACKEND_DIR / ".env", extra="ignore"
    )

    # --- storage ---
    upload_dir: Path = BACKEND_DIR / "uploads"
    output_dir: Path = BACKEND_DIR / "outputs"
    temp_dir: Path = BACKEND_DIR / "temp"
    model_dir: Path = BACKEND_DIR / "models"
    db_path: Path = BACKEND_DIR / "data" / "clipmitra.db"
    retention_hours: float = 72.0

    # --- upload limits ---
    allowed_extensions: tuple[str, ...] = (".mp4", ".mov")
    max_upload_bytes: int = 2 * 1024**3  # 2 GB
    max_duration_seconds: float = 300.0  # start with 5 minutes
    duration_tolerance_seconds: float = 1.0

    # --- tools ---
    ffmpeg_bin: str = shutil.which("ffmpeg") or "ffmpeg"
    ffprobe_bin: str = shutil.which("ffprobe") or "ffprobe"

    # --- AI models ---
    whisper_model: str = "large-v3-turbo"
    whisper_compute_type: str = "int8_float16"
    whisper_fallback_model: str = "small"   # only with whisper_low_vram_strategy="small_gpu"
    whisper_min_vram_mb: int = 1500
    whisper_low_vram_strategy: str = "cpu"  # cpu (same model on CPU, accurate) | small_gpu (fast, weak on Hindi)
    whisper_language: str | None = None     # None = auto-detect
    ollama_url: str = "http://127.0.0.1:11434"
    llm_model: str = "qwen3:4b"
    llm_context: int = 8192
    llm_timeout_seconds: float = 300.0
    min_free_vram_mb: int = 2500

    # --- clip selection ---
    clip_min_seconds: float = 20.0
    clip_max_seconds: float = 60.0
    clips_target: int = 4

    # --- reframing + captions ---
    track_fps: float = 5.0                  # face detection samples per second
    output_width: int = 1080
    output_height: int = 1920
    caption_style: str = "bold"             # bold | karaoke | minimal
    caption_script: str = "roman"           # roman (Hinglish: "itna aasan nahi tha") | native (Devanagari)
    fonts_dir: str = str(BACKEND_DIR / "assets" / "fonts")  # Google Fonts (OFL) for libass + preview

    # --- worker ---
    worker_enabled: bool = True             # tests disable it to exercise the API without a GPU

    # --- http ---
    cors_origins: tuple[str, ...] = ("http://localhost:3000", "http://127.0.0.1:3000")

    def ensure_dirs(self) -> None:
        for d in (self.upload_dir, self.output_dir, self.temp_dir, self.model_dir, self.db_path.parent):
            d.mkdir(parents=True, exist_ok=True)


@lru_cache
def get_settings() -> Settings:
    s = Settings()
    s.ensure_dirs()
    return s
