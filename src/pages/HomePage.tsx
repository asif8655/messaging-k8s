import { ArrowRight, MessageSquareMore, ShieldCheck, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Navbar } from '../components/layout/Navbar'
import { useAuth } from '../context/AuthContext'

export const HomePage = () => {
  const { isAuthenticated } = useAuth()

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex flex-1 items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[36px] border border-white/70 bg-[radial-gradient(circle_at_top_left,_rgba(45,109,246,0.18),_transparent_38%),linear-gradient(140deg,rgba(255,255,255,0.97),rgba(245,238,230,0.94))] p-8 shadow-panel backdrop-blur sm:p-10 lg:p-12">
            <div className="inline-flex items-center gap-3 rounded-full border border-sky-200 bg-white/90 px-4 py-2 text-sm font-medium text-sky-700">
              <MessageSquareMore className="h-4 w-4" />
              Direct messaging workspace
            </div>
            <h1 className="mt-6 max-w-3xl font-[family-name:var(--font-display)] text-4xl leading-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Chat, verify, and reconnect from one clean inbox.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              This frontend already includes registration, login, email verification, protected
              chat routes, and realtime messaging hooks. The home page now exposes those entry
              points instead of dropping you into a blank-looking redirect flow.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to={isAuthenticated ? '/chat' : '/login'}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                {isAuthenticated ? 'Open chat' : 'Log in'}
                <ArrowRight className="h-4 w-4" />
              </Link>
              {!isAuthenticated ? (
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                >
                  Create account
                </Link>
              ) : null}
            </div>
          </section>

          <section className="grid gap-4">
            <div className="rounded-[32px] border border-white/70 bg-white/88 p-7 shadow-panel backdrop-blur sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                What is here
              </p>
              <div className="mt-6 space-y-4">
                <div className="rounded-3xl border border-slate-200/80 bg-slate-50 p-5">
                  <div className="flex items-center gap-3">
                    <span className="rounded-2xl bg-sky-100 p-2 text-sky-700">
                      <Zap className="h-4 w-4" />
                    </span>
                    <p className="font-semibold text-slate-900">Realtime inbox</p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    One-to-one chat runs through the protected `/chat` route with websocket-backed
                    message delivery.
                  </p>
                </div>
                <div className="rounded-3xl border border-slate-200/80 bg-slate-50 p-5">
                  <div className="flex items-center gap-3">
                    <span className="rounded-2xl bg-emerald-100 p-2 text-emerald-700">
                      <ShieldCheck className="h-4 w-4" />
                    </span>
                    <p className="font-semibold text-slate-900">JWT auth flow</p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Register, verify email, sign in, and keep the local session active between
                    reloads.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-white/70 bg-slate-900 p-7 text-white shadow-panel sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-300">
                Local setup
              </p>
              <p className="mt-4 text-2xl font-semibold">Frontend on `localhost:3000`</p>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                API requests are configured for `http://localhost:9000/api` and websockets for
                `http://localhost:9000/ws` from the current `.env`.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
