import { LogOut, MessageSquareMore, Radio } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'

interface NavbarProps {
  onStreamClick?: () => void
  onEndStream?: () => void
  isStreaming?: boolean
  hasActiveStream?: boolean
}

const publicLinkClass = ({ isActive }: { isActive: boolean }): string =>
  `rounded-full px-4 py-2 text-sm font-medium transition ${
    isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
  }`

export const Navbar = ({
  onStreamClick,
  onEndStream,
  isStreaming = false,
  hasActiveStream = false,
}: NavbarProps = {}) => {
  const { isAuthenticated, logout, user } = useAuth()

  return (
    <header className="border-b border-white/60 bg-white/45 px-4 py-3 backdrop-blur sm:px-6 sm:py-4">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 sm:gap-4">
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
          <div className="flex flex-1 flex-wrap items-center justify-end gap-2 sm:flex-none sm:gap-3">
            {(hasActiveStream || isStreaming) && (
              <div className="hidden items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 md:flex">
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                <span className="text-xs font-semibold text-red-600">
                  {isStreaming ? 'You are LIVE' : 'Stream LIVE'}
                </span>
              </div>
            )}

            <div className="hidden rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-right lg:block">
              <p className="text-sm font-semibold text-slate-900">{user?.fullName ?? 'Signed in'}</p>
              <p className="text-xs text-slate-500">{user?.email ?? 'JWT session active'}</p>
            </div>

            {isStreaming ? (
              <button
                type="button"
                onClick={onEndStream}
                className="inline-flex items-center gap-2 rounded-full border border-red-600 bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700 sm:px-4"
              >
                <Radio className="h-4 w-4 animate-pulse" />
                <span>End</span>
                <span className="hidden sm:inline">Stream</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onStreamClick}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 sm:px-4"
              >
                <Radio className="h-4 w-4" />
                <span>{user?.isSuperUser ? 'Go' : 'Watch'}</span>
                <span className="hidden sm:inline">Live</span>
              </button>
            )}

            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900 sm:px-4"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
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
