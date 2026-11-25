"""Upload ingestion: stream to temp, hash, validate, dedupe, move into uploads/."""
from __future__ import annotations

import hashlib
import re
import time
import uuid
from pathlib import Path

from fastapi import UploadFile

from app.config import get_settings
from app.models.db import Database
from app.models.schemas import UploadOut, VideoInfo
from app.services.media import MediaError, probe_video

CHUNK = 1024 * 1024


def safe_display_name(name: str | None) -> str:
    """Strip any directory parts and odd characters; for display only."""
    base = re.split(r"[\\/]", name or "video")[-1]
    base = re.sub(r"[^\w.\- ()\[\]]+", "_", base).strip() or "video"
    return base[:120]


def upload_path(upload_id: str, ext: str) -> Path:
    return get_settings().upload_dir / f"{upload_id}{ext}"


def to_out(rec: dict, duplicate: bool = False) -> UploadOut:
    return UploadOut(
        upload_id=rec["id"], filename=rec["filename"], size_bytes=rec["size_bytes"],
        created_at=rec["created_at"], duplicate=duplicate, video=VideoInfo(**rec["video"]),
    )


async def ingest_upload(file: UploadFile, db: Database) -> UploadOut:
    s = get_settings()
    filename = safe_display_name(file.filename)
    ext = Path(filename).suffix.lower()
    if ext not in s.allowed_extensions:
        raise MediaError("unsupported_format", "Only MP4 and MOV videos are supported.")

    tmp = s.temp_dir / f"{uuid.uuid4().hex}.part"
    sha = hashlib.sha256()
    size = 0
    try:
        with tmp.open("wb") as fh:
            while chunk := await file.read(CHUNK):
                size += len(chunk)
                if size > s.max_upload_bytes:
                    raise MediaError(
                        "file_too_large",
                        f"File is larger than {s.max_upload_bytes // 1024**2} MB.",
                    )
                sha.update(chunk)
                fh.write(chunk)
        if size == 0:
            raise MediaError("empty_file", "The uploaded file is empty.")

        digest = sha.hexdigest()
        existing = db.get_upload_by_hash(digest)
        if existing and upload_path(existing["id"], existing["ext"]).exists():
            return to_out(existing, duplicate=True)
        if existing:  # stale record whose file was swept: drop it and re-ingest
            db.delete_upload(existing["id"])

        info = probe_video(tmp, ext)
        limit = s.max_duration_seconds + s.duration_tolerance_seconds
        if info.duration_seconds > limit:
            mins = s.max_duration_seconds / 60
            raise MediaError(
                "too_long", f"Video is longer than {mins:g} minutes. Please trim it and try again."
            )
        if not info.has_audio:
            raise MediaError("no_audio", "The video has no audio track, so it can't be transcribed.")

        upload_id = uuid.uuid4().hex
        tmp.replace(upload_path(upload_id, ext))
        rec = dict(id=upload_id, sha256=digest, filename=filename, ext=ext,
                   size_bytes=size, video=info.model_dump(), created_at=time.time())
        db.insert_upload(**rec)
        return to_out(rec)
    finally:
        tmp.unlink(missing_ok=True)
        await file.close()


def sweep_expired(db: Database) -> int:
    """Delete uploads past the retention window plus stale temp files. Returns files removed."""
    s = get_settings()
    cutoff = time.time() - s.retention_hours * 3600
    removed = 0
    for rec in db.uploads_older_than(cutoff):
        p = upload_path(rec["id"], rec["ext"])
        if p.exists():
            p.unlink()
            removed += 1
        for extra in s.temp_dir.glob(f"{rec['id']}*"):
            extra.unlink(missing_ok=True)
        db.delete_upload(rec["id"])
    stale_tmp = time.time() - 3600
    for p in s.temp_dir.glob("*.part"):
        if p.stat().st_mtime < stale_tmp:
            p.unlink(missing_ok=True)
            removed += 1
    return removed
