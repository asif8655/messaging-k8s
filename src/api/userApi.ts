import type { User } from '../types'

import { axiosInstance } from './axiosInstance'

export const getUsers = async (): Promise<User[]> => {
  const response = await axiosInstance.get<User[]>('/users')
  return response.data
}

export const getUserById = async (userId: string): Promise<User> => {
  const response = await axiosInstance.get<User>(`/users/${userId}`)
  return response.data
}

