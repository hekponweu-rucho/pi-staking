import React, { useEffect, useState } from 'react'
import { stakingService, type StakingPackage, type StakingPosition } from '../api/stakingService'

const StakingPage: React.FC = () => {
  const [packages, setPackages] = useState<StakingPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let mounted = true
    setLoading(true)
    stakingService.getPackages().then((p) => { if (mounted) setPackages(p) }).finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const onInvest = async (pkg: StakingPackage) => {
    setError('')
    setSuccess('')
    setCreating(pkg.id)
    const pos: StakingPosition | null = await stakingService.createPosition(pkg.id, pkg.minAmount)
    setCreating(null)
    if (pos) setSuccess('Position créée')
    else setError('Impossible de créer la position')
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Chargement...</div>

  return (
    <div className="staking-page">
      <h2>Offres de Staking</h2>
      {error && <div className="alert error">{error}</div>}
      {success && <div className="alert success">{success}</div>}
      {packages.length === 0 ? (
        <div className="empty-state">Aucune offre disponible</div>
      ) : (
        <div className="packages-grid">
          {packages.map(pkg => (
            <div key={pkg.id} className="package-card">
              <h3>{pkg.name}</h3>
              <p>APY: {pkg.apy}%</p>
              <p>Durée: {pkg.duration} jours</p>
              <p>Montant min: {pkg.minAmount.toLocaleString('fr-FR')}</p>
              <button onClick={() => onInvest(pkg)} disabled={creating === pkg.id || !pkg.isActive}>
                {creating === pkg.id ? 'Création...' : 'Investir'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default StakingPage