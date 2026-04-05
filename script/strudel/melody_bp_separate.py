from pathlib import Path

import numpy as np
import torch
import torchaudio
from demucs.apply import apply_model
from demucs.audio import convert_audio
from demucs.pretrained import get_model


_demucs_model = None


def _get_demucs_model():
    global _demucs_model
    if _demucs_model is None:
        _demucs_model = get_model(name="htdemucs_ft")
        if torch.cuda.is_available():
            _demucs_model = _demucs_model.cuda()
    return _demucs_model


def maybe_separate(audio_path: str, cfg: dict) -> str:
    if not cfg.get("separate_vocals"):
        return audio_path

    model = _get_demucs_model()
    audio_tensor, sample_rate = torchaudio.load(audio_path)
    audio_tensor = convert_audio(audio_tensor, sample_rate, model.samplerate, model.audio_channels)
    batch = audio_tensor[None]
    if torch.cuda.is_available():
        batch = batch.cuda()

    with torch.no_grad():
        separated = apply_model(
            model,
            batch,
            device="cuda" if torch.cuda.is_available() else "cpu",
            progress=False,
        )[0]

    if torch.cuda.is_available():
        torch.cuda.empty_cache()

    sources = {name: stem.detach().cpu() for name, stem in zip(model.sources, separated)}
    vocals = sources.get("vocals")
    if vocals is None:
        return audio_path
    if vocals.numel() == 0:
        return audio_path
    if float(torch.max(torch.abs(vocals)).item()) < 1e-4:
        return audio_path
    if vocals.shape[-1] < int(model.samplerate * 0.25):
        return audio_path

    output_path = str(Path(audio_path).with_suffix(".vocals.flac"))
    torchaudio.save(output_path, vocals, model.samplerate)
    return output_path
