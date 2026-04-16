import random
import string
import httpx
from datetime import datetime, timedelta
from typing import Optional, Dict
from jose import jwt, JWTError
from app.config import settings

# In-memory OTP store (phone -> otp). Sufficient for local/mock mode.
_otp_store: Dict[str, str] = {}


def generate_otp() -> str:
    return "".join(random.choices(string.digits, k=6))


def store_otp(phone: str, otp: str) -> None:
    _otp_store[phone] = otp


DEV_BYPASS_OTP = "000000"


def send_otp_sms(phone: str, otp: str) -> None:
    """Send OTP via Fast2SMS. Raises on failure."""
    response = httpx.get(
        "https://www.fast2sms.com/dev/bulkV2",
        params={
            "authorization": settings.fast2sms_api_key,
            "variables_values": otp,
            "route": "otp",
            "numbers": phone,
        },
        timeout=10,
    )
    data = response.json()
    if not data.get("return"):
        raise RuntimeError(f"Fast2SMS error: {data.get('message', 'unknown error')}")


def verify_otp(phone: str, otp: str) -> bool:
    # In mock mode, 000000 always works — skip copy-pasting OTPs during dev
    if settings.otp_mock and otp == DEV_BYPASS_OTP:
        return True
    stored = _otp_store.get(phone)
    if stored and stored == otp:
        del _otp_store[phone]  # consume OTP
        return True
    return False


def create_access_token(user_id: int, role: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": str(user_id), "role": role, "exp": expire}
    return jwt.encode(payload, settings.secret_key, algorithm="HS256")


def decode_token(token: str) -> Optional[Dict]:
    try:
        return jwt.decode(token, settings.secret_key, algorithms=["HS256"])
    except JWTError:
        return None
