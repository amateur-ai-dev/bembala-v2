# Vaakya Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the React/Vite frontend for Vaakya — a mobile-first worker app (voice/text chat, translate, settings) and a desktop employer dashboard (team management, domain config, worker history).

**Architecture:** Single Vite + React app with two distinct UX trees (`/worker/*` and `/employer/*`) sharing a component library. Zustand for auth/dialect state, axios for API calls, i18next for Kannada/Telugu/Tamil UI strings. First-launch language picker sets UI locale and persists to localStorage.

**Tech Stack:** React 18, TypeScript, Vite, Zustand, axios, i18next, React Router v6, Tailwind CSS, Vitest + React Testing Library

---

## File Map

```
frontend/
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── Dockerfile
├── src/
│   ├── main.tsx                        # app entry, i18n init
│   ├── App.tsx                         # router root
│   ├── router.tsx                      # all routes
│   ├── api/
│   │   └── client.ts                   # axios instance, JWT interceptor, all API calls
│   ├── store/
│   │   ├── auth.ts                     # Zustand: JWT, user role, phone
│   │   └── dialect.ts                  # Zustand: selected dialect code + language
│   ├── i18n/
│   │   ├── index.ts                    # i18next init
│   │   ├── kn.json                     # Kannada UI strings
│   │   ├── te.json                     # Telugu UI strings
│   │   └── ta.json                     # Tamil UI strings
│   ├── components/
│   │   ├── HoldToTalk.tsx              # hold-to-record button with waveform
│   │   ├── AudioPlayer.tsx             # plays base64 WAV audio
│   │   ├── ChatBubble.tsx              # single message bubble (user/assistant)
│   │   └── ProtectedRoute.tsx          # redirects to login if no token
│   ├── worker/
│   │   ├── LanguagePicker.tsx          # first-launch screen
│   │   ├── LoginScreen.tsx             # phone + OTP flow
│   │   ├── WorkerLayout.tsx            # bottom nav shell
│   │   ├── VoiceChat.tsx               # hold-to-talk voice chat screen
│   │   ├── TextChat.tsx                # keyboard text chat screen
│   │   ├── TranslateScreen.tsx         # dialect pair translation
│   │   └── Settings.tsx                # dialect selector, TTS speed
│   └── employer/
│       ├── EmployerLogin.tsx           # employer phone + OTP
│       ├── EmployerLayout.tsx          # sidebar shell
│       ├── Dashboard.tsx               # overview/stats
│       ├── WorkerList.tsx              # team management
│       ├── DomainConfig.tsx            # system prompt editor
│       └── WorkerHistory.tsx           # per-worker chat history viewer
├── src/test/
│   ├── setup.ts
│   ├── api.test.ts
│   ├── store.test.ts
│   ├── LanguagePicker.test.tsx
│   ├── LoginScreen.test.tsx
│   ├── VoiceChat.test.tsx
│   ├── TextChat.test.tsx
│   └── DomainConfig.test.tsx
```

---

## Task 1: Vite + React + TypeScript scaffold

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tailwind.config.ts`
- Create: `frontend/tsconfig.json`
- Create: `frontend/index.html`
- Create: `frontend/src/main.tsx`

- [ ] **Step 1: Scaffold with Vite**

```bash
cd /Users/nithingowda/vaakya
npm create vite@latest frontend -- --template react-ts
cd frontend && npm install
```

- [ ] **Step 2: Install dependencies**

```bash
cd frontend
npm install axios zustand react-router-dom i18next react-i18next
npm install -D tailwindcss postcss autoprefixer vitest @testing-library/react @testing-library/jest-dom jsdom @types/node
npx tailwindcss init -p
```

- [ ] **Step 3: Update `frontend/vite.config.ts`**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8000',
      '/auth': 'http://localhost:8000',
      '/employer': 'http://localhost:8000',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
```

- [ ] **Step 4: Update `frontend/tailwind.config.ts`**

```typescript
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

- [ ] **Step 5: Create `frontend/src/test/setup.ts`**

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 6: Replace `frontend/src/main.tsx`**

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import './i18n'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 7: Replace `frontend/src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 8: Verify build passes**

```bash
cd frontend && npm run build
```
Expected: Build succeeds with no errors.

- [ ] **Step 9: Commit**

```bash
cd /Users/nithingowda/vaakya
git add frontend/
git commit -m "chore: Vite + React + TypeScript + Tailwind scaffold"
```

---

## Task 2: i18n setup (Kannada, Telugu, Tamil)

**Files:**
- Create: `frontend/src/i18n/index.ts`
- Create: `frontend/src/i18n/kn.json`
- Create: `frontend/src/i18n/te.json`
- Create: `frontend/src/i18n/ta.json`

- [ ] **Step 1: Create `frontend/src/i18n/kn.json`**

```json
{
  "welcome": "ಸ್ವಾಗತ",
  "choose_language": "ನಿಮ್ಮ ಭಾಷೆ ಆರಿಸಿ",
  "enter_phone": "ಫೋನ್ ನಂಬರ್ ನಮೂದಿಸಿ",
  "enter_otp": "OTP ನಮೂದಿಸಿ",
  "send_otp": "OTP ಕಳಿಸಿ",
  "verify": "ಪರಿಶೀಲಿಸಿ",
  "hold_to_talk": "ಮಾತನಾಡಲು ಒತ್ತಿ ಹಿಡಿಯಿರಿ",
  "type_message": "ಸಂದೇಶ ಟೈಪ್ ಮಾಡಿ",
  "send": "ಕಳಿಸಿ",
  "translate": "ಅನುವಾದ",
  "settings": "ಸೆಟ್ಟಿಂಗ್ಸ್",
  "voice": "ಧ್ವನಿ",
  "chat": "ಚಾಟ್",
  "dialect": "ಉಪಭಾಷೆ",
  "speed": "ವೇಗ",
  "from": "ಇಂದ",
  "to": "ಗೆ",
  "loading": "ಲೋಡ್ ಆಗುತ್ತಿದೆ..."
}
```

- [ ] **Step 2: Create `frontend/src/i18n/te.json`**

```json
{
  "welcome": "స్వాగతం",
  "choose_language": "మీ భాషను ఎంచుకోండి",
  "enter_phone": "ఫోన్ నంబర్ నమోదు చేయండి",
  "enter_otp": "OTP నమోదు చేయండి",
  "send_otp": "OTP పంపండి",
  "verify": "ధృవీకరించండి",
  "hold_to_talk": "మాట్లాడటానికి నొక్కి పట్టుకోండి",
  "type_message": "సందేశం టైప్ చేయండి",
  "send": "పంపండి",
  "translate": "అనువాదం",
  "settings": "సెట్టింగులు",
  "voice": "వాయిస్",
  "chat": "చాట్",
  "dialect": "మాండలికం",
  "speed": "వేగం",
  "from": "నుండి",
  "to": "కి",
  "loading": "లోడ్ అవుతోంది..."
}
```

- [ ] **Step 3: Create `frontend/src/i18n/ta.json`**

```json
{
  "welcome": "வரவேற்கிறோம்",
  "choose_language": "உங்கள் மொழியைத் தேர்ந்தெடுங்கள்",
  "enter_phone": "தொலைபேசி எண் உள்ளிடுங்கள்",
  "enter_otp": "OTP உள்ளிடுங்கள்",
  "send_otp": "OTP அனுப்புங்கள்",
  "verify": "சரிபார்க்கவும்",
  "hold_to_talk": "பேச அழுத்திப் பிடிக்கவும்",
  "type_message": "செய்தி தட்டச்சு செய்யுங்கள்",
  "send": "அனுப்புங்கள்",
  "translate": "மொழிபெயர்ப்பு",
  "settings": "அமைப்புகள்",
  "voice": "குரல்",
  "chat": "அரட்டை",
  "dialect": "வட்டார வழக்கு",
  "speed": "வேகம்",
  "from": "இருந்து",
  "to": "க்கு",
  "loading": "ஏற்றுகிறது..."
}
```

- [ ] **Step 4: Create `frontend/src/i18n/index.ts`**

```typescript
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import kn from './kn.json'
import te from './te.json'
import ta from './ta.json'

const savedLang = localStorage.getItem('vaakya_lang') || 'kn'

i18n.use(initReactI18next).init({
  resources: {
    kn: { translation: kn },
    te: { translation: te },
    ta: { translation: ta },
  },
  lng: savedLang,
  fallbackLng: 'kn',
  interpolation: { escapeValue: false },
})

export default i18n
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/i18n/
git commit -m "feat: i18n setup with Kannada, Telugu, Tamil translations"
```

---

## Task 3: Zustand stores + API client

**Files:**
- Create: `frontend/src/store/auth.ts`
- Create: `frontend/src/store/dialect.ts`
- Create: `frontend/src/api/client.ts`
- Test: `frontend/src/test/store.test.ts`
- Test: `frontend/src/test/api.test.ts`

- [ ] **Step 1: Write failing store test**

Create `frontend/src/test/store.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '../store/auth'
import { useDialectStore } from '../store/dialect'
import { act } from '@testing-library/react'

describe('auth store', () => {
  beforeEach(() => {
    useAuthStore.getState().logout()
  })

  it('starts with no token', () => {
    expect(useAuthStore.getState().token).toBeNull()
  })

  it('login sets token and role', () => {
    act(() => {
      useAuthStore.getState().login('test-token', 'worker', '9876543210')
    })
    expect(useAuthStore.getState().token).toBe('test-token')
    expect(useAuthStore.getState().role).toBe('worker')
  })

  it('logout clears token', () => {
    act(() => {
      useAuthStore.getState().login('test-token', 'worker', '9876543210')
      useAuthStore.getState().logout()
    })
    expect(useAuthStore.getState().token).toBeNull()
  })
})

describe('dialect store', () => {
  it('setDialect updates dialect code', () => {
    act(() => {
      useDialectStore.getState().setDialect('kn-north', 'kn')
    })
    expect(useDialectStore.getState().dialectCode).toBe('kn-north')
    expect(useDialectStore.getState().language).toBe('kn')
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
cd frontend && npx vitest run src/test/store.test.ts
```
Expected: Cannot find module `../store/auth`

- [ ] **Step 3: Create `frontend/src/store/auth.ts`**

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  token: string | null
  role: 'worker' | 'employer' | null
  phone: string | null
  login: (token: string, role: 'worker' | 'employer', phone: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      role: null,
      phone: null,
      login: (token, role, phone) => set({ token, role, phone }),
      logout: () => set({ token: null, role: null, phone: null }),
    }),
    { name: 'vaakya_auth' }
  )
)
```

- [ ] **Step 4: Create `frontend/src/store/dialect.ts`**

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface DialectState {
  dialectCode: string
  language: string  // "kn" | "te" | "ta"
  ttsSpeed: number
  setDialect: (code: string, language: string) => void
  setTtsSpeed: (speed: number) => void
}

export const useDialectStore = create<DialectState>()(
  persist(
    (set) => ({
      dialectCode: 'kn-north',
      language: 'kn',
      ttsSpeed: 1.0,
      setDialect: (dialectCode, language) => set({ dialectCode, language }),
      setTtsSpeed: (ttsSpeed) => set({ ttsSpeed }),
    }),
    { name: 'vaakya_dialect' }
  )
)
```

- [ ] **Step 5: Create `frontend/src/api/client.ts`**

```typescript
import axios from 'axios'
import { useAuthStore } from '../store/auth'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
})

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auth
export const requestOtp = (phone: string) =>
  apiClient.post('/auth/request-otp', { phone })

export const verifyOtp = (phone: string, otp: string, role: string) =>
  apiClient.post('/auth/verify-otp', { phone, otp, role })

// STT
export const speechToText = (audio_b64: string, dialect_code: string, language: string) =>
  apiClient.post('/api/stt', { audio_b64, dialect_code, language })

// TTS
export const textToSpeech = (text: string, dialect_code: string, language: string) =>
  apiClient.post('/api/tts', { text, dialect_code, language })

// Chat
export const sendChat = (
  messages: { role: string; content: string }[],
  dialect_code: string,
  domain_prompt: string
) => apiClient.post('/api/chat', { messages, dialect_code, domain_prompt })

// Translate
export const translateText = (text: string, source_lang: string, target_lang: string) =>
  apiClient.post('/api/translate', { text, source_lang, target_lang })

// S2S
export const speechToSpeech = (
  audio_b64: string,
  dialect_code: string,
  language: string,
  session_id: number
) => apiClient.post('/api/s2s', { audio_b64, dialect_code, language, session_id })

// Sessions
export const createSession = () => apiClient.post('/api/sessions', {})
export const getMessages = (sessionId: number) =>
  apiClient.get(`/api/sessions/${sessionId}/messages`)

// Employer
export const registerOrg = (org_name: string, system_prompt: string) =>
  apiClient.post('/employer/register', { org_name, system_prompt })

export const updateDomainConfig = (system_prompt: string) =>
  apiClient.put('/employer/config', { system_prompt })

export const listWorkers = () => apiClient.get('/employer/workers')
```

- [ ] **Step 6: Run store test**

```bash
cd frontend && npx vitest run src/test/store.test.ts
```
Expected: 5 tests PASS

- [ ] **Step 7: Commit**

```bash
git add frontend/src/store/ frontend/src/api/
git commit -m "feat: Zustand stores and API client"
```

---

## Task 4: Router + ProtectedRoute + App shell

**Files:**
- Create: `frontend/src/components/ProtectedRoute.tsx`
- Create: `frontend/src/router.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Create `frontend/src/components/ProtectedRoute.tsx`**

```typescript
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'

interface Props {
  children: React.ReactNode
  requiredRole?: 'worker' | 'employer'
}

export default function ProtectedRoute({ children, requiredRole }: Props) {
  const { token, role } = useAuthStore()
  if (!token) return <Navigate to="/worker/login" replace />
  if (requiredRole && role !== requiredRole) return <Navigate to="/worker/login" replace />
  return <>{children}</>
}
```

- [ ] **Step 2: Create `frontend/src/router.tsx`**

```typescript
import { createBrowserRouter } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import LanguagePicker from './worker/LanguagePicker'
import LoginScreen from './worker/LoginScreen'
import WorkerLayout from './worker/WorkerLayout'
import VoiceChat from './worker/VoiceChat'
import TextChat from './worker/TextChat'
import TranslateScreen from './worker/TranslateScreen'
import Settings from './worker/Settings'
import EmployerLogin from './employer/EmployerLogin'
import EmployerLayout from './employer/EmployerLayout'
import Dashboard from './employer/Dashboard'
import WorkerList from './employer/WorkerList'
import DomainConfig from './employer/DomainConfig'
import WorkerHistory from './employer/WorkerHistory'

export const router = createBrowserRouter([
  { path: '/', element: <LanguagePicker /> },
  { path: '/worker/login', element: <LoginScreen /> },
  {
    path: '/worker',
    element: <ProtectedRoute requiredRole="worker"><WorkerLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <VoiceChat /> },
      { path: 'voice', element: <VoiceChat /> },
      { path: 'chat', element: <TextChat /> },
      { path: 'translate', element: <TranslateScreen /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
  { path: '/employer/login', element: <EmployerLogin /> },
  {
    path: '/employer',
    element: <ProtectedRoute requiredRole="employer"><EmployerLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'workers', element: <WorkerList /> },
      { path: 'config', element: <DomainConfig /> },
      { path: 'workers/:id/history', element: <WorkerHistory /> },
    ],
  },
])
```

- [ ] **Step 3: Replace `frontend/src/App.tsx`**

```typescript
import { RouterProvider } from 'react-router-dom'
import { router } from './router'

export default function App() {
  return <RouterProvider router={router} />
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/ frontend/src/router.tsx frontend/src/App.tsx
git commit -m "feat: router, ProtectedRoute, App shell"
```

---

## Task 5: Language picker screen

**Files:**
- Create: `frontend/src/worker/LanguagePicker.tsx`
- Test: `frontend/src/test/LanguagePicker.test.tsx`

- [ ] **Step 1: Write failing test**

Create `frontend/src/test/LanguagePicker.test.tsx`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import LanguagePicker from '../worker/LanguagePicker'

const renderPicker = () =>
  render(<MemoryRouter><LanguagePicker /></MemoryRouter>)

it('renders three language options', () => {
  renderPicker()
  expect(screen.getByText('ಕನ್ನಡ')).toBeInTheDocument()
  expect(screen.getByText('తెలుగు')).toBeInTheDocument()
  expect(screen.getByText('தமிழ்')).toBeInTheDocument()
})

it('saves language to localStorage on select', () => {
  renderPicker()
  fireEvent.click(screen.getByText('ಕನ್ನಡ'))
  expect(localStorage.getItem('vaakya_lang')).toBe('kn')
})
```

- [ ] **Step 2: Run to verify failure**

```bash
cd frontend && npx vitest run src/test/LanguagePicker.test.tsx
```
Expected: Cannot find module

- [ ] **Step 3: Create placeholder files needed by router** (so build doesn't break)

Create stubs for all worker/ and employer/ screens that router.tsx imports. Each stub is a minimal component — they'll be filled in subsequent tasks.

```bash
mkdir -p frontend/src/worker frontend/src/employer
```

Create `frontend/src/worker/WorkerLayout.tsx`:
```typescript
import { Outlet, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function WorkerLayout() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col h-screen">
      <main className="flex-1 overflow-auto"><Outlet /></main>
      <nav className="flex justify-around bg-gray-900 text-white py-3">
        <NavLink to="/worker/voice" className="flex flex-col items-center text-xs gap-1">
          <span className="text-2xl">🎙️</span>{t('voice')}
        </NavLink>
        <NavLink to="/worker/chat" className="flex flex-col items-center text-xs gap-1">
          <span className="text-2xl">💬</span>{t('chat')}
        </NavLink>
        <NavLink to="/worker/translate" className="flex flex-col items-center text-xs gap-1">
          <span className="text-2xl">🔄</span>{t('translate')}
        </NavLink>
        <NavLink to="/worker/settings" className="flex flex-col items-center text-xs gap-1">
          <span className="text-2xl">⚙️</span>{t('settings')}
        </NavLink>
      </nav>
    </div>
  )
}
```

Create stubs (one file each — replace with real implementations in later tasks):

`frontend/src/worker/VoiceChat.tsx` → stub:
```typescript
export default function VoiceChat() { return <div>VoiceChat</div> }
```

`frontend/src/worker/TextChat.tsx` → stub:
```typescript
export default function TextChat() { return <div>TextChat</div> }
```

`frontend/src/worker/TranslateScreen.tsx` → stub:
```typescript
export default function TranslateScreen() { return <div>Translate</div> }
```

`frontend/src/worker/Settings.tsx` → stub:
```typescript
export default function Settings() { return <div>Settings</div> }
```

`frontend/src/employer/EmployerLogin.tsx` → stub:
```typescript
export default function EmployerLogin() { return <div>EmployerLogin</div> }
```

`frontend/src/employer/EmployerLayout.tsx` → stub:
```typescript
import { Outlet } from 'react-router-dom'
export default function EmployerLayout() { return <div><Outlet /></div> }
```

`frontend/src/employer/Dashboard.tsx` → stub:
```typescript
export default function Dashboard() { return <div>Dashboard</div> }
```

`frontend/src/employer/WorkerList.tsx` → stub:
```typescript
export default function WorkerList() { return <div>WorkerList</div> }
```

`frontend/src/employer/DomainConfig.tsx` → stub:
```typescript
export default function DomainConfig() { return <div>DomainConfig</div> }
```

`frontend/src/employer/WorkerHistory.tsx` → stub:
```typescript
export default function WorkerHistory() { return <div>WorkerHistory</div> }
```

- [ ] **Step 4: Create `frontend/src/worker/LanguagePicker.tsx`**

```typescript
import { useNavigate } from 'react-router-dom'
import i18n from '../i18n'
import { useDialectStore } from '../store/dialect'

const LANGUAGES = [
  { code: 'kn', label: 'ಕನ್ನಡ', defaultDialect: 'kn-bengaluru', flag: '🟡' },
  { code: 'te', label: 'తెలుగు', defaultDialect: 'te-hyderabad', flag: '🟠' },
  { code: 'ta', label: 'தமிழ்', defaultDialect: 'ta-chennai', flag: '🔴' },
]

export default function LanguagePicker() {
  const navigate = useNavigate()
  const setDialect = useDialectStore((s) => s.setDialect)

  const pick = (lang: typeof LANGUAGES[0]) => {
    localStorage.setItem('vaakya_lang', lang.code)
    i18n.changeLanguage(lang.code)
    setDialect(lang.defaultDialect, lang.code)
    navigate('/worker/login')
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-white text-3xl font-bold text-center">Vaakya</h1>
      <p className="text-gray-400 text-center text-lg">ನಿಮ್ಮ ಭಾಷೆ / మీ భాష / உங்கள் மொழி</p>
      <div className="flex flex-col gap-4 w-full max-w-xs">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => pick(lang)}
            className="flex items-center gap-4 bg-gray-800 text-white text-2xl font-semibold rounded-2xl px-6 py-5 active:bg-gray-700 transition-colors"
          >
            <span className="text-4xl">{lang.flag}</span>
            {lang.label}
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Run test**

```bash
cd frontend && npx vitest run src/test/LanguagePicker.test.tsx
```
Expected: 2 tests PASS

- [ ] **Step 6: Commit**

```bash
git add frontend/src/worker/ frontend/src/employer/
git commit -m "feat: language picker and screen stubs"
```

---

## Task 6: Worker login (phone + OTP)

**Files:**
- Create: `frontend/src/worker/LoginScreen.tsx`
- Test: `frontend/src/test/LoginScreen.test.tsx`

- [ ] **Step 1: Write failing test**

Create `frontend/src/test/LoginScreen.test.tsx`:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import LoginScreen from '../worker/LoginScreen'
import * as api from '../api/client'

vi.mock('../api/client')

beforeEach(() => {
  vi.mocked(api.requestOtp).mockResolvedValue({ data: { otp: '123456', message: 'sent' } } as any)
  vi.mocked(api.verifyOtp).mockResolvedValue({ data: { access_token: 'fake-jwt' } } as any)
})

it('renders phone input', () => {
  render(<MemoryRouter><LoginScreen /></MemoryRouter>)
  expect(screen.getByRole('textbox')).toBeInTheDocument()
})

it('shows OTP input after requesting OTP', async () => {
  render(<MemoryRouter><LoginScreen /></MemoryRouter>)
  fireEvent.change(screen.getByRole('textbox'), { target: { value: '9876543210' } })
  fireEvent.click(screen.getByRole('button'))
  await waitFor(() => expect(api.requestOtp).toHaveBeenCalledWith('9876543210'))
})
```

- [ ] **Step 2: Run to verify failure**

```bash
cd frontend && npx vitest run src/test/LoginScreen.test.tsx
```
Expected: Cannot find module or import error

- [ ] **Step 3: Create `frontend/src/worker/LoginScreen.tsx`**

```typescript
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { requestOtp, verifyOtp } from '../api/client'
import { useAuthStore } from '../store/auth'

export default function LoginScreen() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRequestOtp = async () => {
    setLoading(true)
    setError('')
    try {
      await requestOtp(phone)
      setStep('otp')
    } catch {
      setError('Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await verifyOtp(phone, otp, 'worker')
      login(res.data.access_token, 'worker', phone)
      navigate('/worker/voice')
    } catch {
      setError('Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-8 gap-6">
      <h1 className="text-white text-4xl font-bold">Vaakya</h1>
      {step === 'phone' ? (
        <>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t('enter_phone')}
            className="w-full max-w-xs text-2xl p-4 rounded-xl bg-gray-800 text-white text-center"
          />
          <button
            onClick={handleRequestOtp}
            disabled={loading || phone.length < 10}
            className="w-full max-w-xs bg-indigo-600 text-white text-2xl font-bold py-5 rounded-2xl disabled:opacity-50"
          >
            {loading ? t('loading') : t('send_otp')}
          </button>
        </>
      ) : (
        <>
          <input
            type="number"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder={t('enter_otp')}
            className="w-full max-w-xs text-3xl p-4 rounded-xl bg-gray-800 text-white text-center tracking-widest"
          />
          <button
            onClick={handleVerify}
            disabled={loading || otp.length !== 6}
            className="w-full max-w-xs bg-green-600 text-white text-2xl font-bold py-5 rounded-2xl disabled:opacity-50"
          >
            {loading ? t('loading') : t('verify')}
          </button>
        </>
      )}
      {error && <p className="text-red-400 text-lg">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 4: Run test**

```bash
cd frontend && npx vitest run src/test/LoginScreen.test.tsx
```
Expected: 2 tests PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/worker/LoginScreen.tsx frontend/src/test/LoginScreen.test.tsx
git commit -m "feat: worker phone + OTP login screen"
```

---

## Task 7: Shared components (HoldToTalk, AudioPlayer, ChatBubble)

**Files:**
- Create: `frontend/src/components/HoldToTalk.tsx`
- Create: `frontend/src/components/AudioPlayer.tsx`
- Create: `frontend/src/components/ChatBubble.tsx`

- [ ] **Step 1: Create `frontend/src/components/HoldToTalk.tsx`**

```typescript
import { useState, useRef } from 'react'

interface Props {
  onAudioReady: (audioB64: string) => void
  disabled?: boolean
}

export default function HoldToTalk({ onAudioReady, disabled }: Props) {
  const [recording, setRecording] = useState(false)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const start = async () => {
    if (disabled) return
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream)
    chunksRef.current = []
    recorder.ondataavailable = (e) => chunksRef.current.push(e.data)
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      const reader = new FileReader()
      reader.onloadend = () => {
        const b64 = (reader.result as string).split(',')[1]
        onAudioReady(b64)
      }
      reader.readAsDataURL(blob)
      stream.getTracks().forEach((t) => t.stop())
    }
    recorder.start()
    mediaRef.current = recorder
    setRecording(true)
  }

  const stop = () => {
    mediaRef.current?.stop()
    setRecording(false)
  }

  return (
    <button
      onMouseDown={start}
      onMouseUp={stop}
      onTouchStart={start}
      onTouchEnd={stop}
      disabled={disabled}
      className={`w-36 h-36 rounded-full text-white text-lg font-bold select-none transition-all ${
        recording
          ? 'bg-red-600 scale-110 shadow-lg shadow-red-500/50'
          : 'bg-indigo-600 active:scale-105'
      } disabled:opacity-40`}
    >
      {recording ? '🔴 Recording' : '🎙️ Hold'}
    </button>
  )
}
```

- [ ] **Step 2: Create `frontend/src/components/AudioPlayer.tsx`**

```typescript
import { useRef } from 'react'

interface Props {
  audioB64: string
  format?: string
}

export default function AudioPlayer({ audioB64, format = 'wav' }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null)

  const play = () => {
    if (!audioRef.current) return
    audioRef.current.src = `data:audio/${format};base64,${audioB64}`
    audioRef.current.play()
  }

  return (
    <div>
      <audio ref={audioRef} />
      <button
        onClick={play}
        className="bg-gray-700 text-white px-4 py-2 rounded-lg text-sm"
      >
        🔊 Play
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Create `frontend/src/components/ChatBubble.tsx`**

```typescript
import AudioPlayer from './AudioPlayer'

interface Props {
  role: 'user' | 'assistant'
  contentType: 'text' | 'audio_b64'
  content: string
  transcript?: string
}

export default function ChatBubble({ role, contentType, content, transcript }: Props) {
  const isUser = role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[80%] px-4 py-3 rounded-2xl text-white text-lg ${
          isUser ? 'bg-indigo-600 rounded-br-sm' : 'bg-gray-700 rounded-bl-sm'
        }`}
      >
        {contentType === 'audio_b64' ? (
          <div className="flex flex-col gap-1">
            <AudioPlayer audioB64={content} />
            {transcript && <p className="text-sm text-gray-300 mt-1">{transcript}</p>}
          </div>
        ) : (
          <p>{content}</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/
git commit -m "feat: HoldToTalk, AudioPlayer, ChatBubble components"
```

---

## Task 8: VoiceChat screen

**Files:**
- Modify: `frontend/src/worker/VoiceChat.tsx`
- Test: `frontend/src/test/VoiceChat.test.tsx`

- [ ] **Step 1: Write failing test**

Create `frontend/src/test/VoiceChat.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import VoiceChat from '../worker/VoiceChat'

vi.mock('../api/client')
vi.mock('../components/HoldToTalk', () => ({
  default: ({ disabled }: { disabled?: boolean }) => (
    <button disabled={disabled}>HoldToTalk</button>
  ),
}))

it('renders hold to talk button', () => {
  render(<MemoryRouter><VoiceChat /></MemoryRouter>)
  expect(screen.getByText('HoldToTalk')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run to verify failure**

```bash
cd frontend && npx vitest run src/test/VoiceChat.test.tsx
```
Expected: test renders but assertion fails (stub renders "VoiceChat" not the button)

- [ ] **Step 3: Replace `frontend/src/worker/VoiceChat.tsx`**

```typescript
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import HoldToTalk from '../components/HoldToTalk'
import ChatBubble from '../components/ChatBubble'
import { createSession, speechToSpeech, getMessages } from '../api/client'
import { useDialectStore } from '../store/dialect'

interface Message {
  id: number
  role: 'user' | 'assistant'
  content_type: 'text' | 'audio_b64'
  content: string
  transcript?: string
}

export default function VoiceChat() {
  const { t } = useTranslation()
  const { dialectCode, language } = useDialectStore()
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    createSession().then((r) => {
      setSessionId(r.data.id)
    })
  }, [])

  const handleAudio = async (audioB64: string) => {
    if (!sessionId) return
    setLoading(true)
    try {
      const res = await speechToSpeech(audioB64, dialectCode, language, sessionId)
      const { audio_b64, transcript, reply_text } = res.data
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), role: 'user', content_type: 'audio_b64', content: audioB64, transcript },
        { id: Date.now() + 1, role: 'assistant', content_type: 'audio_b64', content: audio_b64, transcript: reply_text },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-950">
      <div className="flex-1 overflow-auto p-4">
        {messages.map((m) => (
          <ChatBubble key={m.id} role={m.role} contentType={m.content_type} content={m.content} transcript={m.transcript} />
        ))}
        {messages.length === 0 && (
          <p className="text-gray-500 text-center mt-16 text-lg">{t('hold_to_talk')}</p>
        )}
      </div>
      <div className="flex justify-center py-8 bg-gray-900">
        <HoldToTalk onAudioReady={handleAudio} disabled={loading || !sessionId} />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test**

```bash
cd frontend && npx vitest run src/test/VoiceChat.test.tsx
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/worker/VoiceChat.tsx frontend/src/test/VoiceChat.test.tsx
git commit -m "feat: VoiceChat screen with S2S pipeline"
```

---

## Task 9: TextChat screen

**Files:**
- Modify: `frontend/src/worker/TextChat.tsx`

- [ ] **Step 1: Replace `frontend/src/worker/TextChat.tsx`**

```typescript
import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import ChatBubble from '../components/ChatBubble'
import { createSession, sendChat } from '../api/client'
import { useDialectStore } from '../store/dialect'

interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
}

export default function TextChat() {
  const { t } = useTranslation()
  const { dialectCode } = useDialectStore()
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    createSession().then((r) => setSessionId(r.data.id))
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg = { id: Date.now(), role: 'user' as const, content: input }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)
    try {
      const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }))
      const res = await sendChat(history, dialectCode, 'You are a helpful assistant for blue-collar workers.')
      setMessages((prev) => [...prev, { id: Date.now(), role: 'assistant', content: res.data.content }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-950">
      <div className="flex-1 overflow-auto p-4">
        {messages.map((m) => (
          <ChatBubble key={m.id} role={m.role} contentType="text" content={m.content} />
        ))}
        {loading && <p className="text-gray-500 text-center text-sm">{t('loading')}</p>}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2 p-4 bg-gray-900 border-t border-gray-800">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder={t('type_message')}
          className="flex-1 bg-gray-800 text-white text-xl px-4 py-3 rounded-xl"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-xl font-bold disabled:opacity-50"
        >
          {t('send')}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/worker/TextChat.tsx
git commit -m "feat: TextChat screen with persistent history"
```

---

## Task 10: TranslateScreen + Settings

**Files:**
- Modify: `frontend/src/worker/TranslateScreen.tsx`
- Modify: `frontend/src/worker/Settings.tsx`

- [ ] **Step 1: Replace `frontend/src/worker/TranslateScreen.tsx`**

```typescript
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { translateText } from '../api/client'
import { useDialectStore } from '../store/dialect'

const LANG_OPTIONS = [
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'en', label: 'English' },
]

export default function TranslateScreen() {
  const { t } = useTranslation()
  const { language } = useDialectStore()
  const [sourceLang, setSourceLang] = useState(language)
  const [targetLang, setTargetLang] = useState('en')
  const [inputText, setInputText] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const handleTranslate = async () => {
    if (!inputText.trim()) return
    setLoading(true)
    try {
      const res = await translateText(inputText, sourceLang, targetLang)
      setResult(res.data.translated_text)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-full bg-gray-950 p-4 flex flex-col gap-4">
      <h2 className="text-white text-2xl font-bold text-center">{t('translate')}</h2>
      <div className="flex gap-2">
        <select
          value={sourceLang}
          onChange={(e) => setSourceLang(e.target.value)}
          className="flex-1 bg-gray-800 text-white p-3 rounded-xl text-lg"
        >
          {LANG_OPTIONS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>
        <span className="text-white text-2xl self-center">→</span>
        <select
          value={targetLang}
          onChange={(e) => setTargetLang(e.target.value)}
          className="flex-1 bg-gray-800 text-white p-3 rounded-xl text-lg"
        >
          {LANG_OPTIONS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>
      </div>
      <textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder={t('type_message')}
        rows={4}
        className="bg-gray-800 text-white text-xl p-4 rounded-xl"
      />
      <button
        onClick={handleTranslate}
        disabled={loading || !inputText.trim()}
        className="bg-indigo-600 text-white text-xl font-bold py-4 rounded-2xl disabled:opacity-50"
      >
        {loading ? t('loading') : t('translate')}
      </button>
      {result && (
        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-white text-xl">{result}</p>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Replace `frontend/src/worker/Settings.tsx`**

```typescript
import { useTranslation } from 'react-i18next'
import { useDialectStore } from '../store/dialect'
import i18n from '../i18n'

const DIALECTS = [
  { code: 'kn-north', label: 'ಉತ್ತರ ಕರ್ನಾಟಕ', lang: 'kn' },
  { code: 'kn-coastal', label: 'ಕರಾವಳಿ ಕನ್ನಡ', lang: 'kn' },
  { code: 'kn-bengaluru', label: 'ಬೆಂಗಳೂರು ಕನ್ನಡ', lang: 'kn' },
  { code: 'te-coastal-ap', label: 'కోస్తా ఆంధ్ర', lang: 'te' },
  { code: 'te-rayalaseema', label: 'రాయలసీమ', lang: 'te' },
  { code: 'te-north-ap', label: 'ఉత్తరాంధ్ర', lang: 'te' },
  { code: 'te-hyderabad', label: 'హైదరాబాద్', lang: 'te' },
  { code: 'te-north-tg', label: 'ఉత్తర తెలంగాణ', lang: 'te' },
  { code: 'te-south-tg', label: 'దక్షిణ తెలంగాణ', lang: 'te' },
  { code: 'ta-chennai', label: 'சென்னை தமிழ்', lang: 'ta' },
  { code: 'ta-west', label: 'மேற்கு தமிழ்', lang: 'ta' },
  { code: 'ta-south', label: 'தென் தமிழ்', lang: 'ta' },
]

export default function Settings() {
  const { t } = useTranslation()
  const { dialectCode, ttsSpeed, setDialect, setTtsSpeed } = useDialectStore()

  const handleDialectChange = (code: string) => {
    const d = DIALECTS.find((x) => x.code === code)
    if (!d) return
    setDialect(d.code, d.lang)
    localStorage.setItem('vaakya_lang', d.lang)
    i18n.changeLanguage(d.lang)
  }

  return (
    <div className="min-h-full bg-gray-950 p-6 flex flex-col gap-6">
      <h2 className="text-white text-2xl font-bold">{t('settings')}</h2>
      <div className="flex flex-col gap-2">
        <label className="text-gray-400 text-lg">{t('dialect')}</label>
        <select
          value={dialectCode}
          onChange={(e) => handleDialectChange(e.target.value)}
          className="bg-gray-800 text-white text-xl p-4 rounded-xl"
        >
          {DIALECTS.map((d) => <option key={d.code} value={d.code}>{d.label}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-gray-400 text-lg">{t('speed')}: {ttsSpeed}x</label>
        <input
          type="range"
          min={0.5}
          max={2}
          step={0.1}
          value={ttsSpeed}
          onChange={(e) => setTtsSpeed(parseFloat(e.target.value))}
          className="w-full accent-indigo-500"
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/worker/TranslateScreen.tsx frontend/src/worker/Settings.tsx
git commit -m "feat: translate screen and settings"
```

---

## Task 11: Employer dashboard

**Files:**
- Modify: `frontend/src/employer/EmployerLogin.tsx`
- Modify: `frontend/src/employer/EmployerLayout.tsx`
- Modify: `frontend/src/employer/Dashboard.tsx`
- Modify: `frontend/src/employer/WorkerList.tsx`
- Modify: `frontend/src/employer/DomainConfig.tsx`
- Modify: `frontend/src/employer/WorkerHistory.tsx`
- Test: `frontend/src/test/DomainConfig.test.tsx`

- [ ] **Step 1: Write failing test**

Create `frontend/src/test/DomainConfig.test.tsx`:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, it, expect, beforeEach } from 'vitest'
import DomainConfig from '../employer/DomainConfig'
import * as api from '../api/client'

vi.mock('../api/client')

beforeEach(() => {
  vi.mocked(api.updateDomainConfig).mockResolvedValue({ data: { system_prompt: 'new prompt' } } as any)
})

it('renders system prompt textarea', () => {
  render(<MemoryRouter><DomainConfig /></MemoryRouter>)
  expect(screen.getByRole('textbox')).toBeInTheDocument()
})

it('calls updateDomainConfig on save', async () => {
  render(<MemoryRouter><DomainConfig /></MemoryRouter>)
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'new prompt' } })
  fireEvent.click(screen.getByRole('button'))
  await waitFor(() => expect(api.updateDomainConfig).toHaveBeenCalledWith('new prompt'))
})
```

- [ ] **Step 2: Run to verify failure**

```bash
cd frontend && npx vitest run src/test/DomainConfig.test.tsx
```
Expected: test fails (stub renders "DomainConfig" not a textarea)

- [ ] **Step 3: Replace `frontend/src/employer/EmployerLogin.tsx`**

```typescript
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { requestOtp, verifyOtp, registerOrg } from '../api/client'
import { useAuthStore } from '../store/auth'

export default function EmployerLogin() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [orgName, setOrgName] = useState('')
  const [step, setStep] = useState<'phone' | 'otp' | 'org'>('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRequestOtp = async () => {
    setLoading(true)
    try { await requestOtp(phone); setStep('otp') }
    catch { setError('Failed to send OTP') }
    finally { setLoading(false) }
  }

  const handleVerify = async () => {
    setLoading(true)
    try {
      const res = await verifyOtp(phone, otp, 'employer')
      login(res.data.access_token, 'employer', phone)
      setStep('org')
    } catch { setError('Invalid OTP') }
    finally { setLoading(false) }
  }

  const handleOrgSetup = async () => {
    setLoading(true)
    try {
      await registerOrg(orgName, 'You are a helpful assistant for workers.')
      navigate('/employer')
    } catch { setError('Failed to register org') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-8 gap-6">
      <h1 className="text-white text-3xl font-bold">Vaakya — Employer</h1>
      {step === 'phone' && (
        <>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number" className="w-full max-w-sm text-xl p-4 rounded-xl bg-gray-800 text-white text-center" />
          <button onClick={handleRequestOtp} disabled={loading}
            className="w-full max-w-sm bg-indigo-600 text-white text-xl font-bold py-4 rounded-2xl disabled:opacity-50">
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </>
      )}
      {step === 'otp' && (
        <>
          <input type="number" value={otp} onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter OTP" className="w-full max-w-sm text-2xl p-4 rounded-xl bg-gray-800 text-white text-center tracking-widest" />
          <button onClick={handleVerify} disabled={loading || otp.length !== 6}
            className="w-full max-w-sm bg-green-600 text-white text-xl font-bold py-4 rounded-2xl disabled:opacity-50">
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </>
      )}
      {step === 'org' && (
        <>
          <input value={orgName} onChange={(e) => setOrgName(e.target.value)}
            placeholder="Organisation name" className="w-full max-w-sm text-xl p-4 rounded-xl bg-gray-800 text-white" />
          <button onClick={handleOrgSetup} disabled={loading || !orgName.trim()}
            className="w-full max-w-sm bg-indigo-600 text-white text-xl font-bold py-4 rounded-2xl disabled:opacity-50">
            {loading ? 'Setting up...' : 'Continue'}
          </button>
        </>
      )}
      {error && <p className="text-red-400">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 4: Replace `frontend/src/employer/EmployerLayout.tsx`**

```typescript
import { Outlet, NavLink } from 'react-router-dom'
import { useAuthStore } from '../store/auth'

export default function EmployerLayout() {
  const logout = useAuthStore((s) => s.logout)
  return (
    <div className="flex h-screen bg-gray-950">
      <aside className="w-56 bg-gray-900 flex flex-col p-4 gap-2">
        <h2 className="text-white text-xl font-bold mb-4">Vaakya</h2>
        {[
          { to: '/employer', label: '📊 Dashboard' },
          { to: '/employer/workers', label: '👷 Workers' },
          { to: '/employer/config', label: '⚙️ Domain Config' },
        ].map((link) => (
          <NavLink key={link.to} to={link.to} end
            className={({ isActive }) =>
              `px-3 py-2 rounded-lg text-sm font-medium ${isActive ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`
            }>
            {link.label}
          </NavLink>
        ))}
        <button onClick={logout} className="mt-auto text-gray-500 hover:text-white text-sm text-left px-3">
          Logout
        </button>
      </aside>
      <main className="flex-1 overflow-auto p-6"><Outlet /></main>
    </div>
  )
}
```

- [ ] **Step 5: Replace `frontend/src/employer/Dashboard.tsx`**

```typescript
export default function Dashboard() {
  return (
    <div>
      <h1 className="text-white text-3xl font-bold mb-4">Dashboard</h1>
      <p className="text-gray-400">Worker activity and usage stats coming soon.</p>
    </div>
  )
}
```

- [ ] **Step 6: Replace `frontend/src/employer/WorkerList.tsx`**

```typescript
import { useEffect, useState } from 'react'
import { listWorkers } from '../api/client'

interface Worker { id: number; phone: string; display_name: string; dialect_code: string }

export default function WorkerList() {
  const [workers, setWorkers] = useState<Worker[]>([])

  useEffect(() => {
    listWorkers().then((r) => setWorkers(r.data))
  }, [])

  return (
    <div>
      <h1 className="text-white text-3xl font-bold mb-6">Workers</h1>
      {workers.length === 0
        ? <p className="text-gray-500">No workers added yet.</p>
        : (
          <table className="w-full text-left text-gray-300">
            <thead><tr className="border-b border-gray-700">
              <th className="pb-2">Phone</th><th className="pb-2">Name</th><th className="pb-2">Dialect</th>
            </tr></thead>
            <tbody>
              {workers.map((w) => (
                <tr key={w.id} className="border-b border-gray-800">
                  <td className="py-3">{w.phone}</td>
                  <td>{w.display_name}</td>
                  <td>{w.dialect_code}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
    </div>
  )
}
```

- [ ] **Step 7: Replace `frontend/src/employer/DomainConfig.tsx`**

```typescript
import { useState } from 'react'
import { updateDomainConfig } from '../api/client'

export default function DomainConfig() {
  const [prompt, setPrompt] = useState('')
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  const save = async () => {
    setLoading(true)
    setSaved(false)
    try {
      await updateDomainConfig(prompt)
      setSaved(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-white text-3xl font-bold mb-2">Domain Config</h1>
      <p className="text-gray-400 mb-6">
        Define what your assistant knows. This becomes the system prompt for all worker conversations.
      </p>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={10}
        placeholder="e.g. You are a quick-commerce assistant for delivery workers. Answer questions about shift timings, delivery zones, and escalation procedures."
        className="w-full bg-gray-800 text-white text-lg p-4 rounded-xl mb-4 resize-none"
      />
      <button
        onClick={save}
        disabled={loading || !prompt.trim()}
        className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Save'}
      </button>
      {saved && <p className="text-green-400 mt-3">Saved successfully.</p>}
    </div>
  )
}
```

- [ ] **Step 8: Replace `frontend/src/employer/WorkerHistory.tsx`**

```typescript
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getMessages } from '../api/client'
import ChatBubble from '../components/ChatBubble'

interface Message { id: number; role: 'user' | 'assistant'; content_type: 'text' | 'audio_b64'; content: string; transcript?: string }

export default function WorkerHistory() {
  const { id } = useParams()
  const [messages, setMessages] = useState<Message[]>([])

  useEffect(() => {
    if (id) getMessages(parseInt(id)).then((r) => setMessages(r.data))
  }, [id])

  return (
    <div>
      <h1 className="text-white text-3xl font-bold mb-6">Chat History</h1>
      <div className="max-w-2xl">
        {messages.map((m) => (
          <ChatBubble key={m.id} role={m.role} contentType={m.content_type} content={m.content} transcript={m.transcript} />
        ))}
        {messages.length === 0 && <p className="text-gray-500">No messages yet.</p>}
      </div>
    </div>
  )
}
```

- [ ] **Step 9: Run DomainConfig test**

```bash
cd frontend && npx vitest run src/test/DomainConfig.test.tsx
```
Expected: 2 tests PASS

- [ ] **Step 10: Commit**

```bash
git add frontend/src/employer/
git commit -m "feat: employer login, layout, dashboard, worker list, domain config, history"
```

---

## Task 12: Frontend Dockerfile + full build verify + push

**Files:**
- Create: `frontend/Dockerfile`

- [ ] **Step 1: Create `frontend/Dockerfile`**

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

- [ ] **Step 2: Create `frontend/nginx.conf`**

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:8000;
    }

    location /auth {
        proxy_pass http://backend:8000;
    }

    location /employer {
        proxy_pass http://backend:8000;
    }
}
```

- [ ] **Step 3: Run all frontend tests**

```bash
cd frontend && npx vitest run
```
Expected: All tests PASS

- [ ] **Step 4: Run build**

```bash
cd frontend && npm run build
```
Expected: Build succeeds, `dist/` created

- [ ] **Step 5: Update `.github/workflows/ci.yml` to add frontend job**

Add to the existing `ci.yml` (append after `backend-docker` job):

```yaml
  frontend-test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend

    steps:
      - uses: actions/checkout@v4

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npx vitest run

      - name: Build
        run: npm run build

  frontend-docker:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build frontend Docker image
        run: docker build ./frontend -t vaakya-frontend:ci
```

- [ ] **Step 6: Commit and push**

```bash
cd /Users/nithingowda/vaakya
git add frontend/Dockerfile frontend/nginx.conf .github/workflows/ci.yml
git commit -m "ci: frontend Docker build and Vitest CI jobs"
git push origin main
```

- [ ] **Step 7: Verify CI passes**

Open https://github.com/amateur-ai-dev/bembala-v2/actions — confirm all 4 CI jobs pass.
