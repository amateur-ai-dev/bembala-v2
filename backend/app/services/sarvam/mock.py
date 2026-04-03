import base64
from typing import List, Dict

# Minimal silent WAV (44 bytes): RIFF header + fmt chunk + data chunk
_SILENT_WAV = (
    b"RIFF$\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00"
    b"D\xac\x00\x00\x88X\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00"
)
_SILENT_WAV_B64 = base64.b64encode(_SILENT_WAV).decode()

_MOCK_TRANSCRIPTS = {
    "kn": "ನಮಸ್ಕಾರ, ನನಗೆ ಸಹಾಯ ಮಾಡಿ",
    "te": "నమస్కారం, నాకు సహాయం చేయండి",
    "ta": "வணக்கம், எனக்கு உதவுங்கள்",
}


class MockSarvamClient:
    def speech_to_text(self, audio_b64: str, dialect_code: str, language: str) -> Dict:
        lang_prefix = language[:2] if language else "kn"
        transcript = _MOCK_TRANSCRIPTS.get(lang_prefix, _MOCK_TRANSCRIPTS["kn"])
        return {"transcript": transcript, "language": language}

    def text_to_speech(self, text: str, dialect_code: str, language: str) -> Dict:
        return {"audio_b64": _SILENT_WAV_B64, "format": "wav"}

    def chat(self, messages: List[Dict], system_prompt: str) -> Dict:
        return {"content": "[MOCK] ನಿಮ್ಮ ಪ್ರಶ್ನೆಗೆ ಉತ್ತರ ಇಲ್ಲಿದೆ", "finish_reason": "stop"}

    def translate(self, text: str, source_lang: str, target_lang: str) -> Dict:
        return {"translated_text": f"[MOCK translated] {text}"}
