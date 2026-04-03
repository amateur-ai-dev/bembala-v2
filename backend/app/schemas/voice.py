from pydantic import BaseModel

class STTRequest(BaseModel):
    audio_b64: str
    dialect_code: str
    language: str

class STTResponse(BaseModel):
    transcript: str
    language: str

class TTSRequest(BaseModel):
    text: str
    dialect_code: str
    language: str

class TTSResponse(BaseModel):
    audio_b64: str
    format: str = "wav"

class S2SRequest(BaseModel):
    audio_b64: str
    dialect_code: str
    language: str
    session_id: int

class S2SResponse(BaseModel):
    audio_b64: str
    transcript: str
    reply_text: str
    format: str = "wav"
