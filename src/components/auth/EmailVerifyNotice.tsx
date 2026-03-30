import { MailCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

interface EmailVerifyNoticeProps {
  email?: string
}

export const EmailVerifyNotice = ({ email }: EmailVerifyNoticeProps) => (
  <div className="animate-fade-in rounded-[28px] border border-emerald-200 bg-white/90 p-8 text-left shadow-panel backdrop-blur">
    <div className="mb-5 inline-flex rounded-2xl bg-emerald-100 p-3 text-emerald-700">
      <MailCheck className="h-6 w-6" />
    </div>
    <h2 className="text-2xl font-semibold text-slate-900">Check your inbox</h2>
    <p className="mt-3 text-sm leading-6 text-slate-600">
      Check your email for a verification link before logging in.
      {email ? ` We sent the link to ${email}.` : ''}
    </p>
    <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
      <Link
        to="/login"
        className="rounded-full bg-slate-900 px-4 py-2 font-medium text-white transition hover:bg-slate-800"
      >
        Go to login
      </Link>
      <Link
        to="/register"
        className="rounded-full border border-slate-200 px-4 py-2 font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
      >
        Register another account
      </Link>
    </div>
  </div>
)

