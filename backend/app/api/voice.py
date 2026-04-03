from fastapi import APIRouter, Depends
from app.schemas.voice import STTRequest, STTResponse, TTSRequest, TTSResponse
from app.services.sarvam.factory import get_sarvam_client
from app.deps import current_user

router = APIRouter(prefix="/api", tags=["voice"])

@router.post("/stt", response_model=STTResponse)
def stt(body: STTRequest, user=Depends(current_user)):
    sarvam = get_sarvam_client()
    result = sarvam.speech_to_text(body.audio_b64, body.dialect_code, body.language)
    return STTResponse(**result)

@router.post("/tts", response_model=TTSResponse)
def tts(body: TTSRequest, user=Depends(current_user)):
    sarvam = get_sarvam_client()
    result = sarvam.text_to_speech(body.text, body.dialect_code, body.language)
    return TTSResponse(**result)
