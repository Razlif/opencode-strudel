import csv
from pathlib import Path

import librosa
import numpy as np


def hz_to_midi_safe(hz):
    if hz is None or np.isnan(hz) or hz <= 0:
        return None
    return float(librosa.hz_to_midi(hz))


def midi_to_name(n):
    return librosa.midi_to_note(n, octave=True, unicode=False).lower()


def median_ignore_nan(xs, k=5):
    if k <= 1:
        return xs.copy()
    out = np.full_like(xs, np.nan, dtype=float)
    half = k // 2
    for i in range(len(xs)):
        lo = max(0, i - half)
        hi = min(len(xs), i + half + 1)
        win = xs[lo:hi]
        win = win[~np.isnan(win)]
        if len(win):
            out[i] = float(np.median(win))
    return out


def rows(times, f0, raw, smooth, voiced, prob):
    out = []
    for i in range(len(times)):
        out.append(
            {
                "idx": i,
                "time_sec": round(float(times[i]), 5),
                "f0_hz": None if np.isnan(f0[i]) else round(float(f0[i]), 4),
                "midi_raw": None if np.isnan(raw[i]) else round(float(raw[i]), 4),
                "midi_smooth": None if np.isnan(smooth[i]) else round(float(smooth[i]), 4),
                "voiced": bool(voiced[i]),
                "voiced_prob": round(float(prob[i]), 4),
            }
        )
    return out


def dump_csv(path, data):
    with path.open("w", newline="", encoding="utf-8") as f:
        wr = csv.DictWriter(
            f,
            fieldnames=["idx", "time_sec", "f0_hz", "midi_raw", "midi_smooth", "voiced", "voiced_prob"],
        )
        wr.writeheader()
        wr.writerows(data)


def clip(y, sr, start, end, limit):
    a = 0.0 if start is None else max(0.0, start)
    b = None if end is None else max(a, end)
    if limit is not None:
        b = a + limit if b is None else min(b, a + limit)
    lo = int(round(a * sr))
    hi = len(y) if b is None else int(round(min(len(y) / sr, b) * sr))
    return y[lo:hi], round(a, 5), round(hi / sr, 5)


def contour(notes):
    return [note["note"] for note in notes]


def intervals(notes):
    if len(notes) < 2:
        return []
    out = []
    for i in range(1, len(notes)):
        out.append(notes[i]["midi"] - notes[i - 1]["midi"])
    return out


def compact(notes, key):
    return " ".join(str(note[key]) for note in notes)


def relative(notes):
    if not notes:
        return []
    base = notes[0]["midi"]
    return [note["midi"] - base for note in notes]


def load_audio(path, sr, trim_db, start, end, limit, trim=True):
    y0, sr = librosa.load(path, sr=sr, mono=True)
    dur0 = round(len(y0) / sr, 5)
    y = y0
    off = 0.0
    dur1 = dur0
    if trim:
        y, idx = librosa.effects.trim(y0, top_db=trim_db)
        off = round(float(idx[0] / sr), 5)
        dur1 = round(len(y) / sr, 5)
    y, win0, win1 = clip(y, sr, start, end, limit)
    dur2 = round(len(y) / sr, 5)
    return {
        "audio": y,
        "sr": sr,
        "audio_duration_sec": dur0,
        "trimmed_duration_sec": dur1,
        "windowed_duration_sec": dur2,
        "trim_offset_sec": off,
        "window_start_sec": win0,
        "window_end_sec": win1,
    }


def track_f0(y, sr, frame_length, hop_length, fmin, fmax):
    return librosa.pyin(
        y,
        sr=sr,
        fmin=fmin,
        fmax=fmax,
        frame_length=frame_length,
        hop_length=hop_length,
    )


def segment(f0, voiced, prob, sr, hop, min_ms, min_prob, jump_cents, gap_ms):
    times = librosa.times_like(f0, sr=sr, hop_length=hop)
    raw = np.array([hz_to_midi_safe(v) for v in f0], dtype=float)
    keep = voiced & (prob >= min_prob) & ~np.isnan(raw)
    raw = np.where(keep, raw, np.nan)
    smooth = median_ignore_nan(raw, k=5)
    frame = hop / sr
    min_frames = max(1, int(round((min_ms / 1000.0) / frame)))
    gap_frames = max(1, int(round((gap_ms / 1000.0) / frame)))
    notes = []
    start = None
    last = None
    gap = 0

    def close(end):
        nonlocal start, last
        if start is None:
            return
        seg = smooth[start:end]
        seg = seg[~np.isnan(seg)]
        if len(seg) >= min_frames:
            midi = int(round(float(np.median(seg))))
            t0 = float(times[start])
            t1 = float(times[end - 1] + frame)
            notes.append(
                {
                    "midi": midi,
                    "note": midi_to_name(midi),
                    "start_sec": round(t0, 5),
                    "dur_sec": round(max(frame, t1 - t0), 5),
                    "confidence": round(float(np.nanmean(prob[start:end])), 4),
                }
            )
        start = None
        last = None

    for i, pitch in enumerate(smooth):
        if np.isnan(pitch):
            if start is None:
                continue
            gap += 1
            if gap > gap_frames:
                close(i - gap + 1)
                gap = 0
            continue

        gap = 0
        if start is None:
            start = i
            last = pitch
            continue

        if abs(pitch - last) * 100.0 > jump_cents:
            close(i)
            start = i
        last = pitch

    if start is not None:
        close(len(smooth))

    return times, raw, smooth, notes


def stabilize(notes, attack_ms, jump):
    if len(notes) < 2:
        return notes
    out = [dict(note) for note in notes]
    span = attack_ms / 1000.0
    for i in range(len(out) - 1):
        cur = out[i]
        nxt = out[i + 1]
        if cur["dur_sec"] > span:
            continue
        if abs(cur["midi"] - nxt["midi"]) > jump:
            continue
        same = i + 2 < len(out) and out[i + 2]["midi"] == nxt["midi"]
        if not same and nxt["confidence"] <= cur["confidence"]:
            continue
        cur["midi"] = nxt["midi"]
        cur["note"] = nxt["note"]
    return out


def anchor(notes):
    if not notes:
        return []
    base = notes[0]["start_sec"]
    out = []
    for note in notes:
        out.append(
            {
                **note,
                "start_sec": round(note["start_sec"] - base, 5),
            }
        )
    return out


def quantize(notes, bpm, bars, beats, steps, origin=0.0):
    span = bars * steps
    step = (60.0 / bpm) * beats / steps
    out = []
    cropped = 0
    for note in notes:
        end_abs = note["start_sec"] + note["dur_sec"]
        if end_abs <= origin:
            cropped += 1
            continue
        start_sec = max(0.0, note["start_sec"] - origin)
        end_sec = max(start_sec, end_abs - origin)
        start = int(round(start_sec / step))
        end = int(round(end_sec / step))
        if start >= span:
            cropped += 1
            continue
        start = max(0, start)
        end = max(start + 1, min(span, end))
        out.append(
            {
                **note,
                "start_step": start,
                "len_steps": end - start,
            }
        )

    wins = {}
    drops = 0
    for note in sorted(out, key=lambda x: (x["start_step"], -x["confidence"], -x["len_steps"])):
        cur = wins.get(note["start_step"])
        if cur is None:
            wins[note["start_step"]] = note
            continue
        if (note["confidence"], note["len_steps"]) > (cur["confidence"], cur["len_steps"]):
            wins[note["start_step"]] = note
        drops += 1

    return [wins[key] for key in sorted(wins)], round(step, 5), drops, cropped


def shape(n, cap):
    if n <= 1:
        return 1
    if n <= 2:
        return 2
    if n <= 4:
        return min(4, cap)
    if n <= 6:
        return min(6, cap)
    return min(8, cap)


def tighten(notes, span):
    if not notes:
        return notes
    out = [dict(note) for note in notes]
    if out[0]["start_step"] <= 2:
        out[0]["start_step"] = 0
    for i, note in enumerate(out):
        nxt = out[i + 1]["start_step"] if i + 1 < len(out) else span
        gap = max(1, nxt - note["start_step"])
        cap = max(1, gap - (2 if gap > 3 else 1))
        keep = 6 if i == len(out) - 1 else 4
        note["len_steps"] = max(1, shape(min(note["len_steps"], cap), keep))
    return out


def rest(n):
    if n <= 0:
        return []
    if n == 1:
        return ["~"]
    return [f"~@{n}"]


def to_strudel(notes, bars, steps, sound):
    span = bars * steps
    out = []
    cur = 0
    for note in notes:
        out.extend(rest(note["start_step"] - cur))
        out.append(note["note"] if note["len_steps"] == 1 else f'{note["note"]}@{note["len_steps"]}')
        cur = note["start_step"] + note["len_steps"]
    out.extend(rest(span - cur))
    body = f"[{' '.join(out)}]"
    body = f"{body}/{bars}" if bars > 1 else body
    return f'note("{body}").sound("{sound}")'


def run(path, cfg):
    audio = load_audio(
        path,
        int(cfg.get("sr", 22050)),
        float(cfg.get("trim_db", 30.0)),
        cfg.get("start_sec"),
        cfg.get("end_sec"),
        cfg.get("limit_sec"),
        bool(cfg.get("trim", True)),
    )
    f0, voiced, prob = track_f0(
        audio["audio"],
        audio["sr"],
        int(cfg.get("frame_length", 2048)),
        int(cfg.get("hop_length", 256)),
        float(cfg.get("fmin", 80.0)),
        float(cfg.get("fmax", 900.0)),
    )
    times, raw, smooth, notes = segment(
        f0,
        voiced,
        prob,
        audio["sr"],
        int(cfg.get("hop_length", 256)),
        float(cfg.get("min_note_ms", 60.0)),
        float(cfg.get("min_voiced_prob", 0.4)),
        float(cfg.get("pitch_jump_cents", 80.0)),
        float(cfg.get("max_unvoiced_gap_ms", 80.0)),
    )
    notes = stabilize(notes, float(cfg.get("attack_ms", 180.0)), int(cfg.get("attack_jump", 2)))
    qnotes, step, drops, cropped = quantize(
        notes,
        float(cfg.get("bpm", 120.0)),
        int(cfg.get("bars", 2)),
        int(cfg.get("beats_per_bar", 4)),
        int(cfg.get("steps_per_bar", 16)),
        float(cfg.get("origin_sec", 0.0)),
    )
    bars = int(cfg.get("bars", 2))
    beats = int(cfg.get("beats_per_bar", 4))
    steps = int(cfg.get("steps_per_bar", 16))
    bpm = float(cfg.get("bpm", 120.0))
    qnotes = tighten(qnotes, bars * steps)
    frame = round(int(cfg.get("hop_length", 256)) / audio["sr"], 5)
    span = round(bars * steps * (60.0 / bpm) * beats / steps, 5)
    raw_rows = rows(times, f0, raw, smooth, voiced, prob)
    csv_path = cfg.get("csv") or ""
    if csv_path:
        dump_csv(Path(csv_path), raw_rows)
    return {
        "input": str(path),
        "settings": {
            "bpm": bpm,
            "bars": bars,
            "beats_per_bar": beats,
            "steps_per_bar": steps,
            "sr": audio["sr"],
            "frame_length": int(cfg.get("frame_length", 2048)),
            "hop_length": int(cfg.get("hop_length", 256)),
            "fmin": float(cfg.get("fmin", 80.0)),
            "fmax": float(cfg.get("fmax", 900.0)),
            "trim_db": float(cfg.get("trim_db", 30.0)),
            "start_sec": cfg.get("start_sec"),
            "end_sec": cfg.get("end_sec"),
            "limit_sec": cfg.get("limit_sec"),
            "min_note_ms": float(cfg.get("min_note_ms", 60.0)),
            "min_voiced_prob": float(cfg.get("min_voiced_prob", 0.4)),
            "pitch_jump_cents": float(cfg.get("pitch_jump_cents", 80.0)),
            "max_unvoiced_gap_ms": float(cfg.get("max_unvoiced_gap_ms", 80.0)),
            "attack_ms": float(cfg.get("attack_ms", 180.0)),
            "attack_jump": int(cfg.get("attack_jump", 2)),
            "sound": cfg.get("sound", "piano"),
        },
        "summary": {
            "audio_duration_sec": audio["audio_duration_sec"],
            "trimmed_duration_sec": audio["trimmed_duration_sec"],
            "windowed_duration_sec": audio["windowed_duration_sec"],
            "trim_offset_sec": audio["trim_offset_sec"],
            "window_start_sec": audio["window_start_sec"],
            "window_end_sec": audio["window_end_sec"],
            "frame_sec": frame,
            "pyin_frames": int(len(f0)),
            "voiced_frames": int(np.sum(voiced)),
            "segmented_notes": len(notes),
            "quantized_notes": len(qnotes),
            "quantized_collisions_dropped": drops,
            "cropped_notes": cropped,
            "phrase_window_sec": span,
            "first_note_start_sec": None if not notes else notes[0]["start_sec"],
            "last_note_end_sec": None if not notes else round(notes[-1]["start_sec"] + notes[-1]["dur_sec"], 5),
            "raw_csv": csv_path or None,
        },
        "timing": {
            "grid_origin": "beat_in_clip",
            "origin_sec": float(cfg.get("origin_sec", 0.0)),
            "bpm": bpm,
            "beats_per_cycle": beats,
            "bars": bars,
            "steps_per_bar": steps,
            "anchored_to_first_note": False,
        },
        "contour": {
            "segmented": compact(notes, "note"),
            "quantized": compact(qnotes, "note"),
            "segmented_intervals": intervals(notes),
            "quantized_intervals": intervals(qnotes),
            "segmented_relative": relative(notes),
            "quantized_relative": relative(qnotes),
            "segmented_durations": [round(note["dur_sec"], 5) for note in notes],
            "quantized_lengths": [note["len_steps"] for note in qnotes],
        },
        "raw_frames": raw_rows,
        "segmented_notes": notes,
        "quantized_notes": qnotes,
        "strudel": to_strudel(qnotes, bars, steps, cfg.get("sound", "piano")),
    }
