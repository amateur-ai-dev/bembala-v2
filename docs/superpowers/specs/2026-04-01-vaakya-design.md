# Vaakya — Design Spec
**Date:** 2026-04-01  
**Status:** Approved

---

## Overview

Vaakya is a two-sided voice+text assistant harness for blue-collar workers in quick-commerce and skilled-labour domains. It uses Sarvam AI's Indian-language model suite to deliver spoken-dialect-aware chat, speech-to-text, text-to-speech, and translation across 12 regional dialects in Karnataka, Andhra Pradesh, Telangana, and Tamil Nadu.

---

## Architecture

```
┌─────────────────────────────────────────────┐
│              Docker Compose                 │
│                                             │
│  ┌──────────────┐    ┌───────────────────┐  │
│  │  React/Vite  │    │   FastAPI (Python) │  │
│  │  Frontend    │───▶│   Vaakya API v1   │  │
│  │  :5173       │    │   :8000           │  │
│  └──────────────┘    └────────┬──────────┘  │
│                               │             │
│                      ┌────────▼──────────┐  │
│                      │   PostgreSQL      │  │
│                      │   :5432           │  │
│                      └───────────────────┘  │
└─────────────────────────────────────────────┘
                        │
                        ▼ (mocked locally, real via env var)
              Sarvam AI — api.sarvam.ai
              Saaras v3 · Bulbul v3 · Sarvam-M · Mayura v1
```

- Frontend communicates with backend via REST/JSON only — never calls Sarvam directly
- Mock layer sits in backend: `SARVAM_MOCK=true` routes all AI calls to local stubs
- Deployment: Docker Compose (local), single `docker compose up` to start

---

## Components

### Frontend (React + Vite)

**Worker App** — mobile-first, large touch targets, minimal English text
- Language picker (first launch) — sets UI language and default dialect
- Phone + OTP login
- Voice chat screen: hold-to-talk button, waveform visualizer, audio playback
- Text chat screen: keyboard input, persistent message history
- Translate screen: dialect pair selector + text input/output
- Settings: dialect selector, TTS playback speed

**Employer Dashboard** — desktop-first
- Team management: add/remove workers, assign dialect
- Domain config: system prompt editor (defines the assistant's knowledge domain)
- Per-worker chat history viewer
- Usage stats

### Backend (FastAPI + Python)

| Endpoint | Purpose |
|----------|---------|
| `POST /auth/request-otp` | Send OTP (mock: returns OTP in response body) |
| `POST /auth/verify-otp` | Verify OTP, return JWT |
| `POST /api/stt` | Audio → text via Saaras v3 |
| `POST /api/tts` | Text → audio via Bulbul v3 |
| `POST /api/chat` | Text → LLM reply via Sarvam-M (dialect system prompt injected) |
| `POST /api/translate` | Text → text via Mayura v1 |
| `POST /api/s2s` | Full pipeline: audio in → STT → LLM → TTS → audio out |
| `POST /api/sessions` | Create new chat session |
| `GET /api/sessions/{id}/messages` | Fetch message history for a session |
| `GET/POST /employer/workers` | List workers / add worker to org |
| `GET /employer/workers/{id}/sessions` | View worker's chat history |
| `PUT /employer/config` | Update org domain system prompt |

---

## Data Model

```sql
users
  id, phone, role (worker|employer), dialect_code, created_at

employers
  id, user_id (FK), org_name, system_prompt, created_at

worker_profiles
  id, user_id (FK), employer_id (FK), display_name, dialect_code

sessions
  id, user_id (FK), created_at, updated_at

messages
  id, session_id (FK), role (user|assistant),
  content_type (text|audio_b64), content, transcript, created_at

dialects
  code, language, state, display_name_local, display_name_en
```

---

## Dialect Registry (12 dialects)

| Code | Language | State | Local Name |
|------|----------|-------|------------|
| `kn-north` | Kannada | Karnataka | ಉತ್ತರ ಕರ್ನಾಟಕ |
| `kn-coastal` | Kannada | Karnataka | ಕರಾವಳಿ ಕನ್ನಡ |
| `kn-bengaluru` | Kannada | Karnataka | ಬೆಂಗಳೂರು ಕನ್ನಡ |
| `te-coastal-ap` | Telugu | Andhra Pradesh | కోస్తా ఆంధ్ర |
| `te-rayalaseema` | Telugu | Andhra Pradesh | రాయలసీమ |
| `te-north-ap` | Telugu | Andhra Pradesh | ఉత్తరాంధ్ర |
| `te-hyderabad` | Telugu | Telangana | హైదరాబాద్ |
| `te-north-tg` | Telugu | Telangana | ఉత్తర తెలంగాణ |
| `te-south-tg` | Telugu | Telangana | దక్షిణ తెలంగాణ |
| `ta-chennai` | Tamil | Tamil Nadu | சென்னை தமிழ் |
| `ta-west` | Tamil | Tamil Nadu | மேற்கு தமிழ் |
| `ta-south` | Tamil | Tamil Nadu | தென் தமிழ் |

---

## Dialect-Aware System Prompt

Every `/chat` and `/s2s` call constructs a system prompt from two parts:

1. **Employer domain prompt** — set by employer in dashboard (e.g. _"You are a quick-commerce assistant for delivery workers. Answer questions about shift timings, delivery zones, and escalation procedures."_)
2. **Dialect instruction** — auto-injected per worker dialect (e.g. _"Respond in spoken North Karnataka Kannada. Use colloquial ಉತ್ತರ ಕರ್ನಾಟಕ vocabulary, not formal Mysuru Kannada."_)

---

## Mock Layer

Activated by `SARVAM_MOCK=true` in `.env`. All AI calls return deterministic stubs:

| API | Mock response |
|-----|--------------|
| Saaras v3 STT | `"ನಮಸ್ಕಾರ, ನನಗೆ ಸಹಾಯ ಮಾಡಿ"` |
| Bulbul v3 TTS | Silent WAV as base64 string |
| Sarvam-M chat | `"[MOCK] ನಿಮ್ಮ ಪ್ರಶ್ನೆಗೆ ಉತ್ತರ ಇಲ್ಲಿದೆ"` |
| Mayura translate | Input echoed with `[MOCK translated]` prefix |

Set `SARVAM_API_KEY=<key>` and `SARVAM_MOCK=false` to go live — no code changes required.

---

## Authentication

- Worker login: phone number → OTP (mocked locally, real SMS service plugged in later)
- JWT issued on OTP verification, stored in browser localStorage
- Employer login: same flow, role determined by `users.role`

---

## CI/CD

GitHub Actions on push to `main`:
- `pytest` — backend unit tests (all run in mock mode, no API key needed)
- `vite build` — frontend build check
- Docker build validation
- CD: deploy on passing CI (local Docker Compose for now)

---

## Project Structure

```
vaakya/
├── backend/
│   ├── app/
│   │   ├── api/          # route handlers
│   │   ├── services/     # sarvam/ (real + mock), auth/
│   │   ├── models/       # SQLAlchemy models
│   │   └── main.py
│   ├── tests/
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── worker/       # Worker App screens
│   │   ├── employer/     # Employer Dashboard
│   │   ├── components/   # shared components
│   │   └── i18n/         # locale strings (kn, te, ta)
│   ├── Dockerfile
│   └── package.json
├── docs/
│   └── superpowers/specs/
├── docker-compose.yml
├── .env.example
└── .github/workflows/ci.yml
```

---

## Out of Scope (v1)

- Real SMS OTP provider
- Audio file storage (S3/GCS) — audio passed as base64 in-request for now
- Push notifications
- Employer analytics beyond basic usage counts
- Redis / job queuing for audio processing
