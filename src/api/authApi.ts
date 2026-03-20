import axios from 'axios'

import type { ApiErrorResponse, AuthResponse } from '../types'

import { axiosInstance } from './axiosInstance'

export interface RegisterRequest {
  email: string
  password: string
  fullName: string
}

export interface LoginRequest {
  email: string
  password: string
}

export const register = async (payload: RegisterRequest): Promise<void> => {
  await axiosInstance.post('/auth/register', payload)
}

export const login = async (payload: LoginRequest): Promise<AuthResponse> => {
  const response = await axiosInstance.post<AuthResponse>('/auth/login', payload)
  return response.data
}

export const verifyEmail = async (token: string): Promise<void> => {
  await axiosInstance.get('/auth/verify', {
    params: { token },
  })
}

export const resendVerification = async (email: string): Promise<void> => {
  await axiosInstance.post('/auth/resend-verification', { email })
}

export const getApiErrorMessage = (
  error: unknown,
  fallback = 'Something went wrong.',
): string => {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.message ?? error.response?.data?.error ?? fallback
  }

  return fallback
}

