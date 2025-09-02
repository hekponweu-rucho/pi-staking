import { toast } from 'sonner'
import { apiClient, sanctumClient } from './api'
import { debugLog } from './config'

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    const message = error?.response?.data?.message || 'Erreur réseau'
    if (status === 422) {
      debugLog('Validation errors', error.response?.data?.errors)
    } else if (status && status >= 500) {
      toast.error(message)
    }
    return Promise.reject(error)
  }
)

export { apiClient, sanctumClient }
export default apiClient
