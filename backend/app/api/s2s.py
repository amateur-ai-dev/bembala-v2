from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.voice import S2SRequest, S2SResponse
from app.services.sarvam.factory import get_sarvam_client
from app.services.dialect_service import build_system_prompt
from app.models.session import ChatSession
from app.models.message import Message, MessageRole, ContentType
from app.models.employer import Employer
from app.models.user import User
from app.deps import current_user, get_db

router = APIRouter(prefix="/api", tags=["s2s"])

_DEFAULT_DOMAIN = "You are a helpful assistant for blue-collar workers."

@router.post("/s2s", response_model=S2SResponse)
def s2s(body: S2SRequest, user=Depends(current_user), db: Session = Depends(get_db)):
    session = db.query(ChatSession).filter(ChatSession.id == body.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    sarvam = get_sarvam_client()

    stt_result = sarvam.speech_to_text(body.audio_b64, body.dialect_code, body.language)
    transcript = stt_result["transcript"]

    db_user = db.query(User).filter(User.id == int(user["sub"])).first()
    domain_prompt = _DEFAULT_DOMAIN
    if db_user:
        from app.models.worker_profile import WorkerProfile
        wp = db.query(WorkerProfile).filter(WorkerProfile.user_id == db_user.id).first()
        if wp:
            emp = db.query(Employer).filter(Employer.id == wp.employer_id).first()
            if emp and emp.system_prompt:
                domain_prompt = emp.system_prompt

    system_prompt = build_system_prompt(domain_prompt=domain_prompt, dialect_code=body.dialect_code)

    chat_result = sarvam.chat(
        messages=[{"role": "user", "content": transcript}],
        system_prompt=system_prompt,
    )
    reply_text = chat_result["content"]

    tts_result = sarvam.text_to_speech(reply_text, body.dialect_code, body.language)

    db.add(Message(
        session_id=session.id, role=MessageRole.user,
        content_type=ContentType.audio_b64, content=body.audio_b64, transcript=transcript,
    ))
    db.add(Message(
        session_id=session.id, role=MessageRole.assistant,
        content_type=ContentType.audio_b64, content=tts_result["audio_b64"], transcript=reply_text,
    ))
    db.commit()

    return S2SResponse(
        audio_b64=tts_result["audio_b64"],
        transcript=transcript,
        reply_text=reply_text,
    )
