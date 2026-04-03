# Vaakya Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a FastAPI backend for Vaakya — dialect-aware voice+text assistant for blue-collar workers — with full Sarvam AI integration (mocked by default), PostgreSQL persistence, and JWT auth.

**Architecture:** FastAPI serves REST endpoints for STT, TTS, chat, translation, and S2S. A factory pattern selects between the real Sarvam AI client and local mock stubs via `SARVAM_MOCK` env var. SQLAlchemy + Alembic manage a PostgreSQL schema for users, sessions, messages, and employer config.

**Tech Stack:** Python 3.11, FastAPI, SQLAlchemy 2.x, Alembic, PostgreSQL 15, python-jose (JWT), pytest, httpx (test client), Docker

---

## File Map

```
backend/
├── app/
│   ├── main.py                        # FastAPI app + router registration
│   ├── config.py                      # pydantic-settings config from env
│   ├── database.py                    # SQLAlchemy engine, session factory
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py                    # User ORM model
│   │   ├── employer.py                # Employer ORM model
│   │   ├── worker_profile.py          # WorkerProfile ORM model
│   │   ├── session.py                 # ChatSession ORM model
│   │   ├── message.py                 # Message ORM model
│   │   └── dialect.py                 # Dialect ORM model
│   ├── schemas/
│   │   ├── auth.py                    # OTPRequest, OTPVerify, TokenResponse
│   │   ├── voice.py                   # STTRequest, TTSRequest, S2SRequest/Response
│   │   ├── chat.py                    # ChatRequest, ChatResponse
│   │   ├── translate.py               # TranslateRequest, TranslateResponse
│   │   ├── session.py                 # SessionCreate, MessageOut
│   │   └── employer.py                # WorkerOut, DomainConfigUpdate
│   ├── api/
│   │   ├── __init__.py
│   │   ├── auth.py                    # POST /auth/request-otp, /auth/verify-otp
│   │   ├── voice.py                   # POST /api/stt, /api/tts, /api/s2s
│   │   ├── chat.py                    # POST /api/chat
│   │   ├── translate.py               # POST /api/translate
│   │   ├── sessions.py                # POST /api/sessions, GET /api/sessions/{id}/messages
│   │   └── employer.py                # GET/POST /employer/workers, PUT /employer/config
│   ├── services/
│   │   ├── auth_service.py            # OTP store, JWT encode/decode
│   │   ├── dialect_service.py         # dialect registry, system prompt builder
│   │   └── sarvam/
│   │       ├── __init__.py
│   │       ├── factory.py             # returns mock or real client
│   │       ├── mock.py                # deterministic mock stubs
│   │       └── client.py             # real Sarvam API HTTP calls
│   └── deps.py                        # FastAPI dependency: get_db, current_user
├── alembic/
│   ├── env.py
│   └── versions/                      # migration files go here
├── tests/
│   ├── conftest.py                    # test DB, app fixture, auth helpers
│   ├── test_auth.py
│   ├── test_stt.py
│   ├── test_tts.py
│   ├── test_chat.py
│   ├── test_translate.py
│   ├── test_s2s.py
│   ├── test_sessions.py
│   └── test_employer.py
├── Dockerfile
├── requirements.txt
├── alembic.ini
└── .env.example
```

---

## Task 1: Project scaffold + dependencies

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/.env.example`
- Create: `backend/app/__init__.py`
- Create: `backend/app/config.py`

- [ ] **Step 1: Create `backend/requirements.txt`**

```
fastapi==0.111.0
uvicorn[standard]==0.29.0
sqlalchemy==2.0.30
alembic==1.13.1
psycopg2-binary==2.9.9
pydantic-settings==2.2.1
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
httpx==0.27.0
pytest==8.2.0
pytest-asyncio==0.23.6
python-multipart==0.0.9
```

- [ ] **Step 2: Create `backend/.env.example`**

```env
DATABASE_URL=postgresql://vaakya:vaakya@localhost:5432/vaakya
SECRET_KEY=change-me-in-production-use-32-random-bytes
SARVAM_API_KEY=your-sarvam-api-key-here
SARVAM_MOCK=true
OTP_MOCK=true
```

- [ ] **Step 3: Create `backend/app/config.py`**

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "postgresql://vaakya:vaakya@localhost:5432/vaakya"
    secret_key: str = "dev-secret-key"
    sarvam_api_key: str = ""
    sarvam_mock: bool = True
    otp_mock: bool = True
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days

    class Config:
        env_file = ".env"

settings = Settings()
```

- [ ] **Step 4: Create `backend/app/__init__.py`** (empty file)

- [ ] **Step 5: Commit**

```bash
cd backend
git add requirements.txt .env.example app/
git commit -m "chore: backend scaffold, config, and dependencies"
```

---

## Task 2: Database setup + ORM models

**Files:**
- Create: `backend/app/database.py`
- Create: `backend/app/models/__init__.py`
- Create: `backend/app/models/user.py`
- Create: `backend/app/models/employer.py`
- Create: `backend/app/models/worker_profile.py`
- Create: `backend/app/models/session.py`
- Create: `backend/app/models/message.py`
- Create: `backend/app/models/dialect.py`

- [ ] **Step 1: Write failing test for model imports**

Create `backend/tests/conftest.py`:

```python
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base

TEST_DB_URL = "sqlite:///:memory:"

@pytest.fixture(scope="session")
def engine():
    eng = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(eng)
    return eng

@pytest.fixture
def db(engine):
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.rollback()
    session.close()
```

Create `backend/tests/test_models.py`:

```python
from app.models.user import User
from app.models.employer import Employer
from app.models.worker_profile import WorkerProfile
from app.models.session import ChatSession
from app.models.message import Message
from app.models.dialect import Dialect

def test_models_importable():
    assert User.__tablename__ == "users"
    assert Employer.__tablename__ == "employers"
    assert WorkerProfile.__tablename__ == "worker_profiles"
    assert ChatSession.__tablename__ == "sessions"
    assert Message.__tablename__ == "messages"
    assert Dialect.__tablename__ == "dialects"
```

- [ ] **Step 2: Run to verify failure**

```bash
cd backend && pytest tests/test_models.py -v
```
Expected: ImportError — `app.database` not found

- [ ] **Step 3: Create `backend/app/database.py`**

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import settings

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass
```

- [ ] **Step 4: Create `backend/app/models/__init__.py`** (empty)

- [ ] **Step 5: Create `backend/app/models/user.py`**

```python
from datetime import datetime
from sqlalchemy import String, DateTime, Enum
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
import enum

class UserRole(str, enum.Enum):
    worker = "worker"
    employer = "employer"

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    phone: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), nullable=False)
    dialect_code: Mapped[str] = mapped_column(String(30), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
```

- [ ] **Step 6: Create `backend/app/models/employer.py`**

```python
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class Employer(Base):
    __tablename__ = "employers"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    org_name: Mapped[str] = mapped_column(String(200), nullable=False)
    system_prompt: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
```

- [ ] **Step 7: Create `backend/app/models/worker_profile.py`**

```python
from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class WorkerProfile(Base):
    __tablename__ = "worker_profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    employer_id: Mapped[int] = mapped_column(ForeignKey("employers.id"), nullable=False)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    dialect_code: Mapped[str] = mapped_column(String(30), nullable=False)
```

- [ ] **Step 8: Create `backend/app/models/session.py`**

```python
from datetime import datetime
from sqlalchemy import DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class ChatSession(Base):
    __tablename__ = "sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

- [ ] **Step 9: Create `backend/app/models/message.py`**

```python
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
import enum

class MessageRole(str, enum.Enum):
    user = "user"
    assistant = "assistant"

class ContentType(str, enum.Enum):
    text = "text"
    audio_b64 = "audio_b64"

class Message(Base):
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("sessions.id"), nullable=False)
    role: Mapped[MessageRole] = mapped_column(Enum(MessageRole), nullable=False)
    content_type: Mapped[ContentType] = mapped_column(Enum(ContentType), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    transcript: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
```

- [ ] **Step 10: Create `backend/app/models/dialect.py`**

```python
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class Dialect(Base):
    __tablename__ = "dialects"

    code: Mapped[str] = mapped_column(String(30), primary_key=True)
    language: Mapped[str] = mapped_column(String(50), nullable=False)
    state: Mapped[str] = mapped_column(String(50), nullable=False)
    display_name_local: Mapped[str] = mapped_column(String(100), nullable=False)
    display_name_en: Mapped[str] = mapped_column(String(100), nullable=False)
```

- [ ] **Step 11: Run test to verify pass**

```bash
cd backend && pytest tests/test_models.py -v
```
Expected: PASS — `test_models_importable`

- [ ] **Step 12: Commit**

```bash
git add app/database.py app/models/ tests/
git commit -m "feat: database setup and ORM models"
```

---

## Task 3: Dialect registry + seeder

**Files:**
- Create: `backend/app/services/dialect_service.py`
- Test: `backend/tests/test_dialect_service.py`

- [ ] **Step 1: Write failing test**

Create `backend/tests/test_dialect_service.py`:

```python
from app.services.dialect_service import get_all_dialects, build_system_prompt, DIALECTS

def test_dialect_registry_has_12_entries():
    assert len(DIALECTS) == 12

def test_dialect_registry_has_all_codes():
    codes = [d["code"] for d in DIALECTS]
    assert "kn-north" in codes
    assert "kn-coastal" in codes
    assert "kn-bengaluru" in codes
    assert "te-coastal-ap" in codes
    assert "te-rayalaseema" in codes
    assert "te-north-ap" in codes
    assert "te-hyderabad" in codes
    assert "te-north-tg" in codes
    assert "te-south-tg" in codes
    assert "ta-chennai" in codes
    assert "ta-west" in codes
    assert "ta-south" in codes

def test_build_system_prompt_combines_domain_and_dialect():
    domain = "You assist quick-commerce delivery workers."
    prompt = build_system_prompt(domain_prompt=domain, dialect_code="kn-north")
    assert "quick-commerce" in prompt
    assert "North Karnataka" in prompt
    assert "ಉತ್ತರ ಕರ್ನಾಟಕ" in prompt

def test_build_system_prompt_unknown_dialect_raises():
    import pytest
    with pytest.raises(ValueError, match="Unknown dialect"):
        build_system_prompt(domain_prompt="test", dialect_code="xx-unknown")
```

- [ ] **Step 2: Run to verify failure**

```bash
cd backend && pytest tests/test_dialect_service.py -v
```
Expected: ImportError

- [ ] **Step 3: Create `backend/app/services/dialect_service.py`**

```python
from typing import List, Dict

DIALECTS: List[Dict] = [
    {
        "code": "kn-north",
        "language": "Kannada",
        "state": "Karnataka",
        "display_name_local": "ಉತ್ತರ ಕರ್ನಾಟಕ",
        "display_name_en": "North Karnataka Kannada",
        "dialect_instruction": (
            "Respond in spoken North Karnataka Kannada (ಉತ್ತರ ಕರ್ನಾಟಕ). "
            "Use colloquial Dharwad/Hubli vocabulary, not formal Mysuru Kannada."
        ),
    },
    {
        "code": "kn-coastal",
        "language": "Kannada",
        "state": "Karnataka",
        "display_name_local": "ಕರಾವಳಿ ಕನ್ನಡ",
        "display_name_en": "Coastal Karnataka Kannada",
        "dialect_instruction": (
            "Respond in spoken Coastal Karnataka Kannada (ಕರಾವಳಿ ಕನ್ನಡ). "
            "Use Tulu-influenced Mangaluru vocabulary and natural spoken rhythm."
        ),
    },
    {
        "code": "kn-bengaluru",
        "language": "Kannada",
        "state": "Karnataka",
        "display_name_local": "ಬೆಂಗಳೂರು ಕನ್ನಡ",
        "display_name_en": "Bengaluru Kannada",
        "dialect_instruction": (
            "Respond in spoken Bengaluru Kannada (ಬೆಂಗಳೂರು ಕನ್ನಡ). "
            "Use urban Bengaluru colloquial style, mix of Kannada and local slang."
        ),
    },
    {
        "code": "te-coastal-ap",
        "language": "Telugu",
        "state": "Andhra Pradesh",
        "display_name_local": "కోస్తా ఆంధ్ర",
        "display_name_en": "Coastal Andhra Telugu",
        "dialect_instruction": (
            "Respond in spoken Coastal Andhra Telugu (కోస్తా ఆంధ్ర). "
            "Use Krishna/Guntur district colloquial style."
        ),
    },
    {
        "code": "te-rayalaseema",
        "language": "Telugu",
        "state": "Andhra Pradesh",
        "display_name_local": "రాయలసీమ",
        "display_name_en": "Rayalaseema Telugu",
        "dialect_instruction": (
            "Respond in spoken Rayalaseema Telugu (రాయలసీమ). "
            "Use Kurnool/Kadapa district vocabulary and natural spoken tone."
        ),
    },
    {
        "code": "te-north-ap",
        "language": "Telugu",
        "state": "Andhra Pradesh",
        "display_name_local": "ఉత్తరాంధ్ర",
        "display_name_en": "North Andhra Telugu",
        "dialect_instruction": (
            "Respond in spoken North Andhra Telugu (ఉత్తరాంధ్ర). "
            "Use Vizag/Srikakulam district vocabulary and colloquial style."
        ),
    },
    {
        "code": "te-hyderabad",
        "language": "Telugu",
        "state": "Telangana",
        "display_name_local": "హైదరాబాద్",
        "display_name_en": "Hyderabad Telugu",
        "dialect_instruction": (
            "Respond in spoken Hyderabad Telugu (హైదరాబాద్). "
            "Use Hyderabadi colloquial style with natural Urdu-influenced expressions."
        ),
    },
    {
        "code": "te-north-tg",
        "language": "Telugu",
        "state": "Telangana",
        "display_name_local": "ఉత్తర తెలంగాణ",
        "display_name_en": "North Telangana Telugu",
        "dialect_instruction": (
            "Respond in spoken North Telangana Telugu (ఉత్తర తెలంగాణ). "
            "Use Nizamabad/Karimnagar district vocabulary."
        ),
    },
    {
        "code": "te-south-tg",
        "language": "Telugu",
        "state": "Telangana",
        "display_name_local": "దక్షిణ తెలంగాణ",
        "display_name_en": "South Telangana Telugu",
        "dialect_instruction": (
            "Respond in spoken South Telangana Telugu (దక్షిణ తెలంగాణ). "
            "Use Mahbubnagar/Nalgonda district vocabulary."
        ),
    },
    {
        "code": "ta-chennai",
        "language": "Tamil",
        "state": "Tamil Nadu",
        "display_name_local": "சென்னை தமிழ்",
        "display_name_en": "Chennai Tamil",
        "dialect_instruction": (
            "Respond in spoken Chennai Tamil (சென்னை தமிழ்). "
            "Use urban Chennai colloquial style, natural and fast-paced."
        ),
    },
    {
        "code": "ta-west",
        "language": "Tamil",
        "state": "Tamil Nadu",
        "display_name_local": "மேற்கு தமிழ்",
        "display_name_en": "Western Tamil",
        "dialect_instruction": (
            "Respond in spoken Western Tamil (மேற்கு தமிழ்). "
            "Use Coimbatore/Salem district vocabulary and colloquial rhythm."
        ),
    },
    {
        "code": "ta-south",
        "language": "Tamil",
        "state": "Tamil Nadu",
        "display_name_local": "தென் தமிழ்",
        "display_name_en": "Southern Tamil",
        "dialect_instruction": (
            "Respond in spoken Southern Tamil (தென் தமிழ்). "
            "Use Madurai/Tirunelveli district vocabulary and natural tone."
        ),
    },
]

_DIALECT_MAP = {d["code"]: d for d in DIALECTS}


def get_all_dialects() -> List[Dict]:
    return DIALECTS


def build_system_prompt(domain_prompt: str, dialect_code: str) -> str:
    dialect = _DIALECT_MAP.get(dialect_code)
    if not dialect:
        raise ValueError(f"Unknown dialect: {dialect_code}")
    return (
        f"{domain_prompt}\n\n"
        f"Language instruction: {dialect['dialect_instruction']} "
        f"Always respond in {dialect['display_name_en']} ({dialect['display_name_local']}). "
        f"Keep responses concise and easy to understand for a blue-collar worker."
    )
```

- [ ] **Step 4: Run test to verify pass**

```bash
cd backend && pytest tests/test_dialect_service.py -v
```
Expected: 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add app/services/dialect_service.py tests/test_dialect_service.py
git commit -m "feat: dialect registry and system prompt builder"
```

---

## Task 4: Sarvam mock + factory

**Files:**
- Create: `backend/app/services/sarvam/__init__.py`
- Create: `backend/app/services/sarvam/mock.py`
- Create: `backend/app/services/sarvam/client.py`
- Create: `backend/app/services/sarvam/factory.py`
- Test: `backend/tests/test_sarvam_mock.py`

- [ ] **Step 1: Write failing test**

Create `backend/tests/test_sarvam_mock.py`:

```python
import pytest
from app.services.sarvam.mock import MockSarvamClient

@pytest.fixture
def client():
    return MockSarvamClient()

def test_mock_stt_returns_kannada_transcript(client):
    result = client.speech_to_text(audio_b64="fake", dialect_code="kn-north", language="kn")
    assert result["transcript"] == "ನಮಸ್ಕಾರ, ನನಗೆ ಸಹಾಯ ಮಾಡಿ"

def test_mock_tts_returns_base64_audio(client):
    result = client.text_to_speech(text="hello", dialect_code="kn-north", language="kn")
    assert "audio_b64" in result
    assert isinstance(result["audio_b64"], str)
    assert len(result["audio_b64"]) > 0

def test_mock_chat_returns_mock_response(client):
    result = client.chat(messages=[{"role": "user", "content": "help"}], system_prompt="test")
    assert result["content"].startswith("[MOCK]")

def test_mock_translate_returns_prefixed_input(client):
    result = client.translate(text="hello", source_lang="en", target_lang="kn")
    assert result["translated_text"].startswith("[MOCK translated]")
    assert "hello" in result["translated_text"]
```

- [ ] **Step 2: Run to verify failure**

```bash
cd backend && pytest tests/test_sarvam_mock.py -v
```
Expected: ImportError

- [ ] **Step 3: Create `backend/app/services/sarvam/__init__.py`** (empty)

- [ ] **Step 4: Create `backend/app/services/sarvam/mock.py`**

```python
import base64
from typing import List, Dict

# Minimal silent WAV (44 bytes): RIFF header + fmt chunk + data chunk
_SILENT_WAV = (
    b"RIFF$\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00"
    b"D\xac\x00\x00\x88X\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00"
)
_SILENT_WAV_B64 = base64.b64encode(_SILENT_WAV).decode()

_MOCK_TRANSCRIPTS = {
    "kn": "ನಮಸ್ಕಾರ, ನನಗೆ ಸಹಾಯ ಮಾಡಿ",
    "te": "నమస్కారం, నాకు సహాయం చేయండి",
    "ta": "வணக்கம், எனக்கு உதவுங்கள்",
}


class MockSarvamClient:
    def speech_to_text(self, audio_b64: str, dialect_code: str, language: str) -> Dict:
        lang_prefix = language[:2] if language else "kn"
        transcript = _MOCK_TRANSCRIPTS.get(lang_prefix, _MOCK_TRANSCRIPTS["kn"])
        return {"transcript": transcript, "language": language}

    def text_to_speech(self, text: str, dialect_code: str, language: str) -> Dict:
        return {"audio_b64": _SILENT_WAV_B64, "format": "wav"}

    def chat(self, messages: List[Dict], system_prompt: str) -> Dict:
        return {"content": "[MOCK] ನಿಮ್ಮ ಪ್ರಶ್ನೆಗೆ ಉತ್ತರ ಇಲ್ಲಿದೆ", "finish_reason": "stop"}

    def translate(self, text: str, source_lang: str, target_lang: str) -> Dict:
        return {"translated_text": f"[MOCK translated] {text}"}
```

- [ ] **Step 5: Create `backend/app/services/sarvam/client.py`**

```python
import httpx
from typing import List, Dict
from app.config import settings

SARVAM_BASE = "https://api.sarvam.ai"

class SarvamClient:
    def __init__(self):
        self.headers = {
            "API-Subscription-Key": settings.sarvam_api_key,
            "Content-Type": "application/json",
        }

    def speech_to_text(self, audio_b64: str, dialect_code: str, language: str) -> Dict:
        resp = httpx.post(
            f"{SARVAM_BASE}/speech-to-text",
            headers=self.headers,
            json={"audio": audio_b64, "language_code": language, "model": "saaras:v3"},
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        return {"transcript": data.get("transcript", ""), "language": language}

    def text_to_speech(self, text: str, dialect_code: str, language: str) -> Dict:
        resp = httpx.post(
            f"{SARVAM_BASE}/text-to-speech",
            headers=self.headers,
            json={"inputs": [text], "target_language_code": language, "model": "bulbul:v3"},
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        return {"audio_b64": data["audios"][0], "format": "wav"}

    def chat(self, messages: List[Dict], system_prompt: str) -> Dict:
        resp = httpx.post(
            f"{SARVAM_BASE}/chat/completions",
            headers=self.headers,
            json={
                "model": "sarvam-m",
                "messages": [{"role": "system", "content": system_prompt}] + messages,
            },
            timeout=60,
        )
        resp.raise_for_status()
        data = resp.json()
        choice = data["choices"][0]["message"]
        return {"content": choice["content"], "finish_reason": data["choices"][0]["finish_reason"]}

    def translate(self, text: str, source_lang: str, target_lang: str) -> Dict:
        resp = httpx.post(
            f"{SARVAM_BASE}/translate",
            headers=self.headers,
            json={
                "input": text,
                "source_language_code": source_lang,
                "target_language_code": target_lang,
                "model": "mayura:v1",
            },
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        return {"translated_text": data.get("translated_text", "")}
```

- [ ] **Step 6: Create `backend/app/services/sarvam/factory.py`**

```python
from app.config import settings
from app.services.sarvam.mock import MockSarvamClient
from app.services.sarvam.client import SarvamClient

def get_sarvam_client():
    if settings.sarvam_mock:
        return MockSarvamClient()
    return SarvamClient()
```

- [ ] **Step 7: Run test to verify pass**

```bash
cd backend && pytest tests/test_sarvam_mock.py -v
```
Expected: 4 tests PASS

- [ ] **Step 8: Commit**

```bash
git add app/services/sarvam/ tests/test_sarvam_mock.py
git commit -m "feat: Sarvam mock client and factory"
```

---

## Task 5: Auth service (OTP + JWT)

**Files:**
- Create: `backend/app/services/auth_service.py`
- Create: `backend/app/schemas/auth.py`
- Test: `backend/tests/test_auth_service.py`

- [ ] **Step 1: Write failing test**

Create `backend/tests/test_auth_service.py`:

```python
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
    assert verify_otp("1111111111", "777777") is False  # consumed

def test_create_and_decode_token():
    token = create_access_token(user_id=42, role="worker")
    payload = decode_token(token)
    assert payload["sub"] == "42"
    assert payload["role"] == "worker"

def test_decode_invalid_token_returns_none():
    result = decode_token("not-a-real-token")
    assert result is None
```

- [ ] **Step 2: Run to verify failure**

```bash
cd backend && pytest tests/test_auth_service.py -v
```
Expected: ImportError

- [ ] **Step 3: Create `backend/app/services/auth_service.py`**

```python
import random
import string
from datetime import datetime, timedelta
from typing import Optional, Dict
from jose import jwt, JWTError
from app.config import settings

# In-memory OTP store (phone -> otp). Sufficient for local/mock mode.
_otp_store: Dict[str, str] = {}


def generate_otp() -> str:
    return "".join(random.choices(string.digits, k=6))


def store_otp(phone: str, otp: str) -> None:
    _otp_store[phone] = otp


def verify_otp(phone: str, otp: str) -> bool:
    stored = _otp_store.get(phone)
    if stored and stored == otp:
        del _otp_store[phone]  # consume OTP
        return True
    return False


def create_access_token(user_id: int, role: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": str(user_id), "role": role, "exp": expire}
    return jwt.encode(payload, settings.secret_key, algorithm="HS256")


def decode_token(token: str) -> Optional[Dict]:
    try:
        return jwt.decode(token, settings.secret_key, algorithms=["HS256"])
    except JWTError:
        return None
```

- [ ] **Step 4: Create `backend/app/schemas/auth.py`**

```python
from pydantic import BaseModel

class OTPRequest(BaseModel):
    phone: str

class OTPVerify(BaseModel):
    phone: str
    otp: str
    role: str = "worker"  # "worker" or "employer"

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class OTPMockResponse(BaseModel):
    message: str
    otp: str  # only present in mock mode
```

- [ ] **Step 5: Run test to verify pass**

```bash
cd backend && pytest tests/test_auth_service.py -v
```
Expected: 6 tests PASS

- [ ] **Step 6: Commit**

```bash
git add app/services/auth_service.py app/schemas/auth.py tests/test_auth_service.py
git commit -m "feat: OTP generation and JWT auth service"
```

---

## Task 6: FastAPI app + auth endpoints

**Files:**
- Create: `backend/app/deps.py`
- Create: `backend/app/api/__init__.py`
- Create: `backend/app/api/auth.py`
- Create: `backend/app/main.py`
- Test: `backend/tests/test_auth.py`

- [ ] **Step 1: Write failing test**

Create `backend/tests/test_auth.py`:

```python
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_request_otp_mock_returns_otp():
    resp = client.post("/auth/request-otp", json={"phone": "9876543210"})
    assert resp.status_code == 200
    data = resp.json()
    assert "otp" in data  # mock mode exposes OTP

def test_verify_otp_returns_token():
    # First get OTP
    resp = client.post("/auth/request-otp", json={"phone": "9000000001"})
    otp = resp.json()["otp"]
    # Then verify
    resp2 = client.post("/auth/verify-otp", json={"phone": "9000000001", "otp": otp, "role": "worker"})
    assert resp2.status_code == 200
    assert "access_token" in resp2.json()

def test_verify_wrong_otp_returns_401():
    client.post("/auth/request-otp", json={"phone": "9000000002"})
    resp = client.post("/auth/verify-otp", json={"phone": "9000000002", "otp": "000000", "role": "worker"})
    assert resp.status_code == 401
```

- [ ] **Step 2: Run to verify failure**

```bash
cd backend && pytest tests/test_auth.py -v
```
Expected: ImportError — `app.main` not found

- [ ] **Step 3: Create `backend/app/deps.py`**

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.services.auth_service import decode_token

bearer = HTTPBearer()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
) -> dict:
    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return payload
```

- [ ] **Step 4: Create `backend/app/api/__init__.py`** (empty)

- [ ] **Step 5: Create `backend/app/api/auth.py`**

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.schemas.auth import OTPRequest, OTPVerify, TokenResponse, OTPMockResponse
from app.services.auth_service import generate_otp, store_otp, verify_otp, create_access_token
from app.models.user import User, UserRole
from app.deps import get_db
from app.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/request-otp")
def request_otp(body: OTPRequest, db: Session = Depends(get_db)):
    otp = generate_otp()
    store_otp(body.phone, otp)
    if settings.otp_mock:
        return {"message": "OTP sent (mock mode)", "otp": otp}
    # Real SMS integration goes here
    return {"message": "OTP sent"}

@router.post("/verify-otp", response_model=TokenResponse)
def verify_otp_endpoint(body: OTPVerify, db: Session = Depends(get_db)):
    if not verify_otp(body.phone, body.otp):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid OTP")

    user = db.query(User).filter(User.phone == body.phone).first()
    if not user:
        role = UserRole.worker if body.role == "worker" else UserRole.employer
        user = User(phone=body.phone, role=role)
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token(user_id=user.id, role=user.role.value)
    return TokenResponse(access_token=token)
```

- [ ] **Step 6: Create `backend/app/main.py`**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth as auth_router

app = FastAPI(title="Vaakya API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)

@app.get("/health")
def health():
    return {"status": "ok"}
```

- [ ] **Step 7: Run test to verify pass**

```bash
cd backend && pytest tests/test_auth.py -v
```
Expected: 3 tests PASS

- [ ] **Step 8: Commit**

```bash
git add app/deps.py app/api/ app/main.py tests/test_auth.py
git commit -m "feat: FastAPI app, CORS, auth endpoints"
```

---

## Task 7: STT, TTS, and Translate endpoints

**Files:**
- Create: `backend/app/schemas/voice.py`
- Create: `backend/app/schemas/translate.py`
- Create: `backend/app/api/voice.py`
- Create: `backend/app/api/translate.py`
- Modify: `backend/app/main.py`
- Test: `backend/tests/test_stt.py`
- Test: `backend/tests/test_tts.py`
- Test: `backend/tests/test_translate.py`

- [ ] **Step 1: Write failing tests**

Create `backend/tests/test_stt.py`:

```python
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
```

Create `backend/tests/test_tts.py`:

```python
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
```

Create `backend/tests/test_translate.py`:

```python
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
    assert "translated_text" in resp.json()
    assert "[MOCK translated]" in resp.json()["translated_text"]
```

- [ ] **Step 2: Run to verify failure**

```bash
cd backend && pytest tests/test_stt.py tests/test_tts.py tests/test_translate.py -v
```
Expected: ImportError or 404

- [ ] **Step 3: Create `backend/app/schemas/voice.py`**

```python
from pydantic import BaseModel

class STTRequest(BaseModel):
    audio_b64: str
    dialect_code: str
    language: str  # "kn", "te", "ta"

class STTResponse(BaseModel):
    transcript: str
    language: str

class TTSRequest(BaseModel):
    text: str
    dialect_code: str
    language: str

class TTSResponse(BaseModel):
    audio_b64: str
    format: str = "wav"

class S2SRequest(BaseModel):
    audio_b64: str
    dialect_code: str
    language: str
    session_id: int

class S2SResponse(BaseModel):
    audio_b64: str
    transcript: str
    reply_text: str
    format: str = "wav"
```

- [ ] **Step 4: Create `backend/app/schemas/translate.py`**

```python
from pydantic import BaseModel

class TranslateRequest(BaseModel):
    text: str
    source_lang: str
    target_lang: str

class TranslateResponse(BaseModel):
    translated_text: str
```

- [ ] **Step 5: Create `backend/app/api/voice.py`**

```python
from fastapi import APIRouter, Depends
from app.schemas.voice import STTRequest, STTResponse, TTSRequest, TTSResponse
from app.services.sarvam.factory import get_sarvam_client
from app.deps import current_user

router = APIRouter(prefix="/api", tags=["voice"])

@router.post("/stt", response_model=STTResponse)
def stt(body: STTRequest, user=Depends(current_user)):
    sarvam = get_sarvam_client()
    result = sarvam.speech_to_text(body.audio_b64, body.dialect_code, body.language)
    return STTResponse(**result)

@router.post("/tts", response_model=TTSResponse)
def tts(body: TTSRequest, user=Depends(current_user)):
    sarvam = get_sarvam_client()
    result = sarvam.text_to_speech(body.text, body.dialect_code, body.language)
    return TTSResponse(**result)
```

- [ ] **Step 6: Create `backend/app/api/translate.py`**

```python
from fastapi import APIRouter, Depends
from app.schemas.translate import TranslateRequest, TranslateResponse
from app.services.sarvam.factory import get_sarvam_client
from app.deps import current_user

router = APIRouter(prefix="/api", tags=["translate"])

@router.post("/translate", response_model=TranslateResponse)
def translate(body: TranslateRequest, user=Depends(current_user)):
    sarvam = get_sarvam_client()
    result = sarvam.translate(body.text, body.source_lang, body.target_lang)
    return TranslateResponse(**result)
```

- [ ] **Step 7: Update `backend/app/main.py` to register new routers**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth as auth_router
from app.api import voice as voice_router
from app.api import translate as translate_router

app = FastAPI(title="Vaakya API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(voice_router.router)
app.include_router(translate_router.router)

@app.get("/health")
def health():
    return {"status": "ok"}
```

- [ ] **Step 8: Run tests to verify pass**

```bash
cd backend && pytest tests/test_stt.py tests/test_tts.py tests/test_translate.py -v
```
Expected: 4 tests PASS

- [ ] **Step 9: Commit**

```bash
git add app/schemas/voice.py app/schemas/translate.py app/api/voice.py app/api/translate.py app/main.py tests/
git commit -m "feat: STT, TTS, and translate endpoints"
```

---

## Task 8: Chat + S2S endpoints

**Files:**
- Create: `backend/app/schemas/chat.py`
- Create: `backend/app/api/chat.py`
- Create: `backend/app/api/s2s.py`
- Modify: `backend/app/main.py`
- Test: `backend/tests/test_chat.py`
- Test: `backend/tests/test_s2s.py`

- [ ] **Step 1: Write failing tests**

Create `backend/tests/test_chat.py`:

```python
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
    data = resp.json()
    assert "content" in data
    assert "[MOCK]" in data["content"]
```

Create `backend/tests/test_s2s.py`:

```python
import base64
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def _get_token_and_session():
    r = client.post("/auth/request-otp", json={"phone": "7000000002"})
    otp = r.json()["otp"]
    r2 = client.post("/auth/verify-otp", json={"phone": "7000000002", "otp": otp, "role": "worker"})
    token = r2.json()["access_token"]
    r3 = client.post(
        "/api/sessions",
        json={},
        headers={"Authorization": f"Bearer {token}"},
    )
    session_id = r3.json()["id"]
    return token, session_id

def test_s2s_returns_audio_and_transcript():
    token, session_id = _get_token_and_session()
    fake_audio = base64.b64encode(b"fake-audio").decode()
    resp = client.post(
        "/api/s2s",
        json={
            "audio_b64": fake_audio,
            "dialect_code": "kn-north",
            "language": "kn",
            "session_id": session_id,
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "audio_b64" in data
    assert "transcript" in data
    assert "reply_text" in data
```

- [ ] **Step 2: Run to verify failure**

```bash
cd backend && pytest tests/test_chat.py tests/test_s2s.py -v
```
Expected: 404 or ImportError

- [ ] **Step 3: Create `backend/app/schemas/chat.py`**

```python
from typing import List, Dict
from pydantic import BaseModel

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    dialect_code: str
    domain_prompt: str = "You are a helpful assistant for blue-collar workers."

class ChatResponse(BaseModel):
    content: str
    finish_reason: str = "stop"
```

- [ ] **Step 4: Create `backend/app/api/chat.py`**

```python
from fastapi import APIRouter, Depends
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.sarvam.factory import get_sarvam_client
from app.services.dialect_service import build_system_prompt
from app.deps import current_user

router = APIRouter(prefix="/api", tags=["chat"])

@router.post("/chat", response_model=ChatResponse)
def chat(body: ChatRequest, user=Depends(current_user)):
    system_prompt = build_system_prompt(
        domain_prompt=body.domain_prompt,
        dialect_code=body.dialect_code,
    )
    sarvam = get_sarvam_client()
    messages = [{"role": m.role, "content": m.content} for m in body.messages]
    result = sarvam.chat(messages=messages, system_prompt=system_prompt)
    return ChatResponse(**result)
```

- [ ] **Step 5: Create `backend/app/api/s2s.py`**

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.voice import S2SRequest, S2SResponse
from app.services.sarvam.factory import get_sarvam_client
from app.services.dialect_service import build_system_prompt
from app.models.session import ChatSession
from app.models.message import Message, MessageRole, ContentType
from app.models.employer import Employer
from app.models.user import User
from app.deps import current_user, get_db

router = APIRouter(prefix="/api", tags=["s2s"])

_DEFAULT_DOMAIN = "You are a helpful assistant for blue-collar workers."

@router.post("/s2s", response_model=S2SResponse)
def s2s(body: S2SRequest, user=Depends(current_user), db: Session = Depends(get_db)):
    session = db.query(ChatSession).filter(ChatSession.id == body.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    sarvam = get_sarvam_client()

    # 1. STT
    stt_result = sarvam.speech_to_text(body.audio_b64, body.dialect_code, body.language)
    transcript = stt_result["transcript"]

    # 2. Resolve domain prompt from employer config (fall back to default)
    db_user = db.query(User).filter(User.id == int(user["sub"])).first()
    domain_prompt = _DEFAULT_DOMAIN
    if db_user:
        from app.models.worker_profile import WorkerProfile
        wp = db.query(WorkerProfile).filter(WorkerProfile.user_id == db_user.id).first()
        if wp:
            emp = db.query(Employer).filter(Employer.id == wp.employer_id).first()
            if emp and emp.system_prompt:
                domain_prompt = emp.system_prompt

    system_prompt = build_system_prompt(domain_prompt=domain_prompt, dialect_code=body.dialect_code)

    # 3. Chat
    chat_result = sarvam.chat(
        messages=[{"role": "user", "content": transcript}],
        system_prompt=system_prompt,
    )
    reply_text = chat_result["content"]

    # 4. TTS
    tts_result = sarvam.text_to_speech(reply_text, body.dialect_code, body.language)

    # 5. Persist messages
    db.add(Message(
        session_id=session.id, role=MessageRole.user,
        content_type=ContentType.audio_b64, content=body.audio_b64, transcript=transcript,
    ))
    db.add(Message(
        session_id=session.id, role=MessageRole.assistant,
        content_type=ContentType.audio_b64, content=tts_result["audio_b64"], transcript=reply_text,
    ))
    db.commit()

    return S2SResponse(
        audio_b64=tts_result["audio_b64"],
        transcript=transcript,
        reply_text=reply_text,
    )
```

- [ ] **Step 6: Update `backend/app/main.py`**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth as auth_router
from app.api import voice as voice_router
from app.api import translate as translate_router
from app.api import chat as chat_router
from app.api import s2s as s2s_router

app = FastAPI(title="Vaakya API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(voice_router.router)
app.include_router(translate_router.router)
app.include_router(chat_router.router)
app.include_router(s2s_router.router)

@app.get("/health")
def health():
    return {"status": "ok"}
```

- [ ] **Step 7: Run tests to verify pass**

```bash
cd backend && pytest tests/test_chat.py tests/test_s2s.py -v
```
Expected: 2 tests PASS

- [ ] **Step 8: Commit**

```bash
git add app/schemas/chat.py app/api/chat.py app/api/s2s.py app/main.py tests/
git commit -m "feat: chat and speech-to-speech endpoints"
```

---

## Task 9: Sessions + Message history endpoints

**Files:**
- Create: `backend/app/schemas/session.py`
- Create: `backend/app/api/sessions.py`
- Modify: `backend/app/main.py`
- Test: `backend/tests/test_sessions.py`

- [ ] **Step 1: Write failing test**

Create `backend/tests/test_sessions.py`:

```python
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def _get_token():
    r = client.post("/auth/request-otp", json={"phone": "6000000001"})
    otp = r.json()["otp"]
    r2 = client.post("/auth/verify-otp", json={"phone": "6000000001", "otp": otp, "role": "worker"})
    return r2.json()["access_token"]

def test_create_session():
    token = _get_token()
    resp = client.post("/api/sessions", json={}, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert "id" in resp.json()

def test_get_messages_empty_session():
    token = _get_token()
    r = client.post("/api/sessions", json={}, headers={"Authorization": f"Bearer {token}"})
    session_id = r.json()["id"]
    resp = client.get(
        f"/api/sessions/{session_id}/messages",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert resp.json() == []

def test_cannot_access_other_users_session():
    # Create session as user 1
    token1 = _get_token()
    r = client.post("/api/sessions", json={}, headers={"Authorization": f"Bearer {token1}"})
    session_id = r.json()["id"]

    # Try to access as user 2
    r2 = client.post("/auth/request-otp", json={"phone": "6000000002"})
    otp2 = r2.json()["otp"]
    r3 = client.post("/auth/verify-otp", json={"phone": "6000000002", "otp": otp2, "role": "worker"})
    token2 = r3.json()["access_token"]

    resp = client.get(
        f"/api/sessions/{session_id}/messages",
        headers={"Authorization": f"Bearer {token2}"},
    )
    assert resp.status_code == 403
```

- [ ] **Step 2: Run to verify failure**

```bash
cd backend && pytest tests/test_sessions.py -v
```
Expected: 404

- [ ] **Step 3: Create `backend/app/schemas/session.py`**

```python
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class SessionOut(BaseModel):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class MessageOut(BaseModel):
    id: int
    session_id: int
    role: str
    content_type: str
    content: str
    transcript: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
```

- [ ] **Step 4: Create `backend/app/api/sessions.py`**

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession
from typing import List
from app.schemas.session import SessionOut, MessageOut
from app.models.session import ChatSession
from app.models.message import Message
from app.deps import current_user, get_db

router = APIRouter(prefix="/api", tags=["sessions"])

@router.post("/sessions", response_model=SessionOut)
def create_session(user=Depends(current_user), db: DBSession = Depends(get_db)):
    session = ChatSession(user_id=int(user["sub"]))
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

@router.get("/sessions/{session_id}/messages", response_model=List[MessageOut])
def get_messages(session_id: int, user=Depends(current_user), db: DBSession = Depends(get_db)):
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != int(user["sub"]):
        raise HTTPException(status_code=403, detail="Forbidden")
    return db.query(Message).filter(Message.session_id == session_id).all()
```

- [ ] **Step 5: Update `backend/app/main.py`**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth as auth_router
from app.api import voice as voice_router
from app.api import translate as translate_router
from app.api import chat as chat_router
from app.api import s2s as s2s_router
from app.api import sessions as sessions_router

app = FastAPI(title="Vaakya API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(voice_router.router)
app.include_router(translate_router.router)
app.include_router(chat_router.router)
app.include_router(s2s_router.router)
app.include_router(sessions_router.router)

@app.get("/health")
def health():
    return {"status": "ok"}
```

- [ ] **Step 6: Run tests**

```bash
cd backend && pytest tests/test_sessions.py -v
```
Expected: 3 tests PASS

- [ ] **Step 7: Commit**

```bash
git add app/schemas/session.py app/api/sessions.py app/main.py tests/test_sessions.py
git commit -m "feat: session creation and message history endpoints"
```

---

## Task 10: Employer API endpoints

**Files:**
- Create: `backend/app/schemas/employer.py`
- Create: `backend/app/api/employer.py`
- Modify: `backend/app/main.py`
- Test: `backend/tests/test_employer.py`

- [ ] **Step 1: Write failing test**

Create `backend/tests/test_employer.py`:

```python
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
        "/employer/register",
        json={"org_name": "Swiggy Instamart", "system_prompt": "You help delivery workers."},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["org_name"] == "Swiggy Instamart"

def test_update_domain_config():
    token = _get_employer_token()
    client.post(
        "/employer/register",
        json={"org_name": "Test Org", "system_prompt": "old prompt"},
        headers={"Authorization": f"Bearer {token}"},
    )
    resp = client.put(
        "/employer/config",
        json={"system_prompt": "You help skilled labour workers with job assignments."},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert "job assignments" in resp.json()["system_prompt"]

def test_worker_cannot_access_employer_endpoints():
    token = _get_worker_token()
    resp = client.put(
        "/employer/config",
        json={"system_prompt": "malicious"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 403
```

- [ ] **Step 2: Run to verify failure**

```bash
cd backend && pytest tests/test_employer.py -v
```
Expected: 404

- [ ] **Step 3: Create `backend/app/schemas/employer.py`**

```python
from typing import Optional, List
from pydantic import BaseModel

class EmployerRegister(BaseModel):
    org_name: str
    system_prompt: Optional[str] = None

class EmployerOut(BaseModel):
    id: int
    org_name: str
    system_prompt: Optional[str]

    class Config:
        from_attributes = True

class DomainConfigUpdate(BaseModel):
    system_prompt: str

class WorkerOut(BaseModel):
    id: int
    phone: str
    display_name: str
    dialect_code: str

    class Config:
        from_attributes = True
```

- [ ] **Step 4: Create `backend/app/api/employer.py`**

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.schemas.employer import EmployerRegister, EmployerOut, DomainConfigUpdate, WorkerOut
from app.models.employer import Employer
from app.models.user import User, UserRole
from app.models.worker_profile import WorkerProfile
from app.deps import current_user, get_db

router = APIRouter(prefix="/employer", tags=["employer"])

def _require_employer(user: dict, db: Session) -> Employer:
    if user.get("role") != "employer":
        raise HTTPException(status_code=403, detail="Employer access required")
    db_user = db.query(User).filter(User.id == int(user["sub"])).first()
    emp = db.query(Employer).filter(Employer.user_id == db_user.id).first()
    return emp

@router.post("/register", response_model=EmployerOut)
def register_org(body: EmployerRegister, user=Depends(current_user), db: Session = Depends(get_db)):
    if user.get("role") != "employer":
        raise HTTPException(status_code=403, detail="Employer access required")
    db_user = db.query(User).filter(User.id == int(user["sub"])).first()
    existing = db.query(Employer).filter(Employer.user_id == db_user.id).first()
    if existing:
        return existing
    emp = Employer(user_id=db_user.id, org_name=body.org_name, system_prompt=body.system_prompt)
    db.add(emp)
    db.commit()
    db.refresh(emp)
    return emp

@router.put("/config", response_model=EmployerOut)
def update_config(body: DomainConfigUpdate, user=Depends(current_user), db: Session = Depends(get_db)):
    emp = _require_employer(user, db)
    if not emp:
        raise HTTPException(status_code=404, detail="Register your org first")
    emp.system_prompt = body.system_prompt
    db.commit()
    db.refresh(emp)
    return emp

@router.get("/workers", response_model=List[WorkerOut])
def list_workers(user=Depends(current_user), db: Session = Depends(get_db)):
    emp = _require_employer(user, db)
    if not emp:
        return []
    profiles = db.query(WorkerProfile).filter(WorkerProfile.employer_id == emp.id).all()
    result = []
    for p in profiles:
        db_user = db.query(User).filter(User.id == p.user_id).first()
        result.append(WorkerOut(id=p.id, phone=db_user.phone, display_name=p.display_name, dialect_code=p.dialect_code))
    return result
```

- [ ] **Step 5: Update `backend/app/main.py`**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth as auth_router
from app.api import voice as voice_router
from app.api import translate as translate_router
from app.api import chat as chat_router
from app.api import s2s as s2s_router
from app.api import sessions as sessions_router
from app.api import employer as employer_router

app = FastAPI(title="Vaakya API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(voice_router.router)
app.include_router(translate_router.router)
app.include_router(chat_router.router)
app.include_router(s2s_router.router)
app.include_router(sessions_router.router)
app.include_router(employer_router.router)

@app.get("/health")
def health():
    return {"status": "ok"}
```

- [ ] **Step 6: Run tests**

```bash
cd backend && pytest tests/test_employer.py -v
```
Expected: 3 tests PASS

- [ ] **Step 7: Run full test suite**

```bash
cd backend && pytest tests/ -v
```
Expected: All tests PASS

- [ ] **Step 8: Commit**

```bash
git add app/schemas/employer.py app/api/employer.py app/main.py tests/test_employer.py
git commit -m "feat: employer org registration, config, and worker list endpoints"
```

---

## Task 11: Alembic migrations + Dockerfile + Docker Compose

**Files:**
- Create: `backend/alembic.ini`
- Create: `backend/alembic/env.py`
- Create: `backend/Dockerfile`
- Create: `docker-compose.yml` (repo root)
- Create: `.env.example` (repo root)

- [ ] **Step 1: Initialize Alembic**

```bash
cd backend && alembic init alembic
```

- [ ] **Step 2: Update `backend/alembic/env.py`** to use app models

```python
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.database import Base
from app.models import user, employer, worker_profile, session, message, dialect  # noqa: F401
from app.config import settings

config = context.config
config.set_main_option("sqlalchemy.url", settings.database_url)

if config.config_file_name:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def run_migrations_offline():
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

- [ ] **Step 3: Generate initial migration**

```bash
cd backend && alembic revision --autogenerate -m "initial schema"
```
Expected: New file created in `alembic/versions/`

- [ ] **Step 4: Create `backend/Dockerfile`**

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

- [ ] **Step 5: Create `docker-compose.yml` at repo root**

```yaml
version: "3.9"

services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: vaakya
      POSTGRES_PASSWORD: vaakya
      POSTGRES_DB: vaakya
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U vaakya"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    env_file: .env
    environment:
      DATABASE_URL: postgresql://vaakya:vaakya@db:5432/vaakya
    depends_on:
      db:
        condition: service_healthy
    command: >
      sh -c "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    depends_on:
      - backend
    environment:
      VITE_API_URL: http://localhost:8000

volumes:
  pgdata:
```

- [ ] **Step 6: Create `.env.example` at repo root**

```env
SECRET_KEY=change-me-in-production
SARVAM_API_KEY=your-sarvam-api-key
SARVAM_MOCK=true
OTP_MOCK=true
```

- [ ] **Step 7: Commit**

```bash
cd /Users/nithingowda/vaakya
git add backend/alembic/ backend/alembic.ini backend/Dockerfile docker-compose.yml .env.example
git commit -m "feat: Alembic migrations, Dockerfile, Docker Compose"
```

---

## Task 12: GitHub Actions CI

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  backend-test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Install dependencies
        run: pip install -r requirements.txt

      - name: Run tests
        env:
          DATABASE_URL: sqlite:///./test.db
          SARVAM_MOCK: "true"
          OTP_MOCK: "true"
          SECRET_KEY: "ci-test-secret"
          SARVAM_API_KEY: ""
        run: pytest tests/ -v

  backend-docker:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build backend Docker image
        run: docker build ./backend -t vaakya-backend:ci
```

- [ ] **Step 2: Commit and push**

```bash
cd /Users/nithingowda/vaakya
git add .github/
git commit -m "ci: GitHub Actions backend test and Docker build"
git push origin main
```

- [ ] **Step 3: Verify CI passes on GitHub**

Open https://github.com/amateur-ai-dev/bembala-v2/actions and confirm both jobs pass.

---

## Final: Run full backend test suite

- [ ] **Step 1: Run all tests**

```bash
cd backend && SARVAM_MOCK=true OTP_MOCK=true SECRET_KEY=test DATABASE_URL=sqlite:///./test.db pytest tests/ -v
```
Expected: All tests PASS (12+ tests across auth, STT, TTS, chat, S2S, sessions, employer)

- [ ] **Step 2: Commit any final fixes**

```bash
git add -A && git commit -m "chore: ensure all backend tests pass"
git push origin main
```
