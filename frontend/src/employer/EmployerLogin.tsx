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
