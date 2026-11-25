"""Highlight selection: Qwen3 proposes clips by *sentence index*; this module validates them.

Why indices instead of timestamps: the LLM can't misplace a boundary mid-word or invent a time
outside the video, and every clip's text is by construction real transcript text.
"""
from __future__ import annotations

import re
from dataclasses import dataclass

import logging

from app.config import get_settings
from app.services import llm
from app.services.transcribe import PipelineError

log = logging.getLogger("clipmitra.highlights")

_END = re.compile(r"[.?!…।]['\")\]]*$")
_NO_SPACE_BEFORE = re.compile(r"^(?:[,.;:!?%)\]}'’…]|-(?=\w)|n't\b)")
MIN_WORD_PROB = 0.1  # below this Whisper is almost always hallucinating in a pause (e.g. a lone "4.")


def join_tokens(tokens: list[str]) -> str:
    """Join Whisper word tokens: '300' + ',000' -> '300,000', '80' + '%' -> '80%'."""
    out = ""
    for t in tokens:
        out += t if not out or _NO_SPACE_BEFORE.match(t) else " " + t
    return out


@dataclass
class Sentence:
    idx: int
    start: float
    end: float
    text: str
    cont: bool = False  # starts mid-sentence (previous one was force-split for length)


@dataclass
class Highlight:
    start_sentence: int
    end_sentence: int
    start_time: float
    end_time: float
    title: str
    hook: str
    reason: str
    editorial_score: int
    transcript: str
    source: str  # "ai" | "fallback"

    @property
    def duration(self) -> float:
        return self.end_time - self.start_time


# ---------------------------------------------------------------- sentences

def _segment_starts(words: list[dict], segments: list[dict]) -> set[int]:
    """Indices of words that begin a new Whisper segment (matched by time)."""
    starts, k = set(), 0
    for i, w in enumerate(words):
        moved = False
        while k + 1 < len(segments) and w["start"] >= segments[k + 1]["start"] - 0.05:
            k += 1
            moved = True
        if moved and i:
            starts.add(i)
    return starts


def build_sentences(words: list[dict], segments: list[dict] | None = None,
                    max_words: int = 60, gap: float = 0.9) -> list[Sentence]:
    """Group Whisper words into sentences: break on end punctuation or long pauses.

    Whisper often emits Hindi/Hinglish with no punctuation at all. For such transcripts we also
    break at Whisper's segment boundaries, which are natural phrase breaks.
    Very long run-ons are force-split at `max_words`; the piece after such a split is marked
    `cont` so clip boundaries can be snapped back to real sentence starts.
    """
    words = [w for w in words if w.get("prob", 1.0) >= MIN_WORD_PROB]
    out: list[Sentence] = []
    cur: list[dict] = []
    forced = False
    ends = sum(bool(_END.search(w["text"])) for w in words)
    unpunctuated = bool(words) and ends < len(words) / 40
    seg_breaks = _segment_starts(words, segments) if unpunctuated and segments else set()

    def flush(next_is_cont: bool) -> None:
        nonlocal forced
        if cur:
            out.append(Sentence(len(out), cur[0]["start"], cur[-1]["end"],
                                join_tokens([w["text"] for w in cur]), cont=forced))
            cur.clear()
            forced = next_is_cont

    for i, w in enumerate(words):
        if cur and (w["start"] - cur[-1]["end"] > gap or i in seg_breaks):
            flush(False)
        cur.append(w)
        if _END.search(w["text"]):
            flush(False)
        elif len(cur) >= max_words:
            flush(True)
    flush(False)
    return out


def target_clip_count(duration: float) -> int:
    s = get_settings()
    return max(1, min(s.clips_target, int(duration // 30)))


# ---------------------------------------------------------------- validation helpers

_PUNCT = ".,!?;:'\"()[]{}…।“”‘’-–—"


def _words(t: str) -> list[str]:
    # Split on whitespace (not \w): \w drops Devanagari vowel signs and breaks Hindi words apart.
    return [w for w in (x.strip(_PUNCT) for x in t.lower().split()) if w]


def is_grounded(quote: str, text: str, threshold: float = 0.8) -> bool:
    """True if (nearly) every word of `quote` appears in `text`."""
    q = _words(quote)
    if not q:
        return False
    pool = set(_words(text))
    return sum(w in pool for w in q) / len(q) >= threshold


def _span(s: list[Sentence], a: int, b: int) -> float:
    return s[b].end - s[a].start


def _ok_start(s: list[Sentence], a: int, strict: bool = True) -> bool:
    return not (strict and s[a].cont)


def _ok_end(s: list[Sentence], b: int, strict: bool = True) -> bool:
    return b + 1 >= len(s) or not (strict and s[b + 1].cont)


def snap(s: list[Sentence], a: int, b: int) -> tuple[int, int]:
    """Widen [a, b] so it never starts or ends in the middle of a sentence."""
    while a > 0 and not _ok_start(s, a):
        a -= 1
    while not _ok_end(s, b):
        b += 1
    return a, b


def fit_duration(s: list[Sentence], a: int, b: int, lo: float, hi: float,
                 strict: bool = True) -> tuple[int, int] | None:
    """Adjust [a, b] by whole sentences until its span is within [lo, hi]. None if impossible.

    Extends forward first (keeps the chosen opening line as the hook), then backward.
    strict=False allows boundaries at forced (mid-sentence) splits — a last resort.
    """
    if strict:
        a, b = snap(s, a, b)
    while b > a and (_span(s, a, b) > hi or not _ok_end(s, b, strict)):
        b -= 1
    if _span(s, a, b) > hi or not _ok_end(s, b, strict):
        return None
    while _span(s, a, b) < lo:
        nb = b + 1
        while nb < len(s) and not _ok_end(s, nb, strict):
            nb += 1
        na = a - 1
        while na > 0 and not _ok_start(s, na, strict):
            na -= 1
        if nb < len(s) and _span(s, a, nb) <= hi:
            b = nb
        elif na >= 0 and _span(s, na, b) <= hi:
            a = na
        else:
            return None
    return a, b


def padded_times(s: list[Sentence], a: int, b: int, duration: float) -> tuple[float, float]:
    """Small breathing room around speech, never bleeding into neighbouring sentences."""
    lower = s[a - 1].end if a > 0 else 0.0
    start = max(s[a].start - 0.2, min(lower, s[a].start), 0.0)
    upper = s[b + 1].start if b + 1 < len(s) else duration
    end = min(s[b].end + 0.35, max(upper, s[b].end), duration)
    return round(start, 3), round(end, 3)


def _score(v) -> int:
    try:
        x = float(v)
    except (TypeError, ValueError):
        return 5
    if x > 10:  # model answered on a 0-100 scale
        x /= 10
    return int(min(10, max(1, round(x))))


def _first_words(text: str, n: int = 7) -> str:
    w = text.split()
    return " ".join(w[:n]) + ("…" if len(w) > n else "")


# ---------------------------------------------------------------- selection

def validate(candidates: list[dict], s: list[Sentence], duration: float, limit: int) -> list[Highlight]:
    cfg = get_settings()
    lo, hi = cfg.clip_min_seconds, cfg.clip_max_seconds - 0.6  # leave room for padding
    taken: list[tuple[int, int]] = []
    out: list[Highlight] = []
    ranked = sorted(candidates, key=lambda c: -_score(c.get("editorial_score")))
    for c in ranked:
        if len(out) >= limit:
            break
        try:
            a, b = int(c["start_sentence"]), int(c["end_sentence"])
        except (KeyError, TypeError, ValueError):
            continue
        if not (0 <= a < len(s) and 0 <= b < len(s)):
            continue
        a, b = min(a, b), max(a, b)
        fitted = fit_duration(s, a, b, lo, hi) or fit_duration(s, a, b, lo, hi, strict=False)
        if not fitted:
            continue
        a, b = fitted
        if any(not (b < ta or a > tb) for ta, tb in taken):
            continue
        start, end = padded_times(s, a, b, duration)
        if not (0 <= start < end <= duration):
            continue
        text = " ".join(x.text for x in s[a:b + 1])
        hook = str(c.get("hook") or "").strip()
        if not is_grounded(hook, " ".join(x.text for x in s[a:min(b, a + 2) + 1])):
            hook = s[a].text  # never show words the speaker didn't say
        title = re.sub(r"\s+", " ", str(c.get("title") or "")).strip().strip('"') or _first_words(text)
        if len(title.split()) > 10 or len(title) > 80:  # model pasted a sentence instead of a title
            title = _first_words(title, 8)
        reason = str(c.get("reason") or "").strip()[:300] or "Strong standalone moment."
        taken.append((a, b))
        out.append(Highlight(a, b, start, end, title, hook[:200], reason,
                             _score(c.get("editorial_score")), text, "ai"))
    return out


def fallback_fill(s: list[Sentence], chosen: list[Highlight], need: int, duration: float) -> list[Highlight]:
    """If the AI gave too few valid clips, add evenly spaced ~35 s windows of real transcript."""
    cfg = get_settings()
    lo, hi = cfg.clip_min_seconds, cfg.clip_max_seconds - 0.6
    used = {i for h in chosen for i in range(h.start_sentence, h.end_sentence + 1)}
    windows: list[tuple[int, int]] = []
    for strict in (True, False):
        a = 0
        while a < len(s):
            if a in used or (strict and s[a].cont):
                a += 1
                continue
            b = a
            while b + 1 < len(s) and b + 1 not in used and _span(s, a, b) < 35:
                b += 1
            fitted = fit_duration(s, a, b, lo, hi, strict)
            if fitted and not any(i in used for i in range(fitted[0], fitted[1] + 1)):
                windows.append(fitted)
            a = b + 1
        if windows:
            break
    if not windows or need <= 0:
        return []
    step = max(1, len(windows) // need)
    out = []
    for a, b in windows[::step][:need]:
        start, end = padded_times(s, a, b, duration)
        text = " ".join(x.text for x in s[a:b + 1])
        out.append(Highlight(a, b, start, end, _first_words(text), s[a].text[:200],
                             "Picked automatically because the AI suggested fewer usable clips.",
                             3, text, "fallback"))
    return out


SYSTEM = """You are an expert short-form video editor for Instagram Reels, YouTube Shorts and TikTok.
You choose moments from a video transcript that work as standalone vertical clips.

Rules:
- A clip is a continuous range of transcript lines, given by start_sentence and end_sentence (the [numbers]).
- Each clip must make sense on its own: a complete thought, insight or story, with no dangling
  references to earlier parts ("as I said", "that thing"). End at a natural conclusion.
- Start on a strong hook: a bold claim, surprising fact, question, or emotional moment.
- Clip length must be between {lo:.0f} and {hi:.0f} seconds; aim for 30-45 seconds (usually 5-10 lines).
  Length = start time of the line AFTER end_sentence minus start time of start_sentence.
- Clips must not overlap.
- Skip greetings, intros, sponsor reads and sign-offs ("thanks for watching", "see you next time").
- "hook": copy the opening line of the clip word-for-word. Never invent or paraphrase what was said.
- "title": catchy, at most 8 words, in the same language as the transcript.
- "reason": one sentence explaining why it works as a short.
- "editorial_score": 1-10, how strong and shareable the clip is.
"""

def schema(n: int) -> dict:
    """JSON schema enforced by Ollama's grammar: bounded list and string lengths stop runaway output."""
    return {
        "type": "object",
        "properties": {"clips": {"type": "array", "minItems": 1, "maxItems": n, "items": {
            "type": "object",
            "properties": {
                "start_sentence": {"type": "integer"}, "end_sentence": {"type": "integer"},
                "title": {"type": "string", "maxLength": 80},
                "hook": {"type": "string", "maxLength": 220},
                "reason": {"type": "string", "maxLength": 220},
                "editorial_score": {"type": "integer"},
            },
            "required": ["start_sentence", "end_sentence", "title", "hook", "reason", "editorial_score"],
        }}},
        "required": ["clips"],
    }


def _ts(t: float) -> str:
    return f"{int(t // 60):02d}:{t % 60:04.1f}"


def build_prompt(s: list[Sentence], duration: float, n: int) -> str:
    lines = "\n".join(f"[{x.idx}] {_ts(x.start)} {x.text}" for x in s)
    return (f"Video length: {_ts(duration)} (ends at {_ts(s[-1].end)}).\n"
            f"Suggest the {n} best clips, best first.\n\nTranscript:\n{lines}")


def select_highlights(transcript: dict, temperature: float = 0.3) -> list[Highlight]:
    cfg = get_settings()
    s = build_sentences(transcript["words"], transcript.get("segments"))
    duration = transcript["duration"]
    target = target_clip_count(duration)
    system = SYSTEM.format(lo=cfg.clip_min_seconds, hi=cfg.clip_max_seconds)

    chosen: list[Highlight] = []
    n = target + 2
    for attempt in range(2):  # one retry if the model's answer is unusable
        try:
            data = llm.chat_json(system, build_prompt(s, duration, n), schema(n),
                                 temperature=min(temperature + 0.2 * attempt, 0.8), max_tokens=250 * n + 200)
        except PipelineError as e:
            if e.code != "llm_bad_output":
                raise  # Ollama down / model missing: the user needs to act
            log.warning("unreadable LLM answer (attempt %d)", attempt + 1)
            continue
        chosen = validate(data.get("clips") or [], s, duration, target)
        if len(chosen) >= target:
            break
    if len(chosen) < target:
        chosen += fallback_fill(s, chosen, target - len(chosen), duration)
    return chosen
