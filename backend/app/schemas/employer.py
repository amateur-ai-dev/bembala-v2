from typing import Optional, List
from pydantic import BaseModel

class EmployerRegister(BaseModel):
    org_name: str
    system_prompt: Optional[str] = None

class EmployerOut(BaseModel):
    id: int
    org_name: str
    system_prompt: Optional[str]

    model_config = {"from_attributes": True}

class DomainConfigUpdate(BaseModel):
    system_prompt: str

class WorkerOut(BaseModel):
    id: int
    phone: str
    display_name: str
    dialect_code: str

    model_config = {"from_attributes": True}
