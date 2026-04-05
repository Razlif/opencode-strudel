import librosa
import numpy as np
from typing import Optional


def analyze_audio_for_basic_pitch(audio_data, sample_rate: int, known_bpm: Optional[float] = None) -> dict:
    y = audio_data
    out = {}

    try:
        bpm = float(known_bpm) if known_bpm else float(np.median(librosa.beat.tempo(y=y, sr=sample_rate, aggregate=np.median)))
        if bpm > 0:
            min_len_s = (60.0 / bpm) / 16.0
            out["minimum_note_length"] = max(20, int(min_len_s * 1000))
    except Exception:
        pass

    try:
        centroid = librosa.feature.spectral_centroid(y=y, sr=sample_rate)[0]
        rolloff = librosa.feature.spectral_rolloff(y=y, sr=sample_rate)[0]
        avg_centroid = float(np.mean(centroid))
        avg_rolloff = float(np.mean(rolloff))
        if avg_centroid < 500 and avg_rolloff < 1500:
            out["minimum_frequency"] = 30.0
            out["maximum_frequency"] = 1200.0
        elif avg_centroid > 2000 or avg_rolloff > 5000:
            out["minimum_frequency"] = 100.0
            out["maximum_frequency"] = 8000.0
        else:
            out["minimum_frequency"] = 50.0
            out["maximum_frequency"] = 4000.0
    except Exception:
        pass

    try:
        y_harmonic, y_percussive = librosa.effects.hpss(y)
        percussive_ratio = float(np.sum(y_percussive**2) / (np.sum(y_harmonic**2) + 1e-10))
        out["onset_threshold"] = 0.6 if percussive_ratio > 0.5 else 0.45
    except Exception:
        pass

    try:
        rms = librosa.feature.rms(y=y)[0]
        noise_floor = float(np.percentile(rms, 10))
        out["frame_threshold"] = max(0.05, min(0.4, noise_floor * 4))
    except Exception:
        pass

    return out
