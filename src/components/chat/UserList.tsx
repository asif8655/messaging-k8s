import { RefreshCcw, Search, ShieldCheck } from 'lucide-react'
import { useDeferredValue, useState } from 'react'

import type { User } from '../../types'
import { UnreadBadge } from './UnreadBadge'

interface UserListProps {
  users: User[]
  activeUser: User | null
  unreadCounts: Map<string, number>
  isLoading: boolean
  error: string | null
  onSelectUser: (user: User) => void
  onRetry: () => void
}

export const UserList = ({
  users,
  activeUser,
  unreadCounts,
  isLoading,
  error,
  onSelectUser,
  onRetry,
}: UserListProps) => {
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)

  const filteredUsers = users.filter((user) => {
    const query = deferredSearch.trim().toLowerCase()

    if (!query) {
      return true
    }

    return (
      user.fullName.toLowerCase().includes(query) || user.email.toLowerCase().includes(query)
    )
  })

  return (
    <aside className="flex h-full w-full flex-col border-r border-slate-200 bg-gray-50 sm:w-80">
      <div className="border-b border-slate-200 px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Conversations
            </p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">People</h2>
          </div>
          <button
            type="button"
            onClick={onRetry}
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
            aria-label="Refresh users"
          >
            <RefreshCcw className="h-4 w-4" />
          </button>
        </div>
        <label className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-500 focus-within:border-sky-500 focus-within:ring-4 focus-within:ring-sky-100">
          <Search className="h-4 w-4" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or email"
            className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
          />
        </label>
      </div>

      {error ? (
        <div className="m-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="app-scrollbar min-h-0 flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="animate-pulse rounded-3xl bg-white p-4 shadow-sm">
                <div className="h-4 w-1/2 rounded-full bg-slate-200" />
                <div className="mt-3 h-3 w-3/4 rounded-full bg-slate-100" />
              </div>
            ))}
          </div>
        ) : null}

        {!isLoading && users.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-6 text-center text-sm leading-6 text-slate-500">
            No users available yet. Register another account in your backend to start a conversation.
          </div>
        ) : null}

        {!isLoading && users.length > 0 && filteredUsers.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-6 text-center text-sm leading-6 text-slate-500">
            No matches for “{search}”. Try a name or email address.
          </div>
        ) : null}

        {!isLoading && filteredUsers.length > 0 ? (
          <ul className="space-y-2">
            {filteredUsers.map((user) => {
              const isActive = activeUser?.id === user.id
              const unreadCount = unreadCounts.get(user.id) ?? 0

              return (
                <li key={user.id}>
                  <button
                    type="button"
                    onClick={() => onSelectUser(user)}
                    className={`w-full rounded-3xl border px-4 py-3 text-left transition ${
                      isActive
                        ? 'border-sky-200 bg-sky-50 shadow-sm'
                        : 'border-transparent bg-white hover:border-slate-200 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {user.fullName}
                          </p>
                          {user.isVerified ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                              <ShieldCheck className="h-3 w-3" />
                              Verified
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 truncate text-xs text-slate-500">{user.email}</p>
                      </div>
                      <UnreadBadge count={unreadCount} />
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        ) : null}
      </div>
    </aside>
  )
}

