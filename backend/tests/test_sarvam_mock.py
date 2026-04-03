import pytest
from app.services.sarvam.mock import MockSarvamClient

@pytest.fixture
def client():
    return MockSarvamClient()

def test_mock_stt_returns_kannada_transcript(client):
    result = client.speech_to_text(audio_b64="fake", dialect_code="kn-north", language="kn")
    assert result["transcript"] == "ನಮಸ್ಕಾರ, ನನಗೆ ಸಹಾಯ ಮಾಡಿ"

def test_mock_tts_returns_base64_audio(client):
    result = client.text_to_speech(text="hello", dialect_code="kn-north", language="kn")
    assert "audio_b64" in result
    assert isinstance(result["audio_b64"], str)
    assert len(result["audio_b64"]) > 0

def test_mock_chat_returns_mock_response(client):
    result = client.chat(messages=[{"role": "user", "content": "help"}], system_prompt="test")
    assert result["content"].startswith("[MOCK]")

def test_mock_translate_returns_prefixed_input(client):
    result = client.translate(text="hello", source_lang="en", target_lang="kn")
    assert result["translated_text"].startswith("[MOCK translated]")
    assert "hello" in result["translated_text"]
