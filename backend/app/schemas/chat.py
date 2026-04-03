from typing import List
from pydantic import BaseModel

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    dialect_code: str
    domain_prompt: str = "You are a helpful assistant for blue-collar workers."

class ChatResponse(BaseModel):
    content: str
    finish_reason: str = "stop"
