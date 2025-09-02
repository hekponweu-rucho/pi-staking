import React from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const Navbar: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const onLogout = async () => {
    await logout()
    navigate('/login')
  }
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/" className="brand">Pi Staking</Link>
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'navlink active' : 'navlink'}>Dashboard</NavLink>
        <NavLink to="/staking" className={({ isActive }) => isActive ? 'navlink active' : 'navlink'}>Staking</NavLink>
      </div>
      <div className="navbar-right">
        {user ? (
          <>
            <span className="user-badge">{user.name || user.email}</span>
            <button onClick={onLogout}>Déconnexion</button>
          </>
        ) : (
          <>
            <NavLink to="/login" className={({ isActive }) => isActive ? 'navlink active' : 'navlink'}>Connexion</NavLink>
            <NavLink to="/register" className={({ isActive }) => isActive ? 'navlink active' : 'navlink'}>Inscription</NavLink>
          </>
        )}
      </div>
    </nav>
  )
}

export default Navbar