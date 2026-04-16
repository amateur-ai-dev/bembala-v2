from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def _get_employer_token():
    r = client.post("/auth/request-otp", json={"phone": "5000000001"})
    otp = r.json()["otp"]
    r2 = client.post("/auth/verify-otp", json={"phone": "5000000001", "otp": otp, "role": "employer"})
    return r2.json()["access_token"]

def _get_worker_token():
    r = client.post("/auth/request-otp", json={"phone": "5000000002"})
    otp = r.json()["otp"]
    r2 = client.post("/auth/verify-otp", json={"phone": "5000000002", "otp": otp, "role": "worker"})
    return r2.json()["access_token"]

def test_employer_register_org():
    token = _get_employer_token()
    resp = client.post(
        "/api/employer/register",
        json={"org_name": "Swiggy Instamart", "system_prompt": "You help delivery workers."},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["org_name"] == "Swiggy Instamart"

def test_update_domain_config():
    token = _get_employer_token()
    client.post("/api/employer/register", json={"org_name": "Test Org", "system_prompt": "old"},
                headers={"Authorization": f"Bearer {token}"})
    resp = client.put(
        "/api/employer/config",
        json={"system_prompt": "You help skilled labour workers with job assignments."},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert "job assignments" in resp.json()["system_prompt"]

def test_worker_cannot_access_employer_endpoints():
    token = _get_worker_token()
    resp = client.put("/api/employer/config", json={"system_prompt": "malicious"},
                      headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 403
