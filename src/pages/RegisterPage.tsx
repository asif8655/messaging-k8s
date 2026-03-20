import { MessageSquareMore } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { EmailVerifyNotice } from '../components/auth/EmailVerifyNotice'
import { RegisterForm } from '../components/auth/RegisterForm'
import { Navbar } from '../components/layout/Navbar'

export const RegisterPage = () => {
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null)

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Navbar />
      <main className="flex flex-1 items-center justify-center overflow-y-auto px-4 py-8 sm:px-6">
        <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[32px] border border-white/60 bg-[radial-gradient(circle_at_top_left,_rgba(45,109,246,0.2),_transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.96),rgba(246,241,235,0.92))] p-8 shadow-panel backdrop-blur sm:p-10">
            <div className="inline-flex rounded-2xl bg-sky-100 p-3 text-sky-700">
              <MessageSquareMore className="h-6 w-6" />
            </div>
            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.28em] text-sky-600">
              Private conversations
            </p>
            <h1 className="mt-4 max-w-md font-[family-name:var(--font-display)] text-4xl leading-tight text-slate-900 sm:text-5xl">
              Build your direct line before the first message lands.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
              Register a verified account, connect to your Spring backend, and land in a realtime
              split-pane inbox designed for focused one-to-one messaging.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-5">
                <p className="text-sm font-semibold text-slate-900">Realtime delivery</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  STOMP over SockJS keeps incoming conversations moving without page refreshes.
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-5">
                <p className="text-sm font-semibold text-slate-900">Simple auth flow</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Register, verify, sign in, and persist your JWT locally for protected chat routes.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[32px] border border-white/70 bg-white/88 p-8 shadow-panel backdrop-blur sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
              Create account
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-900">
              {registeredEmail ? 'Verify your email' : 'Start messaging'}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {registeredEmail
                ? 'Your account is ready. One more step unlocks the chat workspace.'
                : 'Use your work or personal email. Passwords must be at least 8 characters.'}
            </p>

            <div className="mt-8">
              {registeredEmail ? (
                <EmailVerifyNotice email={registeredEmail} />
              ) : (
                <>
                  <RegisterForm onSuccess={setRegisteredEmail} />
                  <p className="mt-6 text-sm text-slate-600">
                    Already have an account?{' '}
                    <Link to="/login" className="font-semibold text-sky-700 hover:text-sky-800">
                      Log in
                    </Link>
                  </p>
                </>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

