#!/usr/bin/env python3
import json
from datetime import datetime
from pathlib import Path
from tempfile import NamedTemporaryFile
from typing import Optional

import uvicorn
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from melody_bp_adaptive import analyze_audio_for_basic_pitch
from melody_bp_audio import load_audio_robust, normalize_loudness, save_temp_audio, to_mono
from melody_bp_cleanup import cleanup_segmented
from melody_bp_config import build_config
from melody_bp_format import format_strudel
from melody_bp_quantize import quantize_notes
from melody_bp_separate import maybe_separate
from melody_bp_transcribe import note_events_to_segmented, run_basic_pitch

root = Path(__file__).resolve().parent / "melody-runs-bp"
root.mkdir(exist_ok=True)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/transcribe-melody")
async def transcribe_melody(
    audio: UploadFile = File(...),
    bpm: float = Form(...),
    beats_per_cycle: int = Form(...),
    bars: int = Form(...),
    steps_per_bar: int = Form(...),
    origin_sec: float = Form(0.0),
    preset: str = Form("solo_vocals"),
    adaptive: bool = Form(False),
    separate_vocals: bool = Form(False),
    separation_model: str = Form("none"),
    onset_threshold: Optional[float] = Form(None),
    frame_threshold: Optional[float] = Form(None),
    minimum_note_length: Optional[int] = Form(None),
    minimum_frequency: Optional[float] = Form(None),
    maximum_frequency: Optional[float] = Form(None),
    infer_onsets: Optional[bool] = Form(None),
    melodia_trick: Optional[bool] = Form(None),
    multiple_pitch_bends: Optional[bool] = Form(None),
    debug: bool = Form(True),
):
    suffix = Path(audio.filename or "melody.wav").suffix or ".wav"
    with NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await audio.read())
        raw_path = Path(tmp.name)

    try:
        basic_pitch_overrides = {
            key: value
            for key, value in {
                "onset_threshold": onset_threshold,
                "frame_threshold": frame_threshold,
                "minimum_note_length": minimum_note_length,
                "minimum_frequency": minimum_frequency,
                "maximum_frequency": maximum_frequency,
                "infer_onsets": infer_onsets,
                "melodia_trick": melodia_trick,
                "multiple_pitch_bends": multiple_pitch_bends,
            }.items()
            if value is not None
        }
        overrides = {"basic_pitch": basic_pitch_overrides} if basic_pitch_overrides else None

        cfg = build_config(
            preset=preset,
            adaptive=adaptive,
            separate_vocals=separate_vocals,
            separation_model=separation_model,
            overrides=overrides,
        )
        audio_data, sr = load_audio_robust(str(raw_path))
        mono = to_mono(audio_data)
        normalized = normalize_loudness(mono, sr)

        stamp = datetime.now().strftime("%Y%m%d-%H%M%S-%f")
        prepared_path = root / f"{stamp}.flac"
        save_temp_audio(prepared_path, normalized, sr)
        source_path = maybe_separate(str(prepared_path), cfg)

        auto_analyze = preset == "auto_analyze_audio"
        if auto_analyze:
            cfg["basic_pitch"].update(analyze_audio_for_basic_pitch(normalized, sr, known_bpm=bpm))

        try:
            _, _, note_events = run_basic_pitch(str(source_path), cfg)
        except Exception:
            if str(source_path) != str(prepared_path):
                _, _, note_events = run_basic_pitch(str(prepared_path), cfg)
                source_path = prepared_path
            else:
                raise
        segmented = cleanup_segmented(note_events_to_segmented(note_events), cfg)
        quantized, qmeta = quantize_notes(segmented, bpm, beats_per_cycle, bars, steps_per_bar, origin_sec)
        result = {
            "used_config": {
                "preset": preset,
                "adaptive": auto_analyze,
                "separate_vocals": separate_vocals,
                "separation_model": separation_model,
                "basic_pitch": cfg["basic_pitch"],
            },
            "summary": {
                "segmented_notes": len(segmented),
                "quantized_notes": len(quantized),
                "quantized_collisions_dropped": qmeta["quantized_collisions_dropped"],
                "cropped_notes": qmeta["cropped_notes"],
            },
            "timing": {
                "grid_origin": "beat_in_clip",
                "origin_sec": origin_sec,
                "bpm": bpm,
                "beats_per_cycle": beats_per_cycle,
                "bars": bars,
                "steps_per_bar": steps_per_bar,
                "anchored_to_first_note": False,
            },
            "contour": {
                "segmented": " ".join(item["note"] for item in segmented[:32]),
                "quantized": " ".join(item["note"] for item in quantized[:32]),
                "segmented_relative": [],
                "quantized_relative": [],
            },
            "segmented_notes": segmented,
            "quantized_notes": quantized,
            "strudel": format_strudel(quantized, steps_per_bar, bars, beats_per_cycle, sound="triangle"),
            "debug_json": None,
            "latest_json": None,
        }

        if debug:
            dump = root / f"{stamp}.json"
            latest = root / "latest.json"
            dump.write_text(json.dumps(result, indent=2), encoding="utf-8")
            latest.write_text(json.dumps(result, indent=2), encoding="utf-8")
            result["debug_json"] = str(dump)
            result["latest_json"] = str(latest)

        return result
    finally:
        raw_path.unlink(missing_ok=True)


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8765)
