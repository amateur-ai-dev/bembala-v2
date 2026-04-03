import os
os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")
os.environ.setdefault("SARVAM_MOCK", "true")
os.environ.setdefault("OTP_MOCK", "true")
os.environ.setdefault("SECRET_KEY", "test-secret")
os.environ.setdefault("SARVAM_API_KEY", "")

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
from app.database import Base, engine as app_engine
from app.main import app

# Create all tables for tests
Base.metadata.create_all(bind=app_engine)

@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c
