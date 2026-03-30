const ACCESS_TOKEN_KEY = 'access_token'

export const getToken = (): string | null => localStorage.getItem(ACCESS_TOKEN_KEY)

export const setToken = (token: string): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, token)
}

export const removeToken = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
}

