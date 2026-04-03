from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_request_otp_mock_returns_otp():
    resp = client.post("/auth/request-otp", json={"phone": "9876543210"})
    assert resp.status_code == 200
    data = resp.json()
    assert "otp" in data

def test_verify_otp_returns_token():
    resp = client.post("/auth/request-otp", json={"phone": "9000000001"})
    otp = resp.json()["otp"]
    resp2 = client.post("/auth/verify-otp", json={"phone": "9000000001", "otp": otp, "role": "worker"})
    assert resp2.status_code == 200
    assert "access_token" in resp2.json()

def test_verify_wrong_otp_returns_401():
    client.post("/auth/request-otp", json={"phone": "9000000002"})
    resp = client.post("/auth/verify-otp", json={"phone": "9000000002", "otp": "000000", "role": "worker"})
    assert resp.status_code == 401
