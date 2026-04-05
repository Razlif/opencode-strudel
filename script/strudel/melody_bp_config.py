from copy import deepcopy
from typing import Optional

BASE_BASIC_PITCH = {
    "onset_threshold": 0.5,
    "frame_threshold": 0.3,
    "minimum_note_length": 128,
    "minimum_frequency": 60.0,
    "maximum_frequency": 4000.0,
    "infer_onsets": True,
    "melodia_trick": True,
    "multiple_pitch_bends": False,
}

BASE_CONFIG = {
    "preset": "balanced",
    "adaptive": False,
    "separate_vocals": False,
    "separation_model": "none",
    "basic_pitch": deepcopy(BASE_BASIC_PITCH),
    "cleanup": {
        "spurious_max_dur_ms": 50.0,
        "spurious_max_conf": 0.2,
        "drop_short_ms": 70.0,
    },
}

PRESETS = {
    "auto_analyze_audio": {
        "basic_pitch": {
            "onset_threshold": 0.5,
            "frame_threshold": 0.3,
            "minimum_note_length": 128,
            "minimum_frequency": 60.0,
            "maximum_frequency": 4000.0,
            "infer_onsets": True,
            "melodia_trick": True,
            "multiple_pitch_bends": False,
        }
    },
    "balanced": {
        "basic_pitch": {
            "onset_threshold": 0.5,
            "frame_threshold": 0.3,
            "minimum_note_length": 128,
            "minimum_frequency": 60.0,
            "maximum_frequency": 4000.0,
            "infer_onsets": True,
            "melodia_trick": True,
            "multiple_pitch_bends": False,
        }
    },
    "solo_vocals": {
        "basic_pitch": {
            "onset_threshold": 0.4,
            "frame_threshold": 0.3,
            "minimum_note_length": 100,
            "minimum_frequency": 80.0,
            "maximum_frequency": 1200.0,
            "infer_onsets": True,
            "melodia_trick": True,
            "multiple_pitch_bends": True,
        }
    },
    "solo_piano": {
        "basic_pitch": {
            "onset_threshold": 0.4,
            "frame_threshold": 0.3,
            "minimum_note_length": 120,
            "minimum_frequency": 27.0,
            "maximum_frequency": 4200.0,
            "infer_onsets": True,
            "melodia_trick": True,
            "multiple_pitch_bends": True,
        }
    },
    "acoustic_guitar": {
        "basic_pitch": {
            "onset_threshold": 0.5,
            "frame_threshold": 0.3,
            "minimum_note_length": 90,
            "minimum_frequency": 80.0,
            "maximum_frequency": 2500.0,
            "infer_onsets": True,
            "melodia_trick": True,
            "multiple_pitch_bends": False,
        }
    },
    "bass_guitar": {
        "basic_pitch": {
            "onset_threshold": 0.4,
            "frame_threshold": 0.3,
            "minimum_note_length": 100,
            "minimum_frequency": 30.0,
            "maximum_frequency": 400.0,
            "infer_onsets": True,
            "melodia_trick": True,
            "multiple_pitch_bends": False,
        }
    },
    "percussion_drums": {
        "basic_pitch": {
            "onset_threshold": 0.7,
            "frame_threshold": 0.6,
            "minimum_note_length": 30,
            "minimum_frequency": 40.0,
            "maximum_frequency": 10000.0,
            "infer_onsets": True,
            "melodia_trick": False,
            "multiple_pitch_bends": False,
        }
    },
    "rock_metal": {
        "basic_pitch": {
            "onset_threshold": 0.6,
            "frame_threshold": 0.4,
            "minimum_note_length": 100,
            "minimum_frequency": 50.0,
            "maximum_frequency": 3000.0,
            "infer_onsets": True,
            "melodia_trick": True,
            "multiple_pitch_bends": True,
        }
    },
    "jazz_multi_instrument": {
        "basic_pitch": {
            "onset_threshold": 0.7,
            "frame_threshold": 0.5,
            "minimum_note_length": 150,
            "minimum_frequency": 55.0,
            "maximum_frequency": 2000.0,
            "infer_onsets": True,
            "melodia_trick": False,
            "multiple_pitch_bends": True,
        }
    },
    "classical_orchestral": {
        "basic_pitch": {
            "onset_threshold": 0.5,
            "frame_threshold": 0.4,
            "minimum_note_length": 200,
            "minimum_frequency": 32.0,
            "maximum_frequency": 4200.0,
            "infer_onsets": True,
            "melodia_trick": True,
            "multiple_pitch_bends": True,
        }
    },
    "electronic_synth": {
        "basic_pitch": {
            "onset_threshold": 0.3,
            "frame_threshold": 0.2,
            "minimum_note_length": 50,
            "minimum_frequency": 20.0,
            "maximum_frequency": 8000.0,
            "infer_onsets": True,
            "melodia_trick": False,
            "multiple_pitch_bends": False,
        }
    },
    "anime_j_pop": {
        "basic_pitch": {
            "onset_threshold": 0.5,
            "frame_threshold": 0.3,
            "minimum_note_length": 150,
            "minimum_frequency": 40.0,
            "maximum_frequency": 2500.0,
            "infer_onsets": True,
            "melodia_trick": True,
            "multiple_pitch_bends": True,
        }
    },
}


def deep_merge(dst: dict, src: dict) -> dict:
    for key, value in src.items():
        if isinstance(value, dict) and isinstance(dst.get(key), dict):
            deep_merge(dst[key], value)
        else:
            dst[key] = value
    return dst


def build_config(
    preset: str = "balanced",
    adaptive: bool = False,
    separate_vocals: bool = False,
    separation_model: str = "none",
    overrides: Optional[dict] = None,
) -> dict:
    cfg = deepcopy(BASE_CONFIG)
    cfg["preset"] = preset
    cfg["adaptive"] = adaptive
    cfg["separate_vocals"] = separate_vocals
    cfg["separation_model"] = separation_model
    deep_merge(cfg, PRESETS.get(preset, PRESETS["balanced"]))
    if overrides:
        deep_merge(cfg, overrides)
    return cfg
