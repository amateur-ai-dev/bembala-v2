import base64
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def _get_token():
    r = client.post("/auth/request-otp", json={"phone": "8000000001"})
    otp = r.json()["otp"]
    r2 = client.post("/auth/verify-otp", json={"phone": "8000000001", "otp": otp, "role": "worker"})
    return r2.json()["access_token"]

def test_stt_returns_transcript():
    token = _get_token()
    fake_audio = base64.b64encode(b"fake-audio-data").decode()
    resp = client.post(
        "/api/stt",
        json={"audio_b64": fake_audio, "dialect_code": "kn-north", "language": "kn"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert "transcript" in resp.json()

def test_stt_requires_auth():
    fake_audio = base64.b64encode(b"fake").decode()
    resp = client.post("/api/stt", json={"audio_b64": fake_audio, "dialect_code": "kn-north", "language": "kn"})
    assert resp.status_code == 403
