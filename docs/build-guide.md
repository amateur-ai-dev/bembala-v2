# Vaakya — Build Guide

> A plain-language guide for anyone who wants to understand, rebuild, or extend this app.
> Written after the full build. No assumed knowledge.

---

## What Is Vaakya?

Vaakya is a voice and text assistant built for blue-collar workers — delivery riders, construction workers, factory staff — who speak regional Indian languages. It lets them talk or type in their native language (Kannada, Telugu, Tamil) and get helpful responses in the same language and dialect.

There are two sides to the app:
- **Worker side** — voice chat, text chat, language translation
- **Employer side** — dashboard to manage workers, view sessions

---

## How the App Is Structured

```
vaakya/
├── backend/        → Python API server (handles all logic)
├── frontend/       → React web app (what users see)
├── training_data/  → Conversation data for future AI training
├── personas/       → Personality definitions for each dialect
├── docs/           → This documentation
└── docker-compose.yml → Runs everything together
```

The app runs as 3 separate services, all managed by Docker:

| Service  | What it does               | Port |
|----------|----------------------------|------|
| db       | Stores all data (PostgreSQL)| 5432 |
| backend  | Python API server (FastAPI) | 8000 |
| frontend | Web app served by nginx     | 5173 |

---

## Step-by-Step: What Was Built

### Step 1 — Project Setup
- Created the folder structure
- Set up Docker Compose to run all 3 services together
- Created a `.env` file for secrets (API keys, database URL)
- Set up GitHub repo at `amateur-ai-dev/bembala-v2`

### Step 2 — Database
- Used PostgreSQL as the database
- Used SQLAlchemy to define 6 tables: users, sessions, messages, employers, workers, dialects
- Used Alembic to manage database migrations (safe way to change DB structure over time)

### Step 3 — Backend API
Built with FastAPI (Python). Endpoints cover:
- **Auth** — send OTP, verify OTP, get JWT token
- **STT** (Speech to Text) — send audio, get text back
- **TTS** (Text to Speech) — send text, get audio back
- **Chat** — send message, get AI response
- **Translate** — send text in one language, get it back in another
- **S2S** (Speech to Speech) — full voice conversation pipeline
- **Sessions** — save and retrieve conversation history
- **Employer** — manage workers, view dashboards

### Step 4 — Sarvam AI Integration
Vaakya uses Sarvam AI for all its AI features. Four models are used:

| Model      | What it does                        |
|------------|-------------------------------------|
| Saaras v3  | Converts spoken audio → text (STT)  |
| Bulbul v3  | Converts text → spoken audio (TTS)  |
| Sarvam-M   | Chat AI that understands Indian languages |
| Mayura v1  | Translates between languages        |

A **mock layer** was built so the app works without a real API key during development. Set `SARVAM_MOCK=true` in `.env` to use fake responses.

### Step 5 — Frontend (v1)
Built with React + TypeScript. Screens:
1. Language picker (always shown first)
2. Phone number login
3. OTP verification
4. Voice chat screen
5. Text chat screen
6. Translation screen
7. Settings
8. Employer dashboard

State is managed with Zustand (simple global store). Language strings are in `frontend/src/i18n/` for kn/te/ta.

### Step 11 — Frontend Redesign (v2, April 2026)
Full visual redesign. No backend changes.

**Design system:**
- Forest green accent (`#16a34a`) replacing indigo
- CSS variable–based theming: `--bg`, `--surface`, `--border`, `--text`, `--brand`
- Light/dark mode via Tailwind `darkMode: 'class'` + system `prefers-color-scheme` auto-switch in `App.tsx`
- Inter font, `rounded-2xl` base shape, `msg-in` slide-up animation on messages

**Worker app changes:**
- Language picker: script name + romanized label + region, chevron navigation cards
- Login: full-width `+91` phone input, 6-box OTP display (visual only, single hidden input)
- WorkerLayout: SVG icon bottom nav (replaced emojis), green active state
- VoiceChat: hero mic centered at bottom, chat thread fills remaining height, top bar with dialect label and "new chat" button, typing indicator dots while loading, error messages surfaced
- TextChat: transliteration toggle moved to header as pill button, send icon button replaces text
- Translate: card-based language pickers instead of `<select>`, swap button, green tinted result card
- Settings: dialect list grouped by language, checkmark on active, TTS speed slider, logout button with phone number display

**Employer app changes:**
- EmployerLogin: 3-step progress bar, consistent design with worker app
- EmployerLayout: clean sidebar with SVG icons, account footer with sign-out
- Dashboard: stat cards (workers, languages, status) + recent workers list
- WorkerList: live search filter, worker cards with dialect badge
- DomainConfig: tips panel, full-height textarea card
- WorkerHistory: back nav, loading spinner, conversation in a card

**i18n — colloquial rewrite (all 3 languages):**

| Key | Old (formal) | New (colloquial) |
|-----|-------------|-----------------|
| hold_to_talk (kn) | ಮಾತನಾಡಲು ಒತ್ತಿ ಹಿಡಿಯಿರಿ | ಒತ್ಕೊಂಡ್ ಮಾತಾಡು |
| hold_to_talk (te) | మాట్లాడటానికి నొక్కి పట్టుకోండి | నొక్కి పట్టుకో మాట్లాడు |
| hold_to_talk (ta) | பேச அழுத்திப் பிடிக்கவும் | புடிச்சு பேசு |
| send (kn) | ಕಳಿಸಿ | ಕಳ್ಸು |
| verify (te) | ధృవీకరించండి | సరే చేయి |

**Audio bugs fixed (same session):**
- User's recorded audio (WebM) was being played as WAV — fixed by passing `format: 'webm'` for user messages
- Assistant audio had no auto-play — fixed with a dedicated `<audio>` ref in VoiceChat that plays immediately after API responds
- Transcript was small gray text below the Play button — moved above, now `text-base font-medium`
- Session creation and S2S errors were silently swallowed — now shown to the user

### Step 6 — Authentication
- User enters phone number → OTP is sent (or mocked in dev)
- User enters OTP → server returns a JWT token
- JWT token is stored in the browser and sent with every API call
- **Dev bypass**: any phone + OTP `000000` works when `OTP_MOCK=true`

### Step 7 — Dialect System
12 dialects are supported across 3 languages:
- Kannada: North Karnataka, Bengaluru, Coastal
- Telugu: Coastal AP, Rayalaseema, North AP, Hyderabad, North Telangana, South Telangana
- Tamil: Chennai, Western, Southern

Each dialect has a `dialect_code` (e.g. `te-hyderabad`) that controls which language instructions are sent to the AI.

### Step 8 — Persona System
9 personas were created — one per major dialect region. Each persona has a name, speaking style, address terms, filler words, and tone that matches real spoken language in that region.

Examples:
- **Raju** (Hubli, North Karnataka) — uses "bhava", "guru", Hindi mix
- **Ravi** (Hyderabad) — uses "bro", "maccha", Urdu mix
- **Murugan** (Chennai) — uses "machan", "da", Madras bashai

Every chat message is prefixed with the persona's system prompt so the AI responds in the right dialect and style.

### Step 9 — Transliteration
Workers can type in Roman letters (English keyboard) and the app converts it to native script before sending. Example: type `namaskara` → sends `ನಮಸ್ಕಾರ`.

Built as a custom engine in `frontend/src/utils/transliterate.ts`. Works for Kannada, Telugu, Tamil. Toggle button in the chat screen (ಕ = on, A = off).

### Step 10 — Training Data
Two types of training data were created:

**Synthetic data** — manually written conversations covering real work scenarios (shift timing, salary, GPS issues, customer calls, leave requests). 9 JSONL files, ~120 conversations total.

**Real spoken language data** — a pipeline to download YouTube videos from comedy/vlog channels and transcribe them using Whisper AI. This captures how people actually speak, not how textbooks say they should.

The pipeline lives in a separate repo (`amateur-ai-dev/vaakya-scraper`) so it can be run on a dedicated machine without tying up the dev environment. It supports both direct channel URLs and YouTube search queries (`search_query` in `channels.json`), and automatically resumes partial runs — if `raw_transcripts/<lang>/<video_id>.txt` already exists, that video is skipped.

**Current status (as of April 2026):**
- `te` — done: My Village Show, Dhethadi, Mahathalli (29 transcripts, 1063 pairs in `training_data/te/yt_scraped.jsonl`)
- `kn` — not started
- `ta` — not started

---

## Tools Used

### Backend

| Tool | What it does | Why we used it |
|------|-------------|----------------|
| **FastAPI** | Python web framework for building APIs | Fast, modern, auto-generates API docs at `/docs` |
| **SQLAlchemy 2.x** | Database toolkit for Python | Safe way to talk to PostgreSQL without writing raw SQL |
| **Alembic** | Database migration tool | Safely change DB structure without losing data |
| **PostgreSQL 15** | The database | Reliable, production-grade, free |
| **python-jose** | JWT token library | Handles login sessions securely |
| **Sarvam AI** | Indian language AI (STT, TTS, Chat, Translate) | Only AI provider with real support for Indian regional languages |

**Dos:**
- Always use Alembic to change the database — never edit tables manually
- Keep `SARVAM_MOCK=true` in dev so you don't burn API credits during testing
- Use `SECRET_KEY` from environment, never hardcode it

**Don'ts:**
- Don't expose the `/docs` endpoint in production (FastAPI auto-docs)
- Don't store OTPs in the database — keep them in memory (already done)
- Don't commit `.env` to git — it has secrets

### Frontend

| Tool | What it does | Why we used it |
|------|-------------|----------------|
| **React 18** | UI framework | Industry standard, large ecosystem |
| **TypeScript** | Typed JavaScript | Catches bugs before they happen |
| **Vite** | Build tool | Much faster than webpack |
| **Zustand** | State management | Simpler than Redux, enough for this app |
| **i18next** | Translations | Handles UI text in kn/te/ta |
| **Tailwind CSS** | Styling | Fast to write, consistent design |
| **nginx** | Web server (production) | Serves the built React app |

**Dos:**
- Keep language strings in `i18n/` files — don't hardcode text in components
- Use Zustand stores for shared state (dialect, auth)
- Always check `vaakya_lang` in localStorage before showing the login screen

**Don'ts:**
- Don't use `any` type in TypeScript — defeats the purpose
- Don't store JWT tokens in localStorage in production — use httpOnly cookies

### Infrastructure

| Tool | What it does | Why we used it |
|------|-------------|----------------|
| **Docker** | Runs each service in an isolated container | Same environment everywhere — dev, staging, prod |
| **Docker Compose** | Orchestrates all 3 containers together | One command to start/stop everything |
| **GitHub Actions** | CI/CD pipeline | Runs tests and builds Docker images on every push |

**Dos:**
- Always rebuild after code changes: `docker compose up -d --build backend`
- Use `docker compose logs -f backend` to see live logs
- Keep the `db` service data in a named volume so it survives restarts

**Don'ts:**
- Don't use `docker compose restart` after code changes — it reuses the old image
- Don't run `docker compose down -v` unless you want to wipe the database

### Training Data Pipeline

The scraper is a standalone repo: `amateur-ai-dev/vaakya-scraper`

| Tool | What it does | Why we used it |
|------|-------------|----------------|
| **yt-dlp** | Downloads audio from YouTube | Best YouTube downloader, actively maintained |
| **OpenAI Whisper** | Transcribes audio to text | Works offline, supports Indian languages |
| **ffmpeg** | Audio format conversion | Required by yt-dlp to convert webm → mp3 |

**Running the pipeline:**
```bash
# Run for a language (resumes automatically if raw_transcripts/ already has files)
python3 fetch_yt_transcripts.py --channels channels.json --lang te --max-per-channel 10

# To resume on a different machine: copy raw_transcripts/ there first, then run
rsync -avz raw_transcripts/te/ user@host:~/vaakya-scraper/raw_transcripts/te/
```

**channels.json supports two channel types:**
- `uploads_playlist` or `url` — fetches directly from that channel's video feed
- `search_query` — runs a YouTube search (`ytsearchN:query`) when no direct URL exists

**Dos:**
- Install yt-dlp via `brew install yt-dlp` (not pip) — ensures it's on system PATH
- Install ffmpeg via `brew install ffmpeg` — required for audio conversion
- Run the pipeline overnight on a separate machine — CPU transcription is slow (~15 min per video)
- Use `--max-per-channel 10` to limit download volume per run
- Copy `raw_transcripts/<lang>/` to a new machine before resuming — the script uses these to skip already-done videos

**Don'ts:**
- Don't use `pip install yt-dlp` on Mac — subprocess can't find pip-installed binaries
- Don't use the `large` Whisper model on CPU — takes hours per video
- Don't include news channels in `channels.json` — formal speech is not useful for training
- Don't delete `raw_transcripts/` — used for resume detection and debugging bad training pairs

---

## How to Run the App Locally

### Prerequisites
- Docker Desktop installed and running
- Git

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/amateur-ai-dev/bembala-v2
cd bembala-v2

# 2. Create .env file
cp .env.example .env
# Edit .env — set SARVAM_MOCK=true and OTP_MOCK=true for dev

# 3. Start everything
docker compose up -d --build

# 4. Check it's running
curl http://localhost:8000/health   # should return {"status":"ok"}
open http://localhost:5173           # open the app
```

### Dev Login
- Any phone number
- OTP: `000000`

---

## Going to Production

Only 2 things need to change:

### 1. Sarvam AI (the AI)
- Go to `dashboard.sarvam.ai` → API Keys → create a key
- Set in `.env`:
  ```
  SARVAM_API_KEY=your_key_here
  SARVAM_MOCK=false
  ```
- Rebuild: `docker compose up -d --build backend`

### 2. SMS OTP (real phone verification)
- Choose a provider: MSG91 (India, cheapest), Twilio, or AWS SNS
- Add `send_otp_sms()` function in `backend/app/services/auth_service.py`
- Call it in `backend/app/api/auth.py` when `OTP_MOCK=false`
- Add the SMS API key to `.env` and `backend/app/core/config.py`

---

## Scaling Considerations

### When you hit 100 users
- Move PostgreSQL to a managed service (AWS RDS, Supabase, Neon)
- Add Redis for OTP storage instead of in-memory dict (restarts wipe OTPs currently)
- Set up proper SSL/HTTPS with a reverse proxy (Caddy or nginx)

### When you hit 1,000 users
- Move to a proper cloud host (AWS, GCP, or DigitalOcean)
- Run backend as multiple instances behind a load balancer
- Add a CDN for frontend static files
- Add monitoring (Sentry for errors, Grafana for metrics)
- Move Docker Compose to Kubernetes or ECS

### When you fine-tune the AI
- `te` YouTube data is done (29 transcripts, 1063 pairs) — run `kn` and `ta` next using `amateur-ai-dev/vaakya-scraper`
- Format: JSONL files in `training_data/kn/`, `training_data/te/`, `training_data/ta/`
- Fine-tune Sarvam-M or an open-source model (Llama, Mistral) on this data
- Host the fine-tuned model separately, point `SARVAM_CHAT_MODEL` to it

### Security checklist before going live
- [ ] Change `SECRET_KEY` to a long random string
- [ ] Set `OTP_MOCK=false`
- [ ] Disable FastAPI `/docs` endpoint
- [ ] Move JWT to httpOnly cookies
- [ ] Add rate limiting to the OTP endpoint
- [ ] Enable HTTPS
