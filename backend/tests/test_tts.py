from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def _get_token():
    r = client.post("/auth/request-otp", json={"phone": "8000000002"})
    otp = r.json()["otp"]
    r2 = client.post("/auth/verify-otp", json={"phone": "8000000002", "otp": otp, "role": "worker"})
    return r2.json()["access_token"]

def test_tts_returns_audio():
    token = _get_token()
    resp = client.post(
        "/api/tts",
        json={"text": "ನಮಸ್ಕಾರ", "dialect_code": "kn-north", "language": "kn"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert "audio_b64" in resp.json()
