from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def _get_token():
    r = client.post("/auth/request-otp", json={"phone": "8000000003"})
    otp = r.json()["otp"]
    r2 = client.post("/auth/verify-otp", json={"phone": "8000000003", "otp": otp, "role": "worker"})
    return r2.json()["access_token"]

def test_translate_returns_translated_text():
    token = _get_token()
    resp = client.post(
        "/api/translate",
        json={"text": "hello", "source_lang": "en", "target_lang": "kn"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert "[MOCK translated]" in resp.json()["translated_text"]
