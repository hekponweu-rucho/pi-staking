import api from './api'

export type User = { id: string; name: string; email: string }

export const authService = {
  async login(email: string, password: string): Promise<User | null> {
    try {
      const r = await api.post('/api/auth/login', { email, password })
      return r.data?.user ?? null
    } catch (e) {
      return null
    }
  },
  async register(name: string, email: string, password: string): Promise<User | null> {
    try {
      const r = await api.post('/api/auth/register', { name, email, password })
      return r.data?.user ?? null
    } catch (e) {
      return null
    }
  },
  async me(): Promise<User | null> {
    try {
      const r = await api.get('/api/auth/me')
      return r.data ?? null
    } catch (e) {
      return null
    }
  },
  async logout(): Promise<boolean> {
    try {
      await api.post('/api/auth/logout')
      return true
    } catch (e) {
      return false
    }
  }
}