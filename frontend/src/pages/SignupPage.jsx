import { useState } from 'react'
import { useSignUp } from '@clerk/clerk-react'
import { Link, useNavigate } from 'react-router-dom'
import { MessageCircle, Loader2 } from 'lucide-react'

const inputClass =
  'w-full rounded-lg bg-slate-700 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500'
const labelClass = 'mb-1 block text-sm font-medium text-slate-300'

function SignupPage() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const navigate = useNavigate()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const getError = (err) =>
    err.errors?.[0]?.longMessage || 'Something went wrong. Please try again.'

  // Screen 1: create the account and send the code to the email
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isLoaded) return

    setError('')
    setLoading(true)

    try {
      await signUp.create({
        firstName,
        lastName,
        emailAddress: email,
        password,
      })
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setVerifying(true)
    } catch (err) {
      setError(getError(err))
    } finally {
      setLoading(false)
    }
  }

  // Screen 2: check the code, then sign the user in
  const handleVerify = async (e) => {
    e.preventDefault()
    if (!isLoaded) return

    setError('')
    setLoading(true)

    try {
      const result = await signUp.attemptEmailAddressVerification({ code })

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        navigate('/')
      } else {
        setError('Could not finish sign up. Please try again.')
      }
    } catch (err) {
      setError(getError(err))
    } finally {
      setLoading(false)
    }
  }

  const resendCode = async () => {
    setError('')
    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
    } catch (err) {
      setError(getError(err))
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4 text-white">
      <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-800 p-8 shadow-xl">
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-3 flex items-center gap-2">
            <MessageCircle className="text-emerald-400" size={32} />
            <span className="text-2xl font-bold">ChatTime</span>
          </div>
          <h1 className="text-lg font-semibold">
            {verifying ? 'Check your email' : 'Create your account'}
          </h1>
          <p className="text-center text-sm text-slate-400">
            {verifying
              ? `We sent a 6-digit code to ${email}`
              : 'Sign up to start chatting'}
          </p>
        </div>

        {!verifying ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className={labelClass}>First name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Snoopy"
                  required
                  className={inputClass}
                />
              </div>
              <div className="flex-1">
                <label className={labelClass}>Last name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Optional"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                className={inputClass}
              />
            </div>

            {/* Needed by Clerk's bot protection on custom sign-up forms */}
            <div id="clerk-captcha" />

            {error && (
              <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !isLoaded}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
            >
              {loading && <Loader2 className="animate-spin" size={16} />}
              {loading ? 'Creating account...' : 'Sign up'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className={labelClass}>Verification code</label>
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                maxLength={6}
                required
                autoFocus
                className={`${inputClass} text-center text-lg tracking-widest`}
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !isLoaded}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
            >
              {loading && <Loader2 className="animate-spin" size={16} />}
              {loading ? 'Verifying...' : 'Verify email'}
            </button>

            <div className="flex justify-between text-sm">
              <button
                type="button"
                onClick={resendCode}
                className="text-emerald-400 hover:underline"
              >
                Resend code
              </button>
              <button
                type="button"
                onClick={() => {
                  setVerifying(false)
                  setCode('')
                  setError('')
                }}
                className="text-slate-400 hover:underline"
              >
                Change email
              </button>
            </div>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-emerald-400 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default SignupPage