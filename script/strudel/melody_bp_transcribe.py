from typing import Dict, List

from basic_pitch import ICASSP_2022_MODEL_PATH
from basic_pitch.inference import predict

NOTE_NAMES = ["c", "c#", "d", "eb", "e", "f", "f#", "g", "ab", "a", "bb", "b"]


def midi_to_note_name(midi: int) -> str:
    return f"{NOTE_NAMES[midi % 12]}{(midi // 12) - 1}"


def run_basic_pitch(audio_path: str, cfg: dict):
    bp = cfg["basic_pitch"]
    return predict(
        audio_path=audio_path,
        model_or_model_path=ICASSP_2022_MODEL_PATH,
        onset_threshold=bp["onset_threshold"],
        frame_threshold=bp["frame_threshold"],
        minimum_note_length=bp["minimum_note_length"],
        minimum_frequency=bp["minimum_frequency"],
        maximum_frequency=bp["maximum_frequency"],
        melodia_trick=bp["melodia_trick"],
        multiple_pitch_bends=bp["multiple_pitch_bends"],
        infer_onsets=bp["infer_onsets"],
    )


def note_events_to_segmented(note_events) -> List[Dict]:
    out = []
    for item in note_events:
        midi = int(item[2])
        start = float(item[0])
        end = float(item[1])
        conf = float(item[3]) if len(item) > 3 else 1.0
        out.append(
            {
                "midi": midi,
                "note": midi_to_note_name(midi),
                "start_sec": start,
                "dur_sec": max(0.0, end - start),
                "confidence": conf,
            }
        )
    return out
