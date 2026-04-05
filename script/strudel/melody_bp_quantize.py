from typing import Dict, List, Optional

NOTE_NAMES = ["c", "c#", "d", "eb", "e", "f", "f#", "g", "ab", "a", "bb", "b"]


def midi_to_note_name(midi: int) -> str:
    return f"{NOTE_NAMES[midi % 12]}{(midi // 12) - 1}"


def cycle_sec(bpm: float, beats_per_cycle: int) -> float:
    return (60.0 / bpm) * beats_per_cycle


def step_sec(bpm: float, beats_per_cycle: int, steps_per_bar: int) -> float:
    return cycle_sec(bpm, beats_per_cycle) / steps_per_bar


def quantize_notes(segmented_notes: List[Dict], bpm: float, beats_per_cycle: int, bars: int, steps_per_bar: int, origin_sec: float):
    total_steps = bars * steps_per_bar
    seconds_per_step = step_sec(bpm, beats_per_cycle, steps_per_bar)
    grid: List[Optional[Dict]] = [None] * total_steps
    collisions = 0
    cropped = 0

    for note in segmented_notes:
        start_rel = note["start_sec"] - origin_sec
        end_rel = start_rel + note["dur_sec"]
        start_step = round(start_rel / seconds_per_step)
        end_step = max(start_step + 1, round(end_rel / seconds_per_step))
        if end_step <= 0 or start_step >= total_steps:
            cropped += 1
            continue
        start_step = max(0, start_step)
        end_step = min(total_steps, end_step)
        for idx in range(start_step, end_step):
            prev = grid[idx]
            if prev is not None:
                collisions += 1
            if prev is None or note.get("confidence", 0.0) >= prev.get("confidence", 0.0):
                grid[idx] = note

    out = []
    idx = 0
    while idx < total_steps:
        note = grid[idx]
        if note is None:
            idx += 1
            continue
        midi = int(note["midi"])
        end = idx + 1
        while end < total_steps and grid[end] is not None and int(grid[end]["midi"]) == midi:
            end += 1
        out.append(
            {
                "midi": midi,
                "note": midi_to_note_name(midi),
                "start_step": idx,
                "len_steps": end - idx,
                "confidence": float(note.get("confidence", 1.0)),
            }
        )
        idx = end

    return out, {
        "quantized_collisions_dropped": collisions,
        "cropped_notes": cropped,
    }
