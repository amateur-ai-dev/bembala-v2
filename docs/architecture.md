# Vaakya — Architecture & Process Flow

> Complete technical reference for the system design, component interactions, and key request flows.
> Current as of April 2026 (commit 4842f93).

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Infrastructure Topology](#2-infrastructure-topology)
3. [Backend Architecture](#3-backend-architecture)
4. [Database Schema](#4-database-schema)
5. [Sarvam AI Integration Layer](#5-sarvam-ai-integration-layer)
6. [Frontend Architecture](#6-frontend-architecture)
7. [Dialect & Persona System](#7-dialect--persona-system)
8. [Process Flows](#8-process-flows)
   - [8.1 Auth — OTP Login](#81-auth--otp-login)
   - [8.2 Voice Chat (Speech-to-Speech)](#82-voice-chat-speech-to-speech)
   - [8.3 Text Chat](#83-text-chat)
   - [8.4 Translate](#84-translate)
   - [8.5 Employer Setup](#85-employer-setup)
9. [Security Model](#9-security-model)
10. [Training Data Pipeline](#10-training-data-pipeline)
11. [Configuration & Environment](#11-configuration--environment)
12. [Production Readiness Gaps](#12-production-readiness-gaps)

---

## 1. System Overview

Vaakya is a two-sided platform:

- **Workers** — blue-collar workers (delivery, warehouse, skilled trades) who speak Kannada, Telugu, or Tamil. They use voice or text to get help in their own dialect.
- **Employers** — companies (quick-commerce operators, contractors) who configure the AI's knowledge for their business and monitor worker conversations.

```
┌─────────────────────────────────────────────────────────────────┐
│                         VAAKYA SYSTEM                           │
│                                                                 │
│  ┌──────────────┐     ┌──────────────┐     ┌────────────────┐  │
│  │   WORKER     │     │   BACKEND    │     │   SARVAM AI    │  │
│  │  React SPA   │◄───►│   FastAPI    │◄───►│  (external)    │  │
│  │  (nginx:80)  │     │  (:8000)     │     │                │  │
│  └──────────────┘     └──────┬───────┘     │ • Saaras v3    │  │
│                              │             │ • Bulbul v3    │  │
│  ┌──────────────┐            │             │ • Sarvam-M     │  │
│  │   EMPLOYER   │            ▼             │ • Mayura v1    │  │
│  │  React SPA   │◄──►  ┌──────────┐        └────────────────┘  │
│  │  (same SPA)  │     │ Postgres │                             │
│  └──────────────┘     │  (:5432) │                             │
│                        └──────────┘                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Infrastructure Topology

Everything runs in Docker Compose. Four services:

```
docker-compose.yml
│
├── db (postgres:15-alpine)
│   ├── Port: 5432
│   ├── Credentials: vaakya/vaakya/vaakya
│   ├── Volume: pgdata (persistent)
│   └── Healthcheck: pg_isready -U vaakya
│
├── backend (./backend Dockerfile)
│   ├── Port: 8000
│   ├── Startup: alembic upgrade head → uvicorn app.main:app
│   ├── Depends on: db (healthy)
│   └── Env: .env + DATABASE_URL override
│
├── frontend (./frontend Dockerfile)
│   ├── Port: 80 (nginx) → exposed as 5173
│   ├── Serves: built React SPA
│   ├── Proxy: /api/* → http://backend:8000
│   └── Depends on: backend
│
└── pgadmin (dpage/pgadmin4)
    ├── Port: 5050
    └── Dev tool only — not used in production
```

**Request path (production-like):**
```
Browser → nginx:80 → static files (React SPA)
                   → /api/* proxy → backend:8000 → PostgreSQL:5432
                                                  → api.sarvam.ai (external)
```

**Startup sequence:**
```
1. db container starts → healthcheck passes
2. backend starts → runs: alembic upgrade head (applies DB migrations)
                        → uvicorn starts on :8000
3. frontend starts → nginx serves built SPA
```

---

## 3. Backend Architecture

```
backend/app/
├── main.py              # FastAPI app, router registration, CORS
├── config.py            # Settings (pydantic-settings, reads .env)
├── database.py          # SQLAlchemy engine + SessionLocal
├── deps.py              # FastAPI dependencies: get_db(), current_user()
│
├── api/                 # Route handlers (thin layer — no business logic)
│   ├── auth.py          # /auth/request-otp, /auth/verify-otp
│   ├── stt.py           # /api/stt
│   ├── tts.py           # /api/tts
│   ├── chat.py          # /api/chat
│   ├── translate.py     # /api/translate
│   ├── s2s.py           # /api/s2s (orchestrates STT→chat→TTS)
│   ├── sessions.py      # /api/sessions, /api/sessions/{id}/messages
│   └── employer.py      # /employer/register, /employer/config, /employer/workers
│
├── models/              # SQLAlchemy ORM models (one file per table)
│   ├── user.py
│   ├── session.py
│   ├── message.py
│   ├── employer.py
│   ├── worker_profile.py
│   └── dialect.py
│
├── schemas/             # Pydantic request/response models
│   ├── auth.py
│   ├── voice.py         # STTRequest/Response, TTSRequest/Response, S2SRequest/Response
│   ├── chat.py
│   ├── translate.py
│   ├── session.py
│   └── employer.py
│
└── services/
    ├── auth_service.py          # OTP generate/verify, JWT create/decode
    ├── dialect_service.py       # Build system prompt from dialect_code
    ├── persona/
    │   └── personas.py          # 9 persona definitions → colloquial system prompts
    └── sarvam/
        ├── factory.py           # Returns MockSarvamClient or SarvamClient
        ├── mock.py              # Deterministic mock responses (no API key needed)
        └── client.py            # Real HTTP calls to api.sarvam.ai
```

### API surface

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Liveness check |
| POST | `/auth/request-otp` | No | Generate + (mock) send OTP |
| POST | `/auth/verify-otp` | No | Verify OTP → return JWT |
| POST | `/api/stt` | JWT | Audio → transcript |
| POST | `/api/tts` | JWT | Text → audio |
| POST | `/api/chat` | JWT | Chat message → AI response |
| POST | `/api/translate` | JWT | Translate text |
| POST | `/api/s2s` | JWT | Voice in → voice out (full pipeline) |
| POST | `/api/sessions` | JWT | Create chat session |
| GET | `/api/sessions/{id}/messages` | JWT | Get session history |
| POST | `/employer/register` | JWT | Register org + system prompt |
| PUT | `/employer/config` | JWT | Update system prompt |
| GET | `/employer/workers` | JWT | List workers in org |

---

## 4. Database Schema

```
┌─────────────────────────────────────────────────────────────────────┐
│                         POSTGRESQL SCHEMA                           │
│                                                                     │
│  ┌──────────────────┐          ┌──────────────────────────┐        │
│  │      users       │          │         employers        │        │
│  ├──────────────────┤          ├──────────────────────────┤        │
│  │ id (PK)          │◄─────┐   │ id (PK)                  │        │
│  │ phone (unique)   │      │   │ user_id (FK → users.id)  │        │
│  │ role (enum)      │      │   │ org_name                 │        │
│  │   worker         │      │   │ system_prompt (Text)     │        │
│  │   employer       │      │   │ created_at               │        │
│  │ dialect_code     │      │   └──────────────┬───────────┘        │
│  │ created_at       │      │                  │                    │
│  └────────┬─────────┘      │                  │                    │
│           │                │   ┌──────────────▼───────────┐        │
│           │                │   │      worker_profiles     │        │
│           │                │   ├──────────────────────────┤        │
│           │                │   │ id (PK)                  │        │
│           │                └───┤ user_id (FK → users.id)  │        │
│           │                    │ employer_id (FK)          │        │
│           │                    │ display_name              │        │
│           │                    │ dialect_code              │        │
│           │                    └──────────────────────────┘        │
│           │                                                         │
│           ▼                                                         │
│  ┌──────────────────┐                                               │
│  │     sessions     │                                               │
│  ├──────────────────┤                                               │
│  │ id (PK)          │                                               │
│  │ user_id (FK)     │                                               │
│  │ created_at       │                                               │
│  │ updated_at       │                                               │
│  └────────┬─────────┘                                               │
│           │                                                         │
│           ▼                                                         │
│  ┌──────────────────────────────────────────┐                      │
│  │                messages                  │                      │
│  ├──────────────────────────────────────────┤                      │
│  │ id (PK)                                  │                      │
│  │ session_id (FK → sessions.id)            │                      │
│  │ role (enum: user | assistant)            │                      │
│  │ content_type (enum: text | audio_b64)    │                      │
│  │ content (Text)  — raw audio or text      │                      │
│  │ transcript (Text, nullable)              │                      │
│  │ approved_for_training (bool, default F)  │                      │
│  │ created_at                               │                      │
│  └──────────────────────────────────────────┘                      │
│                                                                     │
│  ┌──────────────────┐                                               │
│  │     dialects     │  (reference table, seeded)                   │
│  ├──────────────────┤                                               │
│  │ id (PK)          │                                               │
│  │ code (unique)    │  e.g. "kn-bengaluru"                         │
│  │ language         │  e.g. "kn"                                   │
│  │ region           │  e.g. "Bengaluru"                            │
│  └──────────────────┘                                               │
└─────────────────────────────────────────────────────────────────────┘
```

### Key relationships

- One `user` → many `sessions`
- One `session` → many `messages`
- One `user` (role=employer) → one `employer`
- One `user` (role=worker) → one `worker_profile` → linked to one `employer`
- `messages.approved_for_training` — flag for selecting conversations for fine-tuning

---

## 5. Sarvam AI Integration Layer

```
backend/app/services/sarvam/

factory.py
  └── get_sarvam_client()
        ├── if SARVAM_MOCK=true  → MockSarvamClient()
        └── if SARVAM_MOCK=false → SarvamClient()

MockSarvamClient (mock.py)
  ├── speech_to_text()  → fixed transcript per language (kn/te/ta)
  ├── text_to_speech()  → 44-byte silent WAV (valid format, no audio)
  ├── chat()            → hardcoded "[MOCK] ..." response
  └── translate()       → "[MOCK translated] " + original text

SarvamClient (client.py)
  ├── speech_to_text()  → POST api.sarvam.ai/speech-to-text
  │                          model: saaras:v3
  │                          returns: { transcript, language }
  ├── text_to_speech()  → POST api.sarvam.ai/text-to-speech
  │                          model: bulbul:v3
  │                          returns: { audio_b64 (WAV), format: "wav" }
  ├── chat()            → POST api.sarvam.ai/chat/completions
  │                          model: sarvam-m
  │                          returns: { content, finish_reason }
  └── translate()       → POST api.sarvam.ai/translate
                             model: mayura:v1
                             returns: { translated_text }
```

**Auth header:** `API-Subscription-Key: <SARVAM_API_KEY>`

**Switching to real API:**
```
SARVAM_MOCK=false
SARVAM_API_KEY=<key from dashboard.sarvam.ai>
```
No code changes required — the factory handles the swap.

---

## 6. Frontend Architecture

```
frontend/src/

App.tsx              # Dark mode watcher (prefers-color-scheme → .dark on <html>)
router.tsx           # React Router — all routes defined here
index.css            # CSS variables (--bg, --surface, --border, --brand, etc.)

store/
  auth.ts            # Zustand + persist: { token, role, phone }
  dialect.ts         # Zustand + persist: { dialectCode, language, ttsSpeed }

api/
  client.ts          # Axios instance (baseURL=VITE_API_URL, JWT interceptor)
                     # Exports: requestOtp, verifyOtp, speechToSpeech,
                     #          sendChat, translateText, createSession,
                     #          getMessages, registerOrg, updateDomainConfig,
                     #          listWorkers

i18n/
  index.ts           # i18next setup, loads kn/te/ta JSON
  kn.json            # Colloquial Kannada UI strings
  te.json            # Colloquial Telugu UI strings
  ta.json            # Colloquial Tamil UI strings

utils/
  transliterate.ts   # Roman → native script engine (kn/te/ta)
                     # langFromDialect(dialectCode) → "kn"|"te"|"ta"
                     # transliterate(text, lang) → native script

components/
  ProtectedRoute.tsx # Guards: checks token + role, redirects if unauthorized
  HoldToTalk.tsx     # MediaRecorder → WebM base64 → onAudioReady callback
  ChatBubble.tsx     # Message bubble: transcript (top) + AudioPlayer (bottom)
  AudioPlayer.tsx    # Play button: data:audio/<format>;base64,<b64>

worker/
  LanguagePicker.tsx # Sets vaakya_lang in localStorage, dialect in store
  LoginScreen.tsx    # Phone + OTP flow, guards: redirects to / if no lang
  WorkerLayout.tsx   # Bottom nav shell (Voice | Chat | Translate | Settings)
  VoiceChat.tsx      # S2S: HoldToTalk → API → auto-play + bubble
  TextChat.tsx       # sendChat: text input + transliteration toggle
  TranslateScreen.tsx# translateText: card language selectors + swap
  Settings.tsx       # Dialect grid, TTS speed slider, logout

employer/
  EmployerLogin.tsx  # 3-step: phone → OTP → org name
  EmployerLayout.tsx # Sidebar nav shell
  Dashboard.tsx      # Stat cards + recent worker list
  WorkerList.tsx     # Searchable worker cards
  WorkerHistory.tsx  # getMessages for a worker session
  DomainConfig.tsx   # updateDomainConfig: system prompt editor
```

### State management

```
┌─────────────────┐    ┌─────────────────────────────────────┐
│   authStore     │    │            dialectStore              │
│  (persisted)    │    │           (persisted)                │
├─────────────────┤    ├─────────────────────────────────────┤
│ token: string   │    │ dialectCode: string  e.g. kn-bengaluru│
│ role: worker    │    │ language: string     e.g. "kn"        │
│       employer  │    │ ttsSpeed: number     0.5–2.0          │
│ phone: string   │    └─────────────────────────────────────┘
│ login()         │
│ logout()        │
└─────────────────┘
Both stored in localStorage via Zustand persist middleware
```

### Routing

```
/                           → LanguagePicker (no auth required)
/worker/login               → LoginScreen (no auth, but needs vaakya_lang)
/worker/*                   → ProtectedRoute(role=worker) → WorkerLayout
  /worker/voice             → VoiceChat
  /worker/chat              → TextChat
  /worker/translate         → TranslateScreen
  /worker/settings          → Settings
/employer/login             → EmployerLogin (no auth)
/employer/*                 → ProtectedRoute(role=employer) → EmployerLayout
  /employer                 → Dashboard
  /employer/workers         → WorkerList
  /employer/workers/:id/history → WorkerHistory
  /employer/config          → DomainConfig
```

---

## 7. Dialect & Persona System

### Dialect codes

```
kn-bengaluru     Kannada — Bengaluru city
kn-north         Kannada — North Karnataka (Hubli, Dharwad)
kn-coastal       Kannada — Coastal (Mangaluru, Udupi)
te-hyderabad     Telugu — Hyderabad / Telangana metro
te-south-tg      Telugu — South Telangana
te-north-tg      Telugu — North Telangana
te-coastal-ap    Telugu — Coastal Andhra Pradesh
te-rayalaseema   Telugu — Rayalaseema
te-north-ap      Telugu — North Andhra Pradesh
ta-chennai       Tamil — Chennai / Madras bashai
ta-west          Tamil — Coimbatore / Kongu
ta-south         Tamil — Madurai / South Tamil Nadu
```

### Persona → system prompt pipeline

```
User makes a request with dialect_code
         │
         ▼
dialect_service.py: build_system_prompt(domain_prompt, dialect_code)
         │
         ├── personas.py: get_persona(dialect_code)
         │         └── Returns persona dict:
         │               {
         │                 name: "Raju",
         │                 region: "Hubli",
         │                 style: "Uses bhava, guru, Hindi mix...",
         │                 example_phrases: [...],
         │                 address_terms: [...]
         │               }
         │
         └── Combines:
               [PERSONA INSTRUCTIONS]
               Name: Raju. Speak like a North Karnataka person...
               
               [DOMAIN CONTEXT]
               <employer's system_prompt or default>
               
               → final system_prompt sent to Sarvam-M chat
```

### Persona map

| Code | Persona | Region | Style markers |
|------|---------|--------|---------------|
| `kn-bengaluru` | Priya | Bengaluru | Modern slang, English mix, ಅಲ್ವಾ |
| `kn-north` | Raju | Hubli | bhava, guru, Hindi words, ಅಲ್ಲೇನ |
| `kn-coastal` | Suresh | Mangaluru | Tulu influence, ಆ ಮಾರಾಯ |
| `te-hyderabad` | Ravi | Hyderabad | bro, maccha, Urdu mix, ఏంటి |
| `te-south-tg` | Srinivas | South Telangana | ఏమైందిరా, rural cadence |
| `te-north-tg` | Ramesh | North Telangana | Heavy Telangana slant |
| `te-coastal-ap` | Krishna | Coastal AP | Formal Telugu base, softened |
| `te-rayalaseema` | Venkataramaiah | Rayalaseema | Distinct vocabulary, పోవాలె |
| `ta-chennai` | Murugan | Chennai | machan, da, Madras bashai |
| `ta-west` | Selvam | Coimbatore | Kongu dialect, mild cadence |
| `ta-south` | Pandian | Madurai | Strong Madurai slant, direct tone |

---

## 8. Process Flows

### 8.1 Auth — OTP Login

```
WORKER                     FRONTEND                    BACKEND                  DB
  │                            │                           │                    │
  │── enters phone ──────────► │                           │                    │
  │                            │── POST /auth/request-otp ►│                    │
  │                            │   { phone }               │                    │
  │                            │                           │── generate OTP ──► │
  │                            │                           │   store in memory  │
  │                            │                           │   (phone → OTP)    │
  │                            │                           │                    │
  │                            │                  OTP_MOCK=true:                │
  │                            │                  skip SMS, log to console      │
  │                            │                  OTP_MOCK=false:               │
  │                            │                  send via SMS provider         │
  │                            │◄─ 200 OK ─────────────── │                    │
  │                            │                           │                    │
  │── enters OTP (000000) ───► │                           │                    │
  │                            │── POST /auth/verify-otp ──►                    │
  │                            │   { phone, otp, role }    │                    │
  │                            │                           │── lookup user ────►│
  │                            │                           │◄─ found/not found  │
  │                            │                           │                    │
  │                            │                           │── upsert user ────►│
  │                            │                           │   (create if new)  │
  │                            │                           │                    │
  │                            │                           │── create JWT ──────│
  │                            │                           │   { sub: user_id,  │
  │                            │                           │     role, phone }  │
  │                            │◄─ 200 { access_token } ── │                    │
  │                            │                           │                    │
  │                            │ store token in Zustand    │                    │
  │                            │ + localStorage            │                    │
  │◄── navigate /worker/voice  │                           │                    │
```

**JWT structure:**
- Payload: `{ sub: user_id, role: "worker"|"employer", phone }`
- Expiry: 7 days (`access_token_expire_minutes = 60 * 24 * 7`)
- Algorithm: HS256, signed with `SECRET_KEY`

**Auth middleware (deps.py):**
Every protected endpoint declares `user = Depends(current_user)`.
`current_user()` extracts `Authorization: Bearer <token>`, calls `decode_token()`, returns payload dict or raises 401.

---

### 8.2 Voice Chat (Speech-to-Speech)

This is the core flow. One API call orchestrates four AI operations.

```
WORKER              FRONTEND                   BACKEND                SARVAM AI
  │                    │                           │                      │
  │ holds mic ───────► │                           │                      │
  │                    │ MediaRecorder starts       │                      │
  │                    │ format: audio/webm         │                      │
  │                    │                           │                      │
  │ releases mic ────► │                           │                      │
  │                    │ MediaRecorder.stop()       │                      │
  │                    │ → Blob → FileReader        │                      │
  │                    │ → base64 WebM string       │                      │
  │                    │                           │                      │
  │                    │── POST /api/s2s ──────────►│                      │
  │                    │   {                        │                      │
  │                    │    audio_b64: <webm_b64>,  │                      │
  │                    │    dialect_code,           │                      │
  │                    │    language,               │                      │
  │                    │    session_id              │                      │
  │                    │   }                        │                      │
  │                    │   Authorization: Bearer    │                      │
  │                    │                           │                      │
  │                    │                           │── [1] STT ──────────►│
  │                    │                           │   Saaras v3          │
  │                    │                           │   audio_b64 + lang   │
  │                    │                           │◄─ transcript ────────│
  │                    │                           │                      │
  │                    │                           │── build_system_prompt│
  │                    │                           │   dialect_service    │
  │                    │                           │   → persona + domain │
  │                    │                           │                      │
  │                    │                           │── [2] Chat ─────────►│
  │                    │                           │   Sarvam-M           │
  │                    │                           │   system_prompt      │
  │                    │                           │   + transcript msg   │
  │                    │                           │◄─ reply_text ────────│
  │                    │                           │                      │
  │                    │                           │── [3] TTS ──────────►│
  │                    │                           │   Bulbul v3          │
  │                    │                           │   reply_text + lang  │
  │                    │                           │◄─ audio_b64 (WAV) ───│
  │                    │                           │                      │
  │                    │                           │── [4] Save to DB ────│
  │                    │                           │   Message(user):     │
  │                    │                           │     content=webm_b64 │
  │                    │                           │     transcript=...   │
  │                    │                           │   Message(assistant):│
  │                    │                           │     content=wav_b64  │
  │                    │                           │     transcript=reply │
  │                    │                           │                      │
  │                    │◄─ 200 {                  ─│                      │
  │                    │    audio_b64: <wav_b64>,   │                      │
  │                    │    transcript,             │                      │
  │                    │    reply_text,             │                      │
  │                    │    format: "wav"           │                      │
  │                    │   }                        │                      │
  │                    │                           │                      │
  │                    │ responseAudioRef.play()    │                      │
  │◄─ hears response   │ (auto-play, no click needed)                     │
  │                    │                           │                      │
  │                    │ setMessages([             │                      │
  │                    │   user bubble:            │                      │
  │                    │     transcript (top)      │                      │
  │                    │     [Play again] (webm)   │                      │
  │                    │   assistant bubble:       │                      │
  │                    │     reply_text (top)      │                      │
  │                    │     [Play again] (wav)    │                      │
  │                    │ ])                        │                      │
```

---

### 8.3 Text Chat

```
WORKER           FRONTEND                        BACKEND          SARVAM AI
  │                 │                                │                 │
  │ types text ───► │                                │                 │
  │                 │ transliterate(input, lang)     │                 │
  │                 │ "namaskara" → "ನಮಸ್ಕಾರ"        │                 │
  │                 │ (if translitOn=true)           │                 │
  │                 │                                │                 │
  │ sends ────────► │── POST /api/chat ─────────────►│                 │
  │                 │   {                            │                 │
  │                 │    messages: [history array],  │                 │
  │                 │    dialect_code,               │                 │
  │                 │    domain_prompt               │                 │
  │                 │   }                            │                 │
  │                 │                                │── Chat ────────►│
  │                 │                                │   Sarvam-M      │
  │                 │                                │   full history  │
  │                 │                                │◄─ response ─────│
  │                 │◄─ 200 { content }              │                 │
  │◄─ sees reply    │                                │                 │
```

Note: Text chat does **not** save to DB (no session_id passed). Only S2S saves messages.

---

### 8.4 Translate

```
WORKER         FRONTEND                    BACKEND           SARVAM AI
  │               │                           │                  │
  │ picks langs ► │                           │                  │
  │ types text ─► │                           │                  │
  │               │── POST /api/translate ───►│                  │
  │               │   {                       │                  │
  │               │    text,                  │                  │
  │               │    source_lang,           │                  │
  │               │    target_lang            │                  │
  │               │   }                       │                  │
  │               │                           │── Translate ────►│
  │               │                           │   Mayura v1      │
  │               │                           │◄─ translated ────│
  │               │◄─ 200 { translated_text } │                  │
  │◄─ sees result │                           │                  │
```

---

### 8.5 Employer Setup

```
EMPLOYER              FRONTEND                   BACKEND                DB
  │                      │                          │                   │
  │ phone + OTP ────────►│                          │                   │
  │                      │── POST /auth/verify-otp ►│                   │
  │                      │   role: "employer"        │── upsert user ──►│
  │                      │◄─ JWT ─────────────────  │                   │
  │                      │                          │                   │
  │ enters org name ────►│                          │                   │
  │                      │── POST /employer/register►│                  │
  │                      │   { org_name,            │── insert ────────►│
  │                      │     system_prompt }       │  employers row    │
  │                      │◄─ 200 OK ─────────────── │                   │
  │◄─ dashboard          │                          │                   │
  │                      │                          │                   │
  │ edits config ───────►│                          │                   │
  │                      │── PUT /employer/config ──►│                  │
  │                      │   { system_prompt }       │── update ────────►│
  │                      │◄─ 200 OK                 │   employers.system│
  │                      │                          │   _prompt         │
```

**How employer config affects worker conversations:**

```
Worker sends audio
       │
       ▼
s2s.py looks up worker's user record
       │
       ▼
Checks worker_profiles → finds employer_id
       │
       ▼
Loads employer.system_prompt
       │
       ▼
dialect_service.build_system_prompt(
    domain_prompt = employer.system_prompt,
    dialect_code  = worker's dialect
)
       │
       ▼
Injects into Sarvam-M chat call
```

---

## 9. Security Model

```
┌──────────────────────────────────────────────────────────────┐
│                      SECURITY LAYERS                         │
│                                                              │
│  1. AUTHENTICATION                                           │
│     Phone + OTP → JWT (HS256, 7-day expiry)                  │
│     Every /api/* and /employer/* route requires valid JWT    │
│                                                              │
│  2. AUTHORISATION                                            │
│     JWT payload contains role (worker | employer)            │
│     Employer endpoints check role in token                   │
│     S2S endpoint verifies session.user_id == token.sub       │
│                                                              │
│  3. SESSION ISOLATION                                        │
│     Workers can only read/write their own sessions           │
│     Employers can only read workers in their org             │
│     s2s.py: if session.user_id != user["sub"] → 403         │
│                                                              │
│  4. SECRETS                                                  │
│     SECRET_KEY — JWT signing key (in .env, gitignored)       │
│     SARVAM_API_KEY — AI API key (in .env, gitignored)        │
│     Hardcoded dev secret: "dev-secret-key" (change for prod) │
│                                                              │
│  5. CURRENT GAPS (fix before production)                     │
│     - JWT stored in localStorage (vulnerable to XSS)         │
│       → should be httpOnly cookie                            │
│     - No rate limiting on /auth/request-otp                  │
│       → OTP spam possible                                    │
│     - FastAPI /docs exposed in all environments              │
│       → disable in production                                │
│     - OTPs in memory dict wiped on restart                   │
│       → move to Redis for resilience                         │
└──────────────────────────────────────────────────────────────┘
```

---

## 10. Training Data Pipeline

```
                    TRAINING DATA ARCHITECTURE
                    
Sources
  │
  ├── Synthetic (human-written)
  │   training_data/
  │   ├── kn/conversations.jsonl   (~40 conversations)
  │   ├── te/conversations.jsonl   (~40 conversations)
  │   └── ta/conversations.jsonl   (~40 conversations)
  │   
  │   Topics: shift timing, salary, GPS issues, customer calls,
  │           leave requests, escalation, equipment problems
  │
  └── Real spoken language (YouTube pipeline)
      training_data/channels.json
              │
              ▼
      fetch_yt_transcripts.py
              │
              ├── yt-dlp → downloads audio as .mp3
              │   (resolves channel via uploads_playlist | url | search_query)
              │
              ├── Whisper (medium model, CPU)
              │   → raw transcript text
              │   → saved: raw_transcripts/<lang>/<video_id>.txt
              │   (resume-safe: skips if file exists)
              │
              └── pairs generator
                  → splits transcript into question/answer pairs
                  → saved: training_data/<lang>/yt_scraped.jsonl
      
      Current status:
        te — DONE: 29 transcripts, 1063 pairs
        kn — NOT STARTED
        ta — NOT STARTED

JSONL format (both sources):
  { "messages": [
      { "role": "user",      "content": "ನಾಳೆ ಶಿಫ್ಟ್ ಇದ್ಯಾ?" },
      { "role": "assistant", "content": "ಹೌದು ಭಾವ, ಬೆಳಿಗ್ಗೆ 8 ಗಂಟೆಗೆ..." }
  ]}

Live conversation export (export_training_pairs.py):
  Queries messages WHERE approved_for_training = true
  → exports to training_data/<lang>/live_pairs.jsonl
  → can be merged with synthetic + YouTube data for fine-tuning
```

---

## 11. Configuration & Environment

```
.env (gitignored)
├── SECRET_KEY              JWT signing key
│                           dev: "change-me-in-production"
│                           prod: random 32+ char string
│
├── SARVAM_API_KEY          API key from dashboard.sarvam.ai
│                           dev: "" (empty, mock used)
│                           prod: required
│
├── SARVAM_MOCK             true | false
│                           dev: true (use MockSarvamClient)
│                           prod: false (use SarvamClient)
│
├── OTP_MOCK                true | false
│                           dev: true (any phone + "000000" works)
│                           prod: false (requires SMS provider)
│
└── DATABASE_URL            postgresql://vaakya:vaakya@db:5432/vaakya
                            (db = Docker service name, resolves internally)

backend/app/config.py
└── Settings (pydantic-settings)
    Reads all above from environment / .env
    Exposes as settings.sarvam_mock, settings.otp_mock, etc.
```

---

## 12. Production Readiness Gaps

| Gap | Effort | Issue |
|-----|--------|-------|
| Sarvam API key | Low — config only | [#1](https://github.com/amateur-ai-dev/bembala-v2/issues/1) |
| SMS OTP integration | Medium — ~50 lines | [#2](https://github.com/amateur-ai-dev/bembala-v2/issues/2) |
| Training data KN + TA | Medium — run pipeline | [#3](https://github.com/amateur-ai-dev/bembala-v2/issues/3) |
| Security hardening | Medium — several items | [#4](https://github.com/amateur-ai-dev/bembala-v2/issues/4) |
| JWT → httpOnly cookie | Medium — auth refactor | #4 |
| OTP storage → Redis | Medium — new service | #4 |
| Rate limiting on OTP | Low — FastAPI middleware | #4 |
| HTTPS / reverse proxy | Low — Caddy config | #4 |
| Managed PostgreSQL | Low — connection string | — |
| Disable /docs in prod | Low — one line | #4 |

**Minimum to go live:** Issues #1 (Sarvam key) + #2 (SMS OTP) only.
Everything else is security hardening or scale preparation.
