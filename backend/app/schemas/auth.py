from pydantic import BaseModel

class OTPRequest(BaseModel):
    phone: str

class OTPVerify(BaseModel):
    phone: str
    otp: str
    role: str = "worker"

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class OTPMockResponse(BaseModel):
    message: str
    otp: str
