#!/usr/bin/env python3
import json
from datetime import datetime
from pathlib import Path
from tempfile import NamedTemporaryFile

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from melody_pyin_core import run

root = Path(__file__).resolve().parent / "melody-runs"
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
    trim: bool = Form(True),
    fmin: float = Form(80.0),
    fmax: float = Form(900.0),
    frame_length: int = Form(2048),
    hop_length: int = Form(256),
    trim_db: float = Form(30.0),
    min_note_ms: float = Form(60.0),
    min_voiced_prob: float = Form(0.4),
    pitch_jump_cents: float = Form(80.0),
    max_unvoiced_gap_ms: float = Form(80.0),
    attack_ms: float = Form(180.0),
    attack_jump: int = Form(2),
    sound: str = Form("piano"),
):
    suffix = Path(audio.filename or "take.webm").suffix or ".webm"
    with NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await audio.read())
        path = tmp.name
    try:
        stamp = datetime.now().strftime("%Y%m%d-%H%M%S-%f")
        dump = root / f"{stamp}.json"
        csv = root / f"{stamp}.csv"
        latest_json = root / "latest.json"
        latest_csv = root / "latest.csv"
        out = run(
            path,
            {
                "bpm": bpm,
                "bars": bars,
                "beats_per_bar": beats_per_cycle,
                "steps_per_bar": steps_per_bar,
                "origin_sec": origin_sec,
                "trim": trim,
                "fmin": fmin,
                "fmax": fmax,
                "frame_length": frame_length,
                "hop_length": hop_length,
                "trim_db": trim_db,
                "min_note_ms": min_note_ms,
                "min_voiced_prob": min_voiced_prob,
                "pitch_jump_cents": pitch_jump_cents,
                "max_unvoiced_gap_ms": max_unvoiced_gap_ms,
                "attack_ms": attack_ms,
                "attack_jump": attack_jump,
                "sound": sound,
                "csv": str(csv),
            },
        )
        dump.write_text(json.dumps(out, indent=2), encoding="utf-8")
        latest_json.write_text(json.dumps(out, indent=2), encoding="utf-8")
        latest_csv.write_text(csv.read_text(encoding="utf-8"), encoding="utf-8")
        out["debug_json"] = str(dump)
        out["latest_json"] = str(latest_json)
        out["debug_csv"] = str(csv)
        out["latest_csv"] = str(latest_csv)
        return out
    finally:
        Path(path).unlink(missing_ok=True)


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8765)
