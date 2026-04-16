import { useState, useEffect } from 'react'
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

  useEffect(() => {
    if (!localStorage.getItem('vaakya_lang')) navigate('/', { replace: true })
  }, [])

  const handleRequestOtp = async () => {
    setLoading(true)
    setError('')
    try {
      await requestOtp(phone)
      setStep('otp')
    } catch {
      setError(t('otp_send_failed'))
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
      setError(t('otp_invalid'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-app flex flex-col">
      {/* Back */}
      {step === 'otp' && (
        <button
          onClick={() => setStep('phone')}
          className="absolute top-12 left-5 text-muted p-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      <div className="flex-1 flex flex-col justify-center px-6 gap-8">
        {/* Logo */}
        <div>
          <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center mb-5">
            <span className="text-white text-2xl font-bold">V</span>
          </div>
          <h1 className="text-app text-3xl font-bold">
            {step === 'phone' ? t('welcome') : 'OTP'}
          </h1>
          <p className="text-muted text-base mt-1">
            {step === 'phone' ? t('enter_phone') : t('otp_sent', { phone })}
          </p>
        </div>

        {step === 'phone' ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 bg-surface border border-app rounded-2xl px-4 py-4">
              <span className="text-muted font-medium text-lg">+91</span>
              <div className="w-px h-6 bg-app" />
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="9876543210"
                className="flex-1 bg-transparent text-app text-xl font-medium outline-none placeholder:text-muted"
              />
            </div>
            <button
              onClick={handleRequestOtp}
              disabled={loading || phone.length < 10}
              className="w-full bg-brand-600 text-white text-lg font-semibold py-4 rounded-2xl disabled:opacity-40 active:scale-[0.98] transition-transform"
            >
              {loading ? t('loading') : t('send_otp')}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* 6-box OTP input */}
            <div className="flex gap-2 justify-center">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-12 h-14 flex items-center justify-center rounded-xl border-2 text-app text-2xl font-bold transition-colors ${
                    otp.length === i
                      ? 'border-brand-600 bg-surface'
                      : otp.length > i
                      ? 'border-brand-600/40 bg-surface'
                      : 'border-app bg-surface'
                  }`}
                >
                  {otp[i] || ''}
                </div>
              ))}
            </div>
            {/* Hidden real input */}
            <input
              type="tel"
              inputMode="numeric"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="sr-only"
              autoFocus
            />
            <p className="text-center text-muted text-sm -mt-2">
              {t('otp_tap_hint')}
            </p>
            <button
              onClick={handleVerify}
              disabled={loading || otp.length !== 6}
              className="w-full bg-brand-600 text-white text-lg font-semibold py-4 rounded-2xl disabled:opacity-40 active:scale-[0.98] transition-transform"
            >
              {loading ? t('loading') : t('verify')}
            </button>
          </div>
        )}

        {error && (
          <p className="text-red-500 text-base text-center -mt-4">{error}</p>
        )}
      </div>

      <p className="text-center text-muted text-xs pb-8 px-6">
        Vaakya · ಕನ್ನಡ · తెలుగు · தமிழ்
      </p>
    </div>
  )
}
