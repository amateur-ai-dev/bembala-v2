from fastapi import APIRouter, Depends
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.sarvam.factory import get_sarvam_client
from app.services.dialect_service import build_system_prompt
from app.deps import current_user

router = APIRouter(prefix="/api", tags=["chat"])

@router.post("/chat", response_model=ChatResponse)
def chat(body: ChatRequest, user=Depends(current_user)):
    system_prompt = build_system_prompt(
        domain_prompt=body.domain_prompt,
        dialect_code=body.dialect_code,
    )
    sarvam = get_sarvam_client()
    messages = [{"role": m.role, "content": m.content} for m in body.messages]
    result = sarvam.chat(messages=messages, system_prompt=system_prompt)
    return ChatResponse(**result)
