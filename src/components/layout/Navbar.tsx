import { LogOut, MessageSquareMore } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'

const publicLinkClass = ({ isActive }: { isActive: boolean }): string =>
  `rounded-full px-4 py-2 text-sm font-medium transition ${
    isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
  }`

export const Navbar = () => {
  const { isAuthenticated, logout, user } = useAuth()

  return (
    <header className="border-b border-white/60 bg-white/45 px-4 py-4 backdrop-blur sm:px-6">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
        <Link to={isAuthenticated ? '/chat' : '/login'} className="flex items-center gap-3">
          <span className="rounded-2xl bg-slate-900 p-2 text-white shadow-sm">
            <MessageSquareMore className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Messaging App
            </p>
            <p className="text-sm text-slate-900">One-to-one inbox</p>
          </div>
        </Link>

        {isAuthenticated ? (
          <div className="flex items-center gap-3">
            <div className="hidden rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-right sm:block">
              <p className="text-sm font-semibold text-slate-900">{user?.fullName ?? 'Signed in'}</p>
              <p className="text-xs text-slate-500">{user?.email ?? 'JWT session active'}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        ) : (
          <nav className="flex items-center gap-2">
            <NavLink to="/login" className={publicLinkClass}>
              Login
            </NavLink>
            <NavLink to="/register" className={publicLinkClass}>
              Register
            </NavLink>
          </nav>
        )}
      </div>
    </header>
  )
}

