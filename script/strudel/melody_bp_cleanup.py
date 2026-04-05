from typing import Dict, List

import pretty_midi
import numpy as np


def _get_all_notes(midi_obj: pretty_midi.PrettyMIDI, include_drums: bool = False):
    all_notes = []
    for instrument in midi_obj.instruments:
        if not instrument.is_drum or include_drums:
            all_notes.extend(instrument.notes)
    all_notes.sort(key=lambda note: note.start)
    return all_notes


def _normalize_instrument_times(instrument: pretty_midi.Instrument):
    if not instrument.notes:
        return instrument
    notes = sorted(instrument.notes, key=lambda note: note.start)
    start_offset = notes[0].start
    normalized = pretty_midi.Instrument(program=instrument.program, is_drum=instrument.is_drum, name=instrument.name)
    for note in instrument.notes:
        normalized.notes.append(
            pretty_midi.Note(
                velocity=note.velocity,
                pitch=note.pitch,
                start=note.start - start_offset,
                end=note.end - start_offset,
            )
        )
    for cc in instrument.control_changes:
        normalized.control_changes.append(
            pretty_midi.ControlChange(number=cc.number, value=cc.value, time=cc.time - start_offset)
        )
    return normalized


def filter_spurious_notes_pm(midi_obj: pretty_midi.PrettyMIDI, max_dur_s: float = 0.05, max_vel: int = 20):
    for instrument in midi_obj.instruments:
        instrument.notes = [
            note
            for note in instrument.notes
            if not ((note.end - note.start) < max_dur_s and note.velocity < max_vel)
        ]
    return midi_obj


def stabilize_rhythm_pm(
    midi_obj: pretty_midi.PrettyMIDI,
    ioi_threshold_ratio: float = 0.30,
    min_ioi_s: float = 0.03,
):
    for instrument in midi_obj.instruments:
        if instrument.is_drum or len(instrument.notes) < 20:
            continue
        notes = sorted(instrument.notes, key=lambda note: note.start)
        iois = [notes[index].start - notes[index - 1].start for index in range(1, len(notes))]
        positive_iois = [ioi for ioi in iois if ioi > 0.001]
        if not positive_iois:
            continue
        median_ioi = float(np.median(positive_iois))
        threshold_s = max(median_ioi * ioi_threshold_ratio, min_ioi_s)
        cleaned = [notes[0]]
        for current in notes[1:]:
            previous = cleaned[-1]
            notes_at_same_time = [note for note in notes if abs(note.start - current.start) < 0.001]
            if len(notes_at_same_time) > 1:
                cleaned.append(current)
                continue
            pitch_close = abs(current.pitch - previous.pitch) <= 3
            velocity_ok = current.velocity < previous.velocity * 0.8
            start_close = (current.start - previous.start) < threshold_s
            if start_close and pitch_close and velocity_ok:
                previous.end = max(previous.end, current.end)
            else:
                cleaned.append(current)
        instrument.notes = cleaned
    return midi_obj


def quantize_pm(midi_obj: pretty_midi.PrettyMIDI, quantize_level_str: str = "1/16"):
    if quantize_level_str == "None":
        return midi_obj
    level_map = {"1/4": 1.0, "1/8": 2.0, "1/12": 3.0, "1/16": 4.0, "1/24": 6.0, "1/32": 8.0, "1/64": 16.0}
    division = level_map.get(quantize_level_str)
    if not division:
        return midi_obj

    quantized_midi = pretty_midi.PrettyMIDI()
    for instrument in midi_obj.instruments:
        if instrument.is_drum or not instrument.notes:
            quantized_midi.instruments.append(instrument)
            continue
        try:
            if midi_obj.get_tempo_changes()[1].size > 0:
                bpm = float(midi_obj.get_tempo_changes()[1][0])
            else:
                temp_norm = _normalize_instrument_times(instrument)
                temp_midi = pretty_midi.PrettyMIDI()
                temp_midi.instruments.append(temp_norm)
                bpm = temp_midi.estimate_tempo()
            bpm = max(40.0, min(bpm, 240.0))
        except Exception:
            quantized_midi.instruments.append(instrument)
            continue
        grid_s = (60.0 / bpm) / division
        next_instrument = pretty_midi.Instrument(program=instrument.program, is_drum=instrument.is_drum, name=instrument.name)
        for note in instrument.notes:
            duration = note.end - note.start
            new_start = round(note.start / grid_s) * grid_s
            new_end = new_start + duration
            if new_end <= new_start:
                new_end = new_start + (grid_s * 0.5)
            next_instrument.notes.append(
                pretty_midi.Note(
                    velocity=note.velocity,
                    pitch=note.pitch,
                    start=new_start,
                    end=new_end,
                )
            )
        quantized_midi.instruments.append(next_instrument)
    return quantized_midi


def pretty_midi_to_segmented(midi_obj: pretty_midi.PrettyMIDI) -> List[Dict]:
    out = []
    for instrument in midi_obj.instruments:
        if instrument.is_drum:
            continue
        for note in instrument.notes:
            out.append(
                {
                    "midi": int(note.pitch),
                    "note": pretty_midi.note_number_to_name(int(note.pitch)).replace("#", "#").lower(),
                    "start_sec": float(note.start),
                    "dur_sec": max(0.0, float(note.end - note.start)),
                    "confidence": float(note.velocity / 127.0),
                }
            )
    return sorted(out, key=lambda item: item["start_sec"])


def filter_spurious_notes(notes: List[Dict], max_dur_ms: float, max_conf: float) -> List[Dict]:
    out = []
    for note in notes:
        dur_ms = note["dur_sec"] * 1000.0
        if dur_ms < max_dur_ms and note.get("confidence", 1.0) < max_conf:
            continue
        out.append(note)
    return out


def drop_short_notes(notes: List[Dict], min_ms: float) -> List[Dict]:
    return [note for note in notes if note["dur_sec"] * 1000.0 >= min_ms]


def filter_isolated_pitch_outliers(notes: List[Dict]) -> List[Dict]:
    if len(notes) < 3:
        return notes
    out = []
    for index, note in enumerate(notes):
        prev_note = notes[index - 1] if index > 0 else None
        next_note = notes[index + 1] if index + 1 < len(notes) else None
        if prev_note is None or next_note is None:
            out.append(note)
            continue
        off_prev = abs(int(note["midi"]) - int(prev_note["midi"])) > 7
        off_next = abs(int(note["midi"]) - int(next_note["midi"])) > 7
        neighbors_close = abs(int(prev_note["midi"]) - int(next_note["midi"])) <= 7
        weak = float(note.get("confidence", 1.0)) < 0.35
        short = float(note.get("dur_sec", 0.0)) <= 0.20
        if off_prev and off_next and neighbors_close and weak and short:
            continue
        out.append(note)
    return out


def stabilize_register(notes: List[Dict]) -> List[Dict]:
    if len(notes) < 3:
        return notes
    out = [dict(note) for note in notes]
    for index in range(1, len(out) - 1):
        prev_note = out[index - 1]
        note = out[index]
        next_note = out[index + 1]
        prev_midi = int(prev_note["midi"])
        midi = int(note["midi"])
        next_midi = int(next_note["midi"])
        neighbor_gap = abs(prev_midi - next_midi)
        if neighbor_gap > 7:
            continue
        current_span = max(abs(midi - prev_midi), abs(midi - next_midi))
        best_midi = midi
        best_span = current_span
        for shift in (-24, -12, 12, 24):
            candidate = midi + shift
            candidate_span = max(abs(candidate - prev_midi), abs(candidate - next_midi))
            if candidate_span + 2 < best_span:
                best_midi = candidate
                best_span = candidate_span
        if best_midi != midi:
            note["midi"] = best_midi
            note["note"] = pretty_midi.note_number_to_name(best_midi).replace("#", "#").lower()
    return out


def cleanup_segmented(notes: List[Dict], cfg: dict) -> List[Dict]:
    opts = cfg["cleanup"]
    out = filter_spurious_notes(notes, opts["spurious_max_dur_ms"], opts["spurious_max_conf"])
    out = drop_short_notes(out, opts["drop_short_ms"])
    out = filter_isolated_pitch_outliers(out)
    out = stabilize_register(out)
    return sorted(out, key=lambda item: item["start_sec"])
