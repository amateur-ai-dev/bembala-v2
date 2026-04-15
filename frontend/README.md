# Vaakya — Frontend

React + TypeScript + Vite web app for the Vaakya voice assistant.

## Stack

- **React 18** + **TypeScript**
- **Vite** (build tool)
- **Tailwind CSS** with custom design tokens
- **Zustand** (auth + dialect stores)
- **i18next** (kn / te / ta, colloquial strings)
- **nginx** (serves built app in Docker)

## Design System

| Token | Value |
|-------|-------|
| Accent | `#16a34a` (forest green) |
| Dark bg | `#0f0f0f` |
| Light bg | `#fafafa` |
| Font | Inter |
| Base radius | `rounded-2xl` |

Dark mode toggles via `dark` class on `<html>`, set automatically from `prefers-color-scheme`.

## Screens

### Worker
| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `LanguagePicker` | Pick KN / TE / TA + sets default dialect |
| `/worker/login` | `LoginScreen` | Phone + OTP, redirects to picker if no lang set |
| `/worker/voice` | `VoiceChat` | Hold-to-talk mic, auto-plays AI response |
| `/worker/chat` | `TextChat` | Typed chat with transliteration toggle |
| `/worker/translate` | `TranslateScreen` | Translate between KN / TE / TA / EN |
| `/worker/settings` | `Settings` | Dialect picker, TTS speed, logout |

### Employer
| Route | Component | Description |
|-------|-----------|-------------|
| `/employer/login` | `EmployerLogin` | Phone + OTP + org name setup |
| `/employer` | `Dashboard` | Stats + recent workers |
| `/employer/workers` | `WorkerList` | Searchable worker list |
| `/employer/workers/:id/history` | `WorkerHistory` | Conversation history |
| `/employer/config` | `DomainConfig` | System prompt editor |

## Shared Components

| Component | Description |
|-----------|-------------|
| `HoldToTalk` | Mic button — waveform bars while recording, pulse ring animation |
| `ChatBubble` | Message bubble — transcript above play button, `msg-in` animation |
| `AudioPlayer` | Play button — takes `format` prop (`webm` for user audio, `wav` for assistant) |
| `ProtectedRoute` | Redirects to login if no token / wrong role |

## i18n

Colloquial strings in `src/i18n/kn.json`, `te.json`, `ta.json`.

Examples:
- `hold_to_talk` (kn): `ಒತ್ಕೊಂಡ್ ಮಾತಾಡು`
- `hold_to_talk` (te): `నొక్కి పట్టుకో మాట్లాడు`
- `hold_to_talk` (ta): `புடிச்சு பேசு`

To add a new key: add it to all 3 JSON files and use `const { t } = useTranslation()` + `t('key')` in components.

## Transliteration

`src/utils/transliterate.ts` — converts Roman keyboard input to native script.
- `namaskara` → `ನಮಸ್ಕಾರ` (Kannada)
- `namaskaram` → `నమస్కారం` (Telugu)
- `vanakkam` → `வணக்கம்` (Tamil)

Toggle button in `TextChat` header (shows current script label when on, `A` when off).

## State

| Store | File | Contents |
|-------|------|----------|
| Auth | `src/store/auth.ts` | `token`, `role`, `phone`, `login()`, `logout()` |
| Dialect | `src/store/dialect.ts` | `dialectCode`, `language`, `ttsSpeed`, setters |

Both are persisted to localStorage via Zustand `persist` middleware.

## Dev

```bash
# Run via Docker (recommended — needs backend running)
docker compose up -d --build

# Or run standalone (points to localhost:8000)
cd frontend
npm install
npm run dev     # http://localhost:5173
```

API base URL is `VITE_API_URL` (empty = same origin, works with Docker nginx proxy).

## Build

```bash
npm run build   # outputs to dist/
npm run test    # vitest — 8 tests
npm run lint    # eslint
```
