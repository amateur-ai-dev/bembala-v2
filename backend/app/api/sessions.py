from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession
from typing import List
from app.schemas.session import SessionOut, MessageOut
from app.models.session import ChatSession
from app.models.message import Message
from app.deps import current_user, get_db

router = APIRouter(prefix="/api", tags=["sessions"])

@router.post("/sessions", response_model=SessionOut)
def create_session(user=Depends(current_user), db: DBSession = Depends(get_db)):
    session = ChatSession(user_id=int(user["sub"]))
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

@router.get("/sessions/{session_id}/messages", response_model=List[MessageOut])
def get_messages(session_id: int, user=Depends(current_user), db: DBSession = Depends(get_db)):
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != int(user["sub"]):
        raise HTTPException(status_code=403, detail="Forbidden")
    return db.query(Message).filter(Message.session_id == session_id).all()
