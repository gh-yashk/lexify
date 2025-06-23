import os
import whisper
import torch

from utils.logger_setup import logger

model = {
    "tiny": whisper.load_model("tiny"),
    "base.en": whisper.load_model("base.en"),
}

logger.info("Whisper models loaded successfully.")


def transcribe_audio(audio_path: str) -> str:
    """
    Transcribe the given audio file to text.

    Args:
    - audio_path (str): Path to the audio file.

    Returns:
    - str: The transcribed text.

    Raises:
    - FileNotFoundError: If the audio file is not found.
    - ValueError: If the language detected is not English.
    - RuntimeError: If transcription fails.
    """
    logger.info(f"Starting transcription for file: {audio_path}")

    if not os.path.exists(audio_path):
        logger.error(f"File not found: {audio_path}")
        raise FileNotFoundError(f"File not found: {audio_path}")

    detect_language_result = detect_language(audio_path)
    if detect_language_result != "en":
        logger.error(
            f"Unsupported language detected: {detect_language_result}. Only English is supported."
        )
        raise ValueError(
            f"Unsupported language: {detect_language_result}. Only English is supported."
        )

    use_fp16 = (
        torch.cuda.is_available() and torch.cuda.get_device_capability()[0] >= 7.5
    )

    logger.info(f"Using FP16: {use_fp16}")

    try:
        result = model["base.en"].transcribe(
            audio_path,
            language="en",
            fp16=use_fp16,
        )
        logger.info(f"Transcription successful for file: {audio_path}")
        logger.debug(f"Transcription result: {result['text']}")
        return result["text"]
    except Exception as e:
        logger.error(f"Failed to transcribe audio: {str(e)}")
        raise RuntimeError(f"Failed to transcribe audio: {e}")


def detect_language(audio_path: str, sample_duration: float = 30.0) -> str:
    """
    Detect the language of the given audio file.

    Args:
    - audio_path (str): Path to the audio file.
    - sample_duration (float): Duration of the audio (in seconds) to sample for language detection. Default is 30 seconds.

    Returns:
    - str: The detected language code.

    Raises:
    - FileNotFoundError: If the audio file is not found.
    - RuntimeError: If language detection fails.
    """
    logger.info(f"Detecting language for file: {audio_path}")

    try:
        if not os.path.exists(audio_path):
            logger.error(f"File not found: {audio_path}")
            raise FileNotFoundError(f"File not found: {audio_path}")

        full_audio = whisper.load_audio(audio_path)

        sample_length = int(sample_duration * whisper.audio.SAMPLE_RATE)
        sample_audio = full_audio[:sample_length]
        sample_audio = whisper.pad_or_trim(sample_audio)

        mel = whisper.log_mel_spectrogram(sample_audio).to(model["tiny"].device)
        _, probs = model["tiny"].detect_language(mel)
        language = max(probs, key=probs.get)

        logger.info(f"Detected language: {language} for file: {audio_path}")
        return language

    except Exception as e:
        logger.error(f"Failed to detect language for file {audio_path}: {str(e)}")
        raise RuntimeError(f"Failed to detect language: {e}")
