import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './routes/ProtectedRoute'
import Navbar from './components/common/Navbar'
import Login from './pages/Login'
import Register from './pages/Register'
import DashboardPage from './pages/DashboardPage'
import StakingPage from './pages/StakingPage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="App">
          <header className="app-header">
            <h1>Pi Staking Platform</h1>
          </header>
          <Navbar />
          <main className="app-main">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/staking" element={<StakingPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <footer className="app-footer">
            <p>&copy; 2025 Pi Staking. Tous droits réservés.</p>
          </footer>
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App