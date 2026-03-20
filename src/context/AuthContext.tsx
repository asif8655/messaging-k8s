import { createContext, useContext, useState, type ReactNode } from 'react'

import type { User } from '../types'
import { getToken, removeToken, setToken } from '../utils/tokenStorage'

const USER_STORAGE_KEY = 'auth_user'

interface AuthContextValue {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (token: string, user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const readStoredUser = (): User | null => {
  const rawUser = localStorage.getItem(USER_STORAGE_KEY)

  if (!rawUser) {
    return null
  }

  try {
    return JSON.parse(rawUser) as User
  } catch {
    localStorage.removeItem(USER_STORAGE_KEY)
    return null
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setTokenState] = useState<string | null>(() => getToken())
  const [user, setUser] = useState<User | null>(() => readStoredUser())

  const login = (nextToken: string, nextUser: User) => {
    setToken(nextToken)
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser))
    setTokenState(nextToken)
    setUser(nextUser)
  }

  const logout = () => {
    removeToken()
    localStorage.removeItem(USER_STORAGE_KEY)
    setTokenState(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token),
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.')
  }

  return context
}
