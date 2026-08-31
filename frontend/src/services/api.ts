import axios from 'axios'
import type { AnonymousUser, ChatConfigResponse } from '../types/chat'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export class ApiError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function toApiError(error: unknown, fallback: string): ApiError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    if (!error.response) {
      return new ApiError('Cannot reach the server. Please check your connection.', status)
    }
    if (status && status >= 500) {
      return new ApiError('Something went wrong on our end. Please try again shortly.', status)
    }
    return new ApiError(fallback, status)
  }
  return new ApiError(fallback)
}

export async function createAnonymousUser(): Promise<AnonymousUser> {
  try {
    const { data } = await api.post<AnonymousUser>('/api/users/anonymous')
    return data
  } catch (error) {
    throw toApiError(error, 'Unable to start a new chat session.')
  }
}

export async function fetchChatConfig(): Promise<ChatConfigResponse> {
  try {
    const { data } = await api.get<ChatConfigResponse>('/api/config/chat')
    return data
  } catch (error) {
    throw toApiError(error, 'Unable to load chat settings.')
  }
}
