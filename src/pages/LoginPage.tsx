import { Sparkles } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { LoginForm } from '../components/auth/LoginForm'
import { Navbar } from '../components/layout/Navbar'
import { useAuth } from '../context/AuthContext'

export const LoginPage = () => {
  const navigate = useNavigate()
  const { login } = useAuth()

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Navbar />
      <main className="flex flex-1 items-center justify-center overflow-y-auto px-4 py-8 sm:px-6">
        <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-[32px] border border-white/70 bg-white/88 p-8 shadow-panel backdrop-blur sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
              Welcome back
            </p>
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl leading-tight text-slate-900 sm:text-5xl">
              Pick up the conversation where you left it.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-600">
              Sign in with your verified email to reconnect the JWT session, restore your chat list,
              and rejoin the realtime message queue.
            </p>
            <div className="mt-8 rounded-3xl border border-slate-200/80 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
              <div className="flex items-center gap-3 text-slate-900">
                <span className="rounded-2xl bg-sky-100 p-2 text-sky-700">
                  <Sparkles className="h-4 w-4" />
                </span>
                <span className="font-semibold">This client expects your backend at the configured Vite env URLs.</span>
              </div>
              <p className="mt-3">
                Update <code>.env</code> and <code>.env.production</code> when you point the frontend to local or Azure-hosted services.
              </p>
            </div>
          </section>

          <section className="rounded-[32px] border border-white/70 bg-white/88 p-8 shadow-panel backdrop-blur sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
              Sign in
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-900">Access your inbox</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              If your backend returns a 403 with an email-verification message, the resend action is
              available directly in the form.
            </p>

            <div className="mt-8">
              <LoginForm
                onSuccess={(token, user) => {
                  login(token, user)
                  navigate('/chat', { replace: true })
                }}
              />
              <p className="mt-6 text-sm text-slate-600">
                Need an account?{' '}
                <Link to="/register" className="font-semibold text-sky-700 hover:text-sky-800">
                  Register here
                </Link>
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

