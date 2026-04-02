#!/usr/bin/env python3
import argparse
import json
from pathlib import Path

from melody_pyin_core import run


def human(data):
    print("Summary")
    for key, val in data["summary"].items():
        print(f"{key}: {val}")
    print("\nContour")
    print(f'segmented: {data["contour"]["segmented"]}')
    print(f'quantized: {data["contour"]["quantized"]}')
    print(f'segmented_intervals: {data["contour"]["segmented_intervals"]}')
    print(f'quantized_intervals: {data["contour"]["quantized_intervals"]}')
    print(f'segmented_relative: {data["contour"]["segmented_relative"]}')
    print(f'quantized_relative: {data["contour"]["quantized_relative"]}')
    print(f'segmented_durations: {data["contour"]["segmented_durations"]}')
    print(f'quantized_lengths: {data["contour"]["quantized_lengths"]}')
    print("\nSegmented notes")
    for note in data["segmented_notes"]:
        print(
            f'{note["note"]} midi={note["midi"]} start={note["start_sec"]} dur={note["dur_sec"]} conf={note["confidence"]}'
        )
    print("\nQuantized notes")
    for note in data["quantized_notes"]:
        print(
            f'{note["note"]} start_step={note["start_step"]} len_steps={note["len_steps"]} conf={note["confidence"]}'
        )
    print("\nStrudel")
    print(data["strudel"])


def main():
    p = argparse.ArgumentParser()
    p.add_argument("audio_path")
    p.add_argument("--bpm", type=float, default=120.0)
    p.add_argument("--bars", type=int, default=2)
    p.add_argument("--beats-per-bar", type=int, default=4)
    p.add_argument("--steps-per-bar", type=int, default=16)
    p.add_argument("--sr", type=int, default=22050)
    p.add_argument("--frame-length", type=int, default=2048)
    p.add_argument("--hop-length", type=int, default=256)
    p.add_argument("--fmin", type=float, default=80.0)
    p.add_argument("--fmax", type=float, default=900.0)
    p.add_argument("--trim-db", type=float, default=30.0)
    p.add_argument("--start-sec", type=float, default=None)
    p.add_argument("--end-sec", type=float, default=None)
    p.add_argument("--limit-sec", type=float, default=None)
    p.add_argument("--min-note-ms", type=float, default=60.0)
    p.add_argument("--min-voiced-prob", type=float, default=0.4)
    p.add_argument("--pitch-jump-cents", type=float, default=80.0)
    p.add_argument("--max-unvoiced-gap-ms", type=float, default=80.0)
    p.add_argument("--attack-ms", type=float, default=180.0)
    p.add_argument("--attack-jump", type=int, default=2)
    p.add_argument("--sound", default="piano")
    p.add_argument("--csv", default="")
    p.add_argument("--json", action="store_true")
    args = p.parse_args()

    path = Path(args.audio_path)
    if not path.exists():
        raise SystemExit(f"File not found: {path}")

    data = run(
        str(path),
        {
            "bpm": args.bpm,
            "bars": args.bars,
            "beats_per_bar": args.beats_per_bar,
            "steps_per_bar": args.steps_per_bar,
            "sr": args.sr,
            "frame_length": args.frame_length,
            "hop_length": args.hop_length,
            "fmin": args.fmin,
            "fmax": args.fmax,
            "trim_db": args.trim_db,
            "start_sec": args.start_sec,
            "end_sec": args.end_sec,
            "limit_sec": args.limit_sec,
            "min_note_ms": args.min_note_ms,
            "min_voiced_prob": args.min_voiced_prob,
            "pitch_jump_cents": args.pitch_jump_cents,
            "max_unvoiced_gap_ms": args.max_unvoiced_gap_ms,
            "attack_ms": args.attack_ms,
            "attack_jump": args.attack_jump,
            "sound": args.sound,
            "csv": args.csv,
        },
    )

    if args.json:
        print(json.dumps(data, indent=2))
        return

    human(data)
    print("\nRaw frames")
    print(json.dumps(data["raw_frames"], indent=2))


if __name__ == "__main__":
    main()
