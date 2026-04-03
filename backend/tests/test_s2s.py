import base64
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def _get_token_and_session():
    r = client.post("/auth/request-otp", json={"phone": "7000000002"})
    otp = r.json()["otp"]
    r2 = client.post("/auth/verify-otp", json={"phone": "7000000002", "otp": otp, "role": "worker"})
    token = r2.json()["access_token"]
    r3 = client.post("/api/sessions", json={}, headers={"Authorization": f"Bearer {token}"})
    session_id = r3.json()["id"]
    return token, session_id

def test_s2s_returns_audio_and_transcript():
    token, session_id = _get_token_and_session()
    fake_audio = base64.b64encode(b"fake-audio").decode()
    resp = client.post(
        "/api/s2s",
        json={"audio_b64": fake_audio, "dialect_code": "kn-north", "language": "kn", "session_id": session_id},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "audio_b64" in data
    assert "transcript" in data
    assert "reply_text" in data
