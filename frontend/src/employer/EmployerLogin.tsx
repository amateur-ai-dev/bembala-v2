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
    setError('')
    try { await requestOtp(phone); setStep('otp') }
    catch { setError('Failed to send OTP') }
    finally { setLoading(false) }
  }

  const handleVerify = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await verifyOtp(phone, otp, 'employer')
      login(res.data.access_token, 'employer', phone)
      setStep('org')
    } catch { setError('Invalid OTP') }
    finally { setLoading(false) }
  }

  const handleOrgSetup = async () => {
    setLoading(true)
    setError('')
    try {
      await registerOrg(orgName, 'You are a helpful assistant for workers.')
      navigate('/employer')
    } catch { setError('Failed to register org') }
    finally { setLoading(false) }
  }

  const STEPS = ['phone', 'otp', 'org']
  const stepIndex = STEPS.indexOf(step)

  return (
    <div className="min-h-screen bg-app flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-2xl bg-brand-600 flex items-center justify-center">
            <span className="text-white text-xl font-bold">V</span>
          </div>
          <div>
            <p className="text-app font-bold text-lg leading-none">Vaakya</p>
            <p className="text-muted text-xs">Employer portal</p>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex gap-1.5 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className={`h-1 rounded-full transition-all ${
              i <= stepIndex ? 'bg-brand-600 flex-1' : 'bg-app flex-1'
            }`} />
          ))}
        </div>

        {step === 'phone' && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-app text-2xl font-bold">Sign in</h2>
              <p className="text-muted text-sm mt-1">Enter your phone number to continue</p>
            </div>
            <div className="flex items-center gap-3 bg-surface border border-app rounded-2xl px-4 py-4">
              <span className="text-muted font-medium">+91</span>
              <div className="w-px h-5 bg-app" />
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="9876543210"
                className="flex-1 bg-transparent text-app text-base outline-none placeholder:text-muted"
              />
            </div>
            <button
              onClick={handleRequestOtp}
              disabled={loading || phone.length < 10}
              className="w-full bg-brand-600 text-white font-semibold py-4 rounded-2xl disabled:opacity-40"
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </div>
        )}

        {step === 'otp' && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-app text-2xl font-bold">Enter OTP</h2>
              <p className="text-muted text-sm mt-1">Sent to +91 {phone}</p>
            </div>
            <div className="flex gap-2 justify-center">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={`w-11 h-13 flex items-center justify-center rounded-xl border-2 text-app text-xl font-bold ${
                  otp.length === i ? 'border-brand-600' : otp.length > i ? 'border-brand-600/40' : 'border-app'
                } bg-surface`}>
                  {otp[i] || ''}
                </div>
              ))}
            </div>
            <input
              type="tel"
              inputMode="numeric"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="sr-only"
              autoFocus
            />
            <button
              onClick={handleVerify}
              disabled={loading || otp.length !== 6}
              className="w-full bg-brand-600 text-white font-semibold py-4 rounded-2xl disabled:opacity-40"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        )}

        {step === 'org' && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-app text-2xl font-bold">Your organisation</h2>
              <p className="text-muted text-sm mt-1">What's the name of your business?</p>
            </div>
            <input
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="e.g. Swiggy Instamart Koramangala"
              className="w-full bg-surface border border-app text-app text-base px-4 py-4 rounded-2xl outline-none focus:border-brand-600 transition-colors placeholder:text-muted"
            />
            <button
              onClick={handleOrgSetup}
              disabled={loading || !orgName.trim()}
              className="w-full bg-brand-600 text-white font-semibold py-4 rounded-2xl disabled:opacity-40"
            >
              {loading ? 'Setting up...' : 'Continue'}
            </button>
          </div>
        )}

        {error && <p className="text-red-500 text-sm text-center mt-4">{error}</p>}
      </div>
    </div>
  )
}
