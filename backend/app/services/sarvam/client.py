import httpx
from typing import List, Dict
from app.config import settings

SARVAM_BASE = "https://api.sarvam.ai"

class SarvamClient:
    def __init__(self):
        self.headers = {
            "API-Subscription-Key": settings.sarvam_api_key,
            "Content-Type": "application/json",
        }

    def speech_to_text(self, audio_b64: str, dialect_code: str, language: str) -> Dict:
        resp = httpx.post(
            f"{SARVAM_BASE}/speech-to-text",
            headers=self.headers,
            json={"audio": audio_b64, "language_code": language, "model": "saaras:v3"},
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        return {"transcript": data.get("transcript", ""), "language": language}

    def text_to_speech(self, text: str, dialect_code: str, language: str) -> Dict:
        resp = httpx.post(
            f"{SARVAM_BASE}/text-to-speech",
            headers=self.headers,
            json={"inputs": [text], "target_language_code": language, "model": "bulbul:v3"},
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        return {"audio_b64": data["audios"][0], "format": "wav"}

    def chat(self, messages: List[Dict], system_prompt: str) -> Dict:
        resp = httpx.post(
            f"{SARVAM_BASE}/chat/completions",
            headers=self.headers,
            json={
                "model": "sarvam-m",
                "messages": [{"role": "system", "content": system_prompt}] + messages,
            },
            timeout=60,
        )
        resp.raise_for_status()
        data = resp.json()
        choice = data["choices"][0]["message"]
        return {"content": choice["content"], "finish_reason": data["choices"][0]["finish_reason"]}

    def translate(self, text: str, source_lang: str, target_lang: str) -> Dict:
        resp = httpx.post(
            f"{SARVAM_BASE}/translate",
            headers=self.headers,
            json={
                "input": text,
                "source_language_code": source_lang,
                "target_language_code": target_lang,
                "model": "mayura:v1",
            },
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        return {"translated_text": data.get("translated_text", "")}
