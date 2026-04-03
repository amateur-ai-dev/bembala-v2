from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def _get_token():
    r = client.post("/auth/request-otp", json={"phone": "7000000001"})
    otp = r.json()["otp"]
    r2 = client.post("/auth/verify-otp", json={"phone": "7000000001", "otp": otp, "role": "worker"})
    return r2.json()["access_token"]

def test_chat_returns_assistant_reply():
    token = _get_token()
    resp = client.post(
        "/api/chat",
        json={
            "messages": [{"role": "user", "content": "What is my shift today?"}],
            "dialect_code": "kn-north",
            "domain_prompt": "You assist quick-commerce delivery workers.",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert "[MOCK]" in resp.json()["content"]
