from pathlib import Path
from typing import Union

import numpy as np
import ffmpeg
import pyloudnorm as pyln
import soundfile as sf
import torchaudio


def load_audio(path: str):
    return sf.read(path, always_2d=False)


def load_audio_robust(path: str):
    try:
        audio_tensor, sample_rate = torchaudio.load(path)
        return audio_tensor.numpy(), sample_rate
    except Exception:
        temp_path = str(Path(path).with_suffix(".ffmpeg-load.flac"))
        (
            ffmpeg.input(path)
            .output(temp_path, acodec="flac")
            .overwrite_output()
            .run(capture_stdout=True, capture_stderr=True)
        )
        try:
            audio_tensor, sample_rate = torchaudio.load(temp_path)
            return audio_tensor.numpy(), sample_rate
        finally:
            Path(temp_path).unlink(missing_ok=True)


def to_mono(data: np.ndarray) -> np.ndarray:
    if data.ndim == 1:
        return data.astype(np.float32)
    # torchaudio.load() returns [channels, samples], while some other loaders
    # return [samples, channels]. We want to average across the channel axis only.
    if data.ndim != 2:
        return np.asarray(data, dtype=np.float32).reshape(-1)
    if data.shape[0] <= 8 and data.shape[1] > data.shape[0]:
        return np.mean(data, axis=0, dtype=np.float32)
    if data.shape[1] <= 8 and data.shape[0] > data.shape[1]:
        return np.mean(data, axis=1, dtype=np.float32)
    return np.mean(data, axis=0, dtype=np.float32)


def normalize_loudness(audio_data: np.ndarray, sample_rate: int, target_lufs: float = -23.0) -> np.ndarray:
    try:
        meter = pyln.Meter(sample_rate)
        loudness = meter.integrated_loudness(audio_data)
        gain_db = target_lufs - loudness
        gain = 10.0 ** (gain_db / 20.0)
        out = audio_data * gain
        peak = float(np.max(np.abs(out))) if out.size else 0.0
        if peak > 1.0:
            out = out / peak
        return out.astype(np.float32)
    except Exception:
        return np.asarray(audio_data, dtype=np.float32)


def save_temp_audio(path: Union[str, Path], audio_data: np.ndarray, sample_rate: int) -> str:
    sf.write(str(path), audio_data, sample_rate)
    return str(path)
