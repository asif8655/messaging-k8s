import { CheckCircle2, LoaderCircle, TriangleAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { getApiErrorMessage, verifyEmail } from '../api/authApi'
import { Navbar } from '../components/layout/Navbar'

type VerificationStatus = 'loading' | 'success' | 'error'

export const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<VerificationStatus>(token ? 'loading' : 'error')
  const [message, setMessage] = useState(
    token ? 'Validating your email verification link...' : 'Invalid or expired link',
  )

  useEffect(() => {
    if (!token) {
      return
    }

    const runVerification = async () => {
      try {
        await verifyEmail(token)
        setStatus('success')
        setMessage('Email verified! You can now log in.')
      } catch (error) {
        setStatus('error')
        setMessage(getApiErrorMessage(error, 'Invalid or expired link'))
      }
    }

    void runVerification()
  }, [token])

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
        <section className="w-full max-w-xl rounded-[32px] border border-white/70 bg-white/90 p-8 text-center shadow-panel backdrop-blur sm:p-10">
          <div className="mx-auto inline-flex rounded-3xl p-4 text-white shadow-lg">
            {status === 'loading' ? (
              <span className="rounded-3xl bg-slate-900 p-3">
                <LoaderCircle className="h-8 w-8 animate-spin" />
              </span>
            ) : null}
            {status === 'success' ? (
              <span className="rounded-3xl bg-emerald-500 p-3">
                <CheckCircle2 className="h-8 w-8" />
              </span>
            ) : null}
            {status === 'error' ? (
              <span className="rounded-3xl bg-rose-500 p-3">
                <TriangleAlert className="h-8 w-8" />
              </span>
            ) : null}
          </div>
          <h1 className="mt-6 font-[family-name:var(--font-display)] text-4xl text-slate-900">
            Verify email
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600">{message}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm">
            <Link
              to="/login"
              className="rounded-full bg-slate-900 px-5 py-3 font-medium text-white transition hover:bg-slate-800"
            >
              Go to login
            </Link>
            <Link
              to="/register"
              className="rounded-full border border-slate-200 px-5 py-3 font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
            >
              Back to register
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
