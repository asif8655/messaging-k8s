import { MoreVertical, RefreshCcw, Search, ShieldCheck, Trash2, UserX } from 'lucide-react'
import { useDeferredValue, useState } from 'react'

import type { User } from '../../types'
import { ConfirmDialog } from '../common/ConfirmDialog'
import { UnreadBadge } from './UnreadBadge'

interface UserListProps {
  users: User[]
  activeUser: User | null
  currentUser: User | null
  unreadCounts: Map<string, number>
  isLoading: boolean
  error: string | null
  onSelectUser: (user: User) => void
  onRetry: () => void
  onDeleteUser: (userId: string) => void
}

export const UserList = ({
  users,
  activeUser,
  currentUser,
  unreadCounts,
  isLoading,
  error,
  onSelectUser,
  onRetry,
  onDeleteUser,
}: UserListProps) => {
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [pendingDeleteUser, setPendingDeleteUser] = useState<User | null>(null)
  const [menuUserId, setMenuUserId] = useState<string | null>(null)

  const filteredUsers = users.filter((user) => {
    const query = deferredSearch.trim().toLowerCase()

    if (!query) {
      return true
    }

    return (
      user.fullName.toLowerCase().includes(query) || user.email.toLowerCase().includes(query)
    )
  })

  const isSuperUser = currentUser?.isSuperUser ?? false

  return (
    <aside className="flex h-full w-full flex-col bg-gray-50 sm:border-r sm:border-slate-200 sm:w-80">
      <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
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

      <div className="app-scrollbar min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
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
            No matches for "{search}". Try a name or email address.
          </div>
        ) : null}

        {!isLoading && filteredUsers.length > 0 ? (
          <ul className="space-y-2">
            {filteredUsers.map((user) => {
              const isActive = activeUser?.id === user.id
              const unreadCount = unreadCounts.get(user.id) ?? 0
              const canDeleteUser = isSuperUser && currentUser?.id !== user.id
              const isMenuOpen = menuUserId === user.id

              return (
                <li key={user.id}>
                  <div
                    className={`group relative w-full rounded-3xl border px-4 py-3 transition ${
                      isActive
                        ? 'border-sky-200 bg-sky-50 shadow-sm'
                        : 'border-transparent bg-white hover:border-slate-200 hover:bg-white'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setMenuUserId(null)
                        onSelectUser(user)
                      }}
                      className={`w-full text-left ${canDeleteUser ? 'pr-10 sm:pr-12' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
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

                    {canDeleteUser ? (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setMenuUserId((currentMenuUserId) =>
                              currentMenuUserId === user.id ? null : user.id
                            )
                          }
                          className={`absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/95 p-1.5 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 ${
                            isMenuOpen ? 'text-slate-700' : 'text-slate-500'
                          }`}
                          aria-label={`Open actions for ${user.fullName}`}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {isMenuOpen ? (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setMenuUserId(null)}
                              aria-hidden="true"
                            />
                            <div className="absolute right-3 top-[calc(50%+2rem)] z-20 w-44 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                              <button
                                type="button"
                                onClick={() => {
                                  setPendingDeleteUser(user)
                                  setMenuUserId(null)
                                }}
                                className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete user
                              </button>
                            </div>
                          </>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ul>
        ) : null}
      </div>
      <ConfirmDialog
        open={pendingDeleteUser !== null}
        title={pendingDeleteUser ? `Delete ${pendingDeleteUser.fullName}?` : 'Delete user?'}
        description="This will permanently remove the user and all related messages. You cannot undo this action."
        confirmLabel="Delete user"
        icon={<UserX className="h-5 w-5" />}
        onCancel={() => setPendingDeleteUser(null)}
        onConfirm={() => {
          if (!pendingDeleteUser) {
            return
          }

          onDeleteUser(pendingDeleteUser.id)
          setPendingDeleteUser(null)
          setMenuUserId(null)
        }}
      />
    </aside>
  )
}
