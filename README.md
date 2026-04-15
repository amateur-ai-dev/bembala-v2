# Vaakya

Voice and text assistant for blue-collar workers in quick-commerce and skilled labour, using Indian regional languages.

Workers speak to the app in their dialect — Kannada, Telugu, or Tamil — and get responses in the same dialect and style. No English required.

**Repo:** `amateur-ai-dev/bembala-v2`  
**Stack:** FastAPI · PostgreSQL · React + TypeScript · Docker  
**AI:** Sarvam AI (Saaras v3 STT · Bulbul v3 TTS · Sarvam-M chat · Mayura v1 translate)

---

## Quick Start

```bash
git clone https://github.com/amateur-ai-dev/bembala-v2
cd bembala-v2

# Create .env (copy below, edit as needed)
cat > .env <<EOF
SECRET_KEY=change-me-in-production
SARVAM_API_KEY=
SARVAM_MOCK=true
OTP_MOCK=true
DATABASE_URL=postgresql://vaakya:vaakya@db:5432/vaakya
EOF

docker compose up -d --build

# Verify
curl http://localhost:8000/health   # → {"status":"ok"}
open http://localhost:80            # worker app
```

**Dev login:** any phone number + OTP `000000`

---

## What's Built

### Worker App
| Screen | Description |
|--------|-------------|
| Language picker | Choose Kannada / Telugu / Tamil + dialect |
| Login | Phone + OTP (mocked in dev) |
| Voice chat | Hold mic to speak, auto-plays AI response, transcript shown |
| Text chat | Type in Roman letters → converted to native script (transliteration) |
| Translate | Translate between KN / TE / TA / English |
| Settings | Change dialect, TTS speed, logout |

### Employer Dashboard
| Screen | Description |
|--------|-------------|
| Login | Phone + OTP + org name setup |
| Dashboard | Worker count, language stats, recent activity |
| Workers | Searchable list with dialect badges |
| Worker history | Full conversation history per worker |
| Domain config | Set the AI's system prompt for your business |

### Backend API
`GET /health` · Auth (OTP+JWT) · STT · TTS · Chat · Translate · S2S · Sessions · Employer

All AI calls go through a factory (`SARVAM_MOCK=true` → mock client, `false` → real Sarvam API).

---

## Supported Dialects

| Language | Dialects |
|----------|----------|
| Kannada | Bengaluru · North Karnataka · Coastal |
| Telugu | Hyderabad · Rayalaseema · Coastal AP · North AP · North Telangana · South Telangana |
| Tamil | Chennai · Western · Southern |

Each dialect maps to a persona with a name, speaking style, filler words, and regional vocabulary.

---

## Design System

- **Accent:** Forest green `#16a34a`
- **Theme:** Light / dark — auto-switches with system preference
- **Font:** Inter
- **i18n:** Colloquial strings — `ಒತ್ಕೊಂಡ್ ಮಾತಾಡು` / `నొక్కి పట్టుకో` / `புடிச்சு பேசு`

---

## Going to Production

Two things to wire up:

**1. Sarvam AI**
```
# .env
SARVAM_API_KEY=<key from dashboard.sarvam.ai>
SARVAM_MOCK=false
```

**2. SMS OTP**
- Add `send_otp_sms()` in `backend/app/services/auth_service.py`
- Call it in `backend/app/api/auth.py` when `OTP_MOCK=false`
- Add provider key (MSG91 / Twilio / AWS SNS) to `.env` and `backend/app/config.py`

---

## Project Structure

```
vaakya/
├── backend/
│   ├── app/
│   │   ├── api/          # Route handlers (auth, stt, tts, chat, s2s, sessions, employer)
│   │   ├── models/       # SQLAlchemy ORM models
│   │   ├── schemas/      # Pydantic request/response models
│   │   ├── services/
│   │   │   ├── sarvam/   # mock.py · client.py · factory.py
│   │   │   ├── persona/  # 9 dialect personas
│   │   │   └── dialect_service.py
│   │   └── config.py
│   └── tests/            # 30 tests
├── frontend/
│   └── src/
│       ├── worker/       # LanguagePicker · LoginScreen · VoiceChat · TextChat · TranslateScreen · Settings
│       ├── employer/     # EmployerLogin · Dashboard · WorkerList · WorkerHistory · DomainConfig
│       ├── components/   # ChatBubble · HoldToTalk · AudioPlayer
│       ├── store/        # auth.ts · dialect.ts (Zustand)
│       ├── i18n/         # kn.json · te.json · ta.json (colloquial)
│       └── utils/        # transliterate.ts
├── training_data/
│   ├── kn/ · te/ · ta/   # JSONL training pairs
│   ├── channels.json     # 13 YouTube channels for scraping
│   ├── fetch_yt_transcripts.py
│   └── export_training_pairs.py
├── personas/
│   └── persona_definitions.json
├── docs/
│   ├── build-guide.md
│   ├── challenges.md
│   └── superpowers/
└── docker-compose.yml
```

---

## Key Commands

```bash
# Start all services
docker compose up -d --build

# Backend logs
docker compose logs -f backend

# Run tests
docker compose exec backend pytest

# Training data — Telugu (resume-safe)
cd /Users/nithingowda/vaakya
python3 training_data/fetch_yt_transcripts.py --channels training_data/channels.json --lang te --max-per-channel 10
# repeat for --lang kn and --lang ta
```

---

## Status

| Area | Status |
|------|--------|
| Backend API | Done · 30 tests passing |
| Frontend (worker) | Done · redesigned April 2026 |
| Frontend (employer) | Done · redesigned April 2026 |
| Sarvam AI (mock) | Done |
| Sarvam AI (real) | Needs API key |
| SMS OTP | Needs provider integration |
| Training data — Telugu | Done (29 YT transcripts, 1063 pairs) |
| Training data — Kannada | Not started |
| Training data — Tamil | Not started |

---

## Docs

- [`docs/build-guide.md`](docs/build-guide.md) — full plain-language build walkthrough
- [`docs/challenges.md`](docs/challenges.md) — every bug hit and how it was fixed
- [`docs/superpowers/specs/2026-04-03-production-integration-hld.md`](docs/superpowers/specs/2026-04-03-production-integration-hld.md) — production architecture
