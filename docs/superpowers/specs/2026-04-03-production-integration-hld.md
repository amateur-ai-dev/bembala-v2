# Vaakya — Production Integration HLD
**Date:** 2026-04-03
**Status:** Reference

---

## 1. What Changes: Mock → Production at a Glance

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CURRENT STATE (Mock Mode)                           │
│                                                                             │
│  Browser ──▶ Frontend (nginx:5173) ──▶ FastAPI (8000) ──▶ MockSarvamClient │
│                                                │                            │
│                                        OTP returned                        │
│                                        in response body                    │
│                                        (no SMS sent)                       │
└─────────────────────────────────────────────────────────────────────────────┘

                          ↕  2 env var flips + 2 credentials

┌─────────────────────────────────────────────────────────────────────────────┐
│                        TARGET STATE (Production)                            │
│                                                                             │
│  Browser ──▶ Frontend (nginx:5173) ──▶ FastAPI (8000)                      │
│                                                │                            │
│                              ┌─────────────────┴──────────────────┐        │
│                              │                                    │        │
│                              ▼                                    ▼        │
│                   ┌─────────────────────┐           ┌────────────────────┐ │
│                   │   Sarvam AI API     │           │  SMS OTP Provider  │ │
│                   │   api.sarvam.ai     │           │  (e.g. MSG91/Twilio│ │
│                   │                    │           │  /AWS SNS)         │ │
│                   │  • Saaras v3 STT   │           └────────────────────┘ │
│                   │  • Bulbul v3 TTS   │                                   │
│                   │  • Sarvam-M Chat   │                                   │
│                   │  • Mayura v1 Trans │                                   │
│                   └─────────────────────┘                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Credentials Needed

```
┌────────────────────────────────────────────────────────────────────────────┐
│  #  │  Credential            │  Where to Get              │  Cost          │
├────────────────────────────────────────────────────────────────────────────┤
│  1  │  SARVAM_API_KEY        │  dashboard.sarvam.ai       │  Pay-per-call  │
│     │  (single key for all   │  → Sign Up → API Keys      │  (see below)   │
│     │   4 Sarvam APIs)       │                            │                │
├────────────────────────────────────────────────────────────────────────────┤
│  2  │  SMS_API_KEY           │  Choose ONE provider:      │  Pay-per-SMS   │
│     │  (OTP delivery only)   │  • msg91.com (India focus) │  ~₹0.20/SMS    │
│     │                        │  • console.twilio.com      │  ~$0.009/SMS   │
│     │                        │  • aws.amazon.com/sns      │  ~$0.00 (free  │
│     │                        │                            │   tier 100/mo) │
└────────────────────────────────────────────────────────────────────────────┘
```

### Sarvam AI Pricing (api.sarvam.ai)
```
┌─────────────────┬────────────────────────────────┬───────────────────┐
│  API            │  Model                         │  Approx Price     │
├─────────────────┼────────────────────────────────┼───────────────────┤
│  STT (Saaras)   │  saaras:v3                     │  Per minute audio │
│  TTS (Bulbul)   │  bulbul:v3                     │  Per 1000 chars   │
│  Chat (Sarvam-M)│  sarvam-m                      │  Per 1M tokens    │
│  Translate      │  mayura:v1                     │  Per 1000 chars   │
└─────────────────┴────────────────────────────────┴───────────────────┘
  → Check current rates at: https://dashboard.sarvam.ai/pricing
```

---

## 3. Environment Variables: What to Change

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            .env  (in /vaakya/)                              │
│                                                                             │
│   CURRENT (mock)               →    PRODUCTION                             │
│   ─────────────────────────────────────────────────────────                │
│   SARVAM_MOCK=true             →    SARVAM_MOCK=false                      │
│   SARVAM_API_KEY=              →    SARVAM_API_KEY=<your-key-here>         │
│   OTP_MOCK=true                →    OTP_MOCK=false                         │
│   SECRET_KEY=change-me-in-     →    SECRET_KEY=<64-char-random-string>     │
│              production                                                     │
│                                                                             │
│   THESE STAY THE SAME:                                                      │
│   DATABASE_URL=postgresql://vaakya:vaakya@db:5432/vaakya                   │
└─────────────────────────────────────────────────────────────────────────────┘

  Generate SECRET_KEY:
  $ python3 -c "import secrets; print(secrets.token_hex(32))"
```

---

## 4. Code Touch Map

```
vaakya/
│
├── .env                              ← CHANGE 4 values (see section 3)
│
└── backend/
    └── app/
        ├── config.py                 ← NO CHANGE NEEDED
        │                               (already reads all env vars)
        │
        ├── services/
        │   ├── sarvam/
        │   │   ├── factory.py        ← NO CHANGE NEEDED
        │   │   │                       (SARVAM_MOCK=false auto-routes to real client)
        │   │   ├── client.py         ← NO CHANGE NEEDED
        │   │   │                       (real API calls already implemented)
        │   │   └── mock.py           ← NO CHANGE NEEDED
        │   │                           (kept for local dev & CI)
        │   │
        │   └── auth_service.py       ← ADD SMS sending logic
        │                               (only if OTP_MOCK=false)
        │
        └── api/
            └── auth.py               ← MINOR CHANGE: call SMS service
                                        when OTP_MOCK=false
```

---

## 5. The One Code Change Required: SMS OTP

Currently `auth.py` **only returns the OTP in the response body** — that works in mock mode but leaks the OTP in production. When `OTP_MOCK=false`, it must send via SMS instead.

### 5a. auth_service.py — Add SMS dispatch

```
backend/app/services/auth_service.py
─────────────────────────────────────
CURRENT                              │  ADD BELOW generate_otp() function
─────────────────────────────────────────────────────────────────────────
def store_otp(phone, otp): ...       │  def send_otp_sms(phone: str,
                                     │                   otp: str) -> None:
                                     │      # Example: MSG91
                                     │      import httpx
                                     │      httpx.post(
                                     │        "https://control.msg91.com/api/v5/flow/",
                                     │        headers={"authkey": settings.sms_api_key},
                                     │        json={
                                     │          "template_id": settings.sms_template_id,
                                     │          "mobile": f"91{phone}",
                                     │          "OTP": otp
                                     │        }
                                     │      )
```

### 5b. auth.py — Gate on OTP_MOCK flag

```
backend/app/api/auth.py  (line 14-18)
──────────────────────────────────────────────────────────────────
CURRENT                              │  CHANGE TO
─────────────────────────────────────┼────────────────────────────
@router.post("/request-otp")         │  @router.post("/request-otp")
def request_otp(body, db):           │  def request_otp(body, db):
    otp = generate_otp()             │      otp = generate_otp()
    store_otp(body.phone, otp)       │      store_otp(body.phone, otp)
    if settings.otp_mock:            │      if settings.otp_mock:
        return {"otp": otp, ...}     │          return {"otp": otp, ...}
    return {"message": "OTP sent"}   │      else:
                                     │          send_otp_sms(body.phone, otp)
                                     │      return {"message": "OTP sent"}
```

### 5c. config.py — Add SMS env vars

```
backend/app/config.py
──────────────────────────────────────────────────────────────────
ADD these two fields to the Settings class:

    sms_api_key: str = ""
    sms_template_id: str = ""       # only needed for MSG91
```

### 5d. .env.example — Document new vars

```
ADD to .env.example:

    SMS_API_KEY=your-sms-provider-api-key
    SMS_TEMPLATE_ID=your-msg91-template-id   # MSG91 only
```

---

## 6. Data Flow: Production vs Mock

### STT → Chat → TTS (Speech-to-Speech pipeline)

```
MOCK MODE (today)
─────────────────
User audio (base64)
        │
        ▼
  /api/s2s endpoint
        │
        ├──▶ MockClient.speech_to_text()  →  "ನಮಸ್ಕಾರ, ನನಗೆ ಸಹಾಯ ಮಾಡಿ"  (hardcoded)
        │
        ├──▶ build_system_prompt()        →  employer domain + dialect instruction
        │
        ├──▶ MockClient.chat()            →  "[MOCK] ನಿಮ್ಮ ಪ್ರಶ್ನೆಗೆ ಉತ್ತರ ಇಲ್ಲಿದೆ"
        │
        └──▶ MockClient.text_to_speech()  →  silent WAV (44 bytes)


PRODUCTION MODE (after env var flip)
─────────────────────────────────────
User audio (base64)
        │
        ▼
  /api/s2s endpoint
        │
        ├──▶ SarvamClient.speech_to_text()
        │        POST api.sarvam.ai/speech-to-text
        │        model: saaras:v3
        │        → real Kannada/Telugu/Tamil transcript
        │
        ├──▶ build_system_prompt()  [NO CHANGE — pure Python, no API call]
        │
        ├──▶ SarvamClient.chat()
        │        POST api.sarvam.ai/chat/completions
        │        model: sarvam-m
        │        → real LLM response in worker's dialect
        │
        └──▶ SarvamClient.text_to_speech()
                 POST api.sarvam.ai/text-to-speech
                 model: bulbul:v3
                 → real audio WAV in worker's voice/dialect
```

---

## 7. Sign-Up Checklist (in order)

```
┌───┬──────────────────────────────────────────────────────────────────────┐
│ 1 │  Go to https://dashboard.sarvam.ai                                   │
│   │  → Create account → navigate to "API Keys" → create new key         │
│   │  → Copy the key                                                      │
├───┼──────────────────────────────────────────────────────────────────────┤
│ 2 │  Choose SMS provider (MSG91 recommended for India):                  │
│   │  → https://msg91.com → Sign Up → OTP widget/flow template           │
│   │  → Get authkey + template_id                                         │
├───┼──────────────────────────────────────────────────────────────────────┤
│ 3 │  Open /vaakya/.env and set:                                          │
│   │      SARVAM_API_KEY=<key from step 1>                                │
│   │      SARVAM_MOCK=false                                               │
│   │      OTP_MOCK=false                                                  │
│   │      SMS_API_KEY=<key from step 2>                                   │
│   │      SMS_TEMPLATE_ID=<template id from step 2>                       │
│   │      SECRET_KEY=<run: python3 -c "import secrets;                    │
│   │                         print(secrets.token_hex(32))">              │
├───┼──────────────────────────────────────────────────────────────────────┤
│ 4 │  Apply the 4 code changes in section 5 above                        │
│   │  (auth_service.py, auth.py, config.py, .env.example)                │
├───┼──────────────────────────────────────────────────────────────────────┤
│ 5 │  Restart containers:                                                 │
│   │      docker compose down && docker compose up --build               │
├───┼──────────────────────────────────────────────────────────────────────┤
│ 6 │  Smoke test:                                                         │
│   │      curl -X POST http://localhost:8000/auth/request-otp \          │
│   │           -d '{"phone":"your-real-number"}' → SMS arrives           │
│   │      curl -X POST http://localhost:8000/api/tts \                   │
│   │           -H "Authorization: Bearer <token>" \                      │
│   │           -d '{"text":"ನಮಸ್ಕಾರ","dialect_code":"kn-bengaluru",     │
│   │                "language":"kn-IN"}' → real audio in response        │
└───┴──────────────────────────────────────────────────────────────────────┘
```

---

## 8. Summary: 2 Env Flips + 1 SMS Integration = Production Ready

```
                    ┌────────────────────────────────────┐
                    │         TO GO LIVE                 │
                    │                                    │
                    │  ENV CHANGES (zero code change):   │
                    │  ─────────────────────────────     │
                    │  SARVAM_MOCK=false           ①    │
                    │  SARVAM_API_KEY=<key>         ①    │
                    │                                    │
                    │  CODE CHANGES (SMS only):          │
                    │  ─────────────────────────────     │
                    │  auth_service.py: +send_sms() ②   │
                    │  auth.py: +call send_sms()    ②   │
                    │  config.py: +sms_api_key      ②   │
                    │                                    │
                    │  ENV CHANGES (after SMS code):     │
                    │  ─────────────────────────────     │
                    │  OTP_MOCK=false               ②   │
                    │  SMS_API_KEY=<key>            ②   │
                    │  SECRET_KEY=<random>          ②   │
                    │                                    │
                    │  Everything else (DB, JWT, UI,     │
                    │  dialect logic, history, employer  │
                    │  dashboard) — NO CHANGES NEEDED.   │
                    └────────────────────────────────────┘
```
