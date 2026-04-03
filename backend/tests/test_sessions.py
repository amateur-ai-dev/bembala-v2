from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def _get_token(phone):
    r = client.post("/auth/request-otp", json={"phone": phone})
    otp = r.json()["otp"]
    r2 = client.post("/auth/verify-otp", json={"phone": phone, "otp": otp, "role": "worker"})
    return r2.json()["access_token"]

def test_create_session():
    token = _get_token("6000000001")
    resp = client.post("/api/sessions", json={}, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert "id" in resp.json()

def test_get_messages_empty_session():
    token = _get_token("6000000003")
    r = client.post("/api/sessions", json={}, headers={"Authorization": f"Bearer {token}"})
    session_id = r.json()["id"]
    resp = client.get(f"/api/sessions/{session_id}/messages", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json() == []

def test_cannot_access_other_users_session():
    token1 = _get_token("6000000004")
    r = client.post("/api/sessions", json={}, headers={"Authorization": f"Bearer {token1}"})
    session_id = r.json()["id"]

    r2 = client.post("/auth/request-otp", json={"phone": "6000000005"})
    otp2 = r2.json()["otp"]
    r3 = client.post("/auth/verify-otp", json={"phone": "6000000005", "otp": otp2, "role": "worker"})
    token2 = r3.json()["access_token"]

    resp = client.get(f"/api/sessions/{session_id}/messages", headers={"Authorization": f"Bearer {token2}"})
    assert resp.status_code == 403
