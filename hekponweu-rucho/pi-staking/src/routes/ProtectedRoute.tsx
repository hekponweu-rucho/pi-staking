import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Chargement...</div>
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}

export default ProtectedRoute