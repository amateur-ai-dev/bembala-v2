from app.services.auth_service import (
    generate_otp, store_otp, verify_otp, create_access_token, decode_token
)

def test_generate_otp_is_6_digits():
    otp = generate_otp()
    assert len(otp) == 6
    assert otp.isdigit()

def test_store_and_verify_otp_succeeds():
    store_otp("9876543210", "123456")
    assert verify_otp("9876543210", "123456") is True

def test_verify_wrong_otp_fails():
    store_otp("9876543210", "123456")
    assert verify_otp("9876543210", "999999") is False

def test_verify_otp_consumed_after_first_use():
    store_otp("1111111111", "777777")
    assert verify_otp("1111111111", "777777") is True
    assert verify_otp("1111111111", "777777") is False

def test_create_and_decode_token():
    token = create_access_token(user_id=42, role="worker")
    payload = decode_token(token)
    assert payload["sub"] == "42"
    assert payload["role"] == "worker"

def test_decode_invalid_token_returns_none():
    result = decode_token("not-a-real-token")
    assert result is None
