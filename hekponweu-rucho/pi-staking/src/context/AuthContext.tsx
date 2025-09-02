import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { authService, type User } from '../api/authService'

type AuthContextType = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    authService.me().then(u => {
      if (mounted) setUser(u)
    }).finally(() => {
      if (mounted) setLoading(false)
    })
    return () => { mounted = false }
  }, [])

  const login = async (email: string, password: string) => {
    setLoading(true)
    const u = await authService.login(email, password)
    setUser(u)
    setLoading(false)
    return !!u
  }

  const register = async (name: string, email: string, password: string) => {
    setLoading(true)
    const u = await authService.register(name, email, password)
    setUser(u)
    setLoading(false)
    return !!u
  }

  const logout = async () => {
    await authService.logout()
    setUser(null)
  }

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}