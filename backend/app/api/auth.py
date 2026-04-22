from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.schemas.auth import OTPRequest, OTPVerify, TokenResponse
from app.services.auth_service import generate_otp, store_otp, verify_otp, create_access_token, send_otp_sms
from app.models.user import User, UserRole
from app.deps import get_db
from app.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/request-otp")
def request_otp(body: OTPRequest, db: Session = Depends(get_db)):
    otp = generate_otp()
    store_otp(body.phone, otp)
    if settings.otp_mock:
        return {"message": "OTP sent (mock mode)", "otp": otp}
    try:
        send_otp_sms(body.phone, otp)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"Failed to send OTP: {e}")
    return {"message": "OTP sent"}

@router.post("/verify-otp", response_model=TokenResponse)
def verify_otp_endpoint(body: OTPVerify, db: Session = Depends(get_db)):
    if not verify_otp(body.phone, body.otp):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid OTP")

    requested_role = UserRole.worker if body.role == "worker" else UserRole.employer
    user = db.query(User).filter(User.phone == body.phone).first()
    if not user:
        user = User(phone=body.phone, role=requested_role)
        db.add(user)
        db.commit()
        db.refresh(user)
    elif user.role != requested_role:
        user.role = requested_role
        db.commit()
        db.refresh(user)

    token = create_access_token(user_id=user.id, role=user.role.value)
    return TokenResponse(access_token=token)
