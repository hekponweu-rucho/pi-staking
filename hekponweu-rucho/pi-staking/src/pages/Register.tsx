import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Register: React.FC = () => {
  const { register } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const ok = await register(name, email, password)
    setLoading(false)
    if (ok) navigate('/dashboard', { replace: true })
    else setError("Impossible d'inscrire l'utilisateur")
  }

  return (
    <div className="auth-container">
      <h2>Inscription</h2>
      <form onSubmit={onSubmit} className="auth-form">
        <label>Nom</label>
        <input value={name} onChange={e => setName(e.target.value)} required />
        <label>Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        <label>Mot de passe</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        {error && <div className="auth-error">{error}</div>}
        <button type="submit" disabled={loading}>{loading ? 'Inscription...' : "S'inscrire"}</button>
      </form>
      <p className="auth-alt">Déjà un compte ? <Link to="/login">Connexion</Link></p>
    </div>
  )
}

export default Register