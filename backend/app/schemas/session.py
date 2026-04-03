from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class SessionOut(BaseModel):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

class MessageOut(BaseModel):
    id: int
    session_id: int
    role: str
    content_type: str
    content: str
    transcript: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
