import axios from 'axios'
import { config } from './config'

function join(base: string, path: string) {
  const b = base.replace(/\/$/, '')
  const p = path.startsWith('/') ? path : `/${path}`
  return `${b}${p}`
}

const base = config.api.baseUrl || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const prefix = config.api.prefix || '/api'
export const API_BASE_URL = join(base, prefix)

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: config.api.timeout || 10000,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
})

apiClient.interceptors.request.use((cfg) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status
    if (status === 401) {
      try { localStorage.removeItem('auth_token'); localStorage.removeItem('user') } catch {}
      if (typeof window !== 'undefined' && !location.pathname.startsWith('/login')) location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const sanctumClient = axios.create({
  baseURL: base,
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN'
})

export const ensureCsrf = () => sanctumClient.get('/sanctum/csrf-cookie')

export default apiClient
