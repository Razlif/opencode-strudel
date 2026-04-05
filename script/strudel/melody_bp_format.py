from typing import Dict, List

NOTE_NAMES = ["c", "c#", "d", "eb", "e", "f", "f#", "g", "ab", "a", "bb", "b"]


def tone(midi: int) -> str:
    return f"{NOTE_NAMES[midi % 12]}{(midi // 12) - 1}"


def _score_onset(note: Dict, beat_start: int):
    return (
        abs(int(note["start_step"]) - beat_start),
        -float(note.get("confidence", 0.0)),
        -int(note.get("len_steps", 1)),
    )


def _score_overlap(note: Dict, beat_start: int, beat_end: int):
    note_start = int(note["start_step"])
    note_end = note_start + int(note.get("len_steps", 1))
    overlap = max(0, min(note_end, beat_end) - max(note_start, beat_start))
    return (
        -overlap,
        abs(note_start - beat_start),
        -float(note.get("confidence", 0.0)),
        -int(note.get("len_steps", 1)),
    )


def format_strudel(
    grid_notes: List[Dict],
    steps_per_bar: int,
    bars: int,
    beats_per_cycle: int,
    sound: str = "triangle",
) -> str:
    total_beats = max(1, bars * beats_per_cycle)
    steps_per_beat = max(1, steps_per_bar // max(1, beats_per_cycle))
    slots = ["~"] * total_beats
    notes = sorted(grid_notes, key=lambda note: (int(note["start_step"]), -float(note.get("confidence", 0.0))))
    used: set[int] = set()

    for beat_index in range(total_beats):
        beat_start = beat_index * steps_per_beat
        beat_end = beat_start + steps_per_beat
        onset_candidates = [
            (idx, note)
            for idx, note in enumerate(notes)
            if idx not in used and beat_start <= int(note["start_step"]) < beat_end
        ]
        if onset_candidates:
            winner_idx, winner = min(onset_candidates, key=lambda item: _score_onset(item[1], beat_start))
            used.add(winner_idx)
            slots[beat_index] = tone(int(winner["midi"]))
            continue

        overlap_candidates = [
            (idx, note)
            for idx, note in enumerate(notes)
            if idx not in used
            and int(note["start_step"]) < beat_end
            and (int(note["start_step"]) + int(note.get("len_steps", 1))) > beat_start
        ]
        if overlap_candidates:
            winner_idx, winner = min(overlap_candidates, key=lambda item: _score_overlap(item[1], beat_start, beat_end))
            used.add(winner_idx)
            slots[beat_index] = tone(int(winner["midi"]))

    body = " ".join(slots)
    return f'note("{body}").s("{sound}")'
