from fastapi import APIRouter, Depends
from app.schemas.translate import TranslateRequest, TranslateResponse
from app.services.sarvam.factory import get_sarvam_client
from app.deps import current_user

router = APIRouter(prefix="/api", tags=["translate"])

@router.post("/translate", response_model=TranslateResponse)
def translate(body: TranslateRequest, user=Depends(current_user)):
    sarvam = get_sarvam_client()
    result = sarvam.translate(body.text, body.source_lang, body.target_lang)
    return TranslateResponse(**result)
