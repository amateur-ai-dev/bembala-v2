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

export const requestOtp = (phone: string) =>
  apiClient.post('/auth/request-otp', { phone })

export const verifyOtp = (phone: string, otp: string, role: string) =>
  apiClient.post('/auth/verify-otp', { phone, otp, role })

export const speechToText = (audio_b64: string, dialect_code: string, language: string) =>
  apiClient.post('/api/stt', { audio_b64, dialect_code, language })

export const textToSpeech = (text: string, dialect_code: string, language: string) =>
  apiClient.post('/api/tts', { text, dialect_code, language })

export const sendChat = (
  messages: { role: string; content: string }[],
  dialect_code: string,
  domain_prompt: string
) => apiClient.post('/api/chat', { messages, dialect_code, domain_prompt })

export const translateText = (text: string, source_lang: string, target_lang: string) =>
  apiClient.post('/api/translate', { text, source_lang, target_lang })

export const speechToSpeech = (
  audio_b64: string,
  dialect_code: string,
  language: string,
  session_id: number
) => apiClient.post('/api/s2s', { audio_b64, dialect_code, language, session_id })

export const createSession = () => apiClient.post('/api/sessions', {})

export const getMessages = (sessionId: number) =>
  apiClient.get(`/api/sessions/${sessionId}/messages`)

export const registerOrg = (org_name: string, system_prompt: string) =>
  apiClient.post('/employer/register', { org_name, system_prompt })

export const updateDomainConfig = (system_prompt: string) =>
  apiClient.put('/employer/config', { system_prompt })

export const listWorkers = () => apiClient.get('/employer/workers')
