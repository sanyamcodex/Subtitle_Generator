from typing import List, Dict

from faster_whisper import WhisperModel


def transcribe_audio(audio_path: str) -> List[Dict]:
    """Transcribe WAV audio to segments using faster-whisper with word timing."""
    model = WhisperModel("small", device="cpu", compute_type="int8")

    segments_result = []
    segments, _ = model.transcribe(audio_path, beam_size=5, vad_filter=True, word_timestamps=True)

    for i, segment in enumerate(segments, start=1):
        words = []
        for w in segment.words:
            words.append(
                {
                    "text": w.word.strip(),
                    "start": float(w.start),
                    "end": float(w.end),
                }
            )

        segments_result.append(
            {
                "index": i,
                "start": float(segment.start),
                "end": float(segment.end),
                "text": segment.text.strip(),
                "words": words,
            }
        )

    return segments_result
