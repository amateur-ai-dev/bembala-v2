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
