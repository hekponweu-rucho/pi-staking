import React, { useEffect, useState } from 'react';
import { dashboardService, type UserDashboard, type Investment } from '../../api/dashboardService';

interface UserDashboardCompleteProps {
  userId?: string;
}

const UserDashboardComplete: React.FC<UserDashboardCompleteProps> = ({ userId }) => {
  const [dashboard, setDashboard] = useState<UserDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await dashboardService.getUserDashboard();
        setDashboard(data);
      } catch (err) {
        console.error('Erreur lors du chargement du dashboard:', err);
        setError('Impossible de charger les données du dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [userId]);

  // État de chargement
  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner">Chargement...</div>
      </div>
    );
  }

  // État d'erreur
  if (error || !dashboard) {
    return (
      <div className="dashboard-error">
        <h3>Erreur</h3>
        <p>{error || 'Aucune donnée disponible'}</p>
        <button onClick={() => window.location.reload()}>
          Réessayer
        </button>
      </div>
    );
  }

  // Garde-fou pour les investissements - s'assurer que c'est un tableau
  const investmentsSafe = Array.isArray(dashboard.investments) ? dashboard.investments : [];
  
  // Calculs sécurisés avec reduce()
  const totalInvested = investmentsSafe.reduce((acc: number, investment: Investment) => {
    return acc + (typeof investment.amount === 'number' ? investment.amount : 0);
  }, 0);

  const totalReturns = investmentsSafe.reduce((acc: number, investment: Investment) => {
    return acc + (typeof investment.returns === 'number' ? investment.returns : 0);
  }, 0);

  const activeInvestments = investmentsSafe.filter(
    (investment: Investment) => investment.status === 'active'
  );

  const pendingInvestments = investmentsSafe.filter(
    (investment: Investment) => investment.status === 'pending'
  );

  return (
    <div className="user-dashboard-complete">
      <header className="dashboard-header">
        <h1>Dashboard de {dashboard.user.name || 'Utilisateur'}</h1>
        <p className="user-email">{dashboard.user.email}</p>
      </header>

      <section className="dashboard-stats">
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Investi</h3>
            <p className="stat-value">{totalInvested.toLocaleString('fr-FR')} €</p>
          </div>
          
          <div className="stat-card">
            <h3>Retours Totaux</h3>
            <p className="stat-value">{totalReturns.toLocaleString('fr-FR')} €</p>
          </div>
          
          <div className="stat-card">
            <h3>Investissements Actifs</h3>
            <p className="stat-value">{activeInvestments.length}</p>
          </div>
          
          <div className="stat-card">
            <h3>En Attente</h3>
            <p className="stat-value">{pendingInvestments.length}</p>
          </div>
        </div>
      </section>

      <section className="dashboard-investments">
        <h2>Mes Investissements</h2>
        
        {investmentsSafe.length === 0 ? (
          <div className="empty-state">
            <p>Aucun investissement trouvé</p>
            <button className="btn-primary">
              Commencer à investir
            </button>
          </div>
        ) : (
          <div className="investments-list">
            {investmentsSafe.map((investment: Investment) => (
              <div key={investment.id} className="investment-card">
                <div className="investment-header">
                  <span className="investment-id">#{investment.id}</span>
                  <span className={`investment-status status-${investment.status}`}>
                    {investment.status}
                  </span>
                </div>
                
                <div className="investment-details">
                  <p><strong>Montant:</strong> {investment.amount?.toLocaleString('fr-FR') || 0} {investment.currency || 'EUR'}</p>
                  <p><strong>Date:</strong> {new Date(investment.date).toLocaleDateString('fr-FR')}</p>
                  {investment.returns && (
                    <p><strong>Retours:</strong> {investment.returns.toLocaleString('fr-FR')} €</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <style jsx>{`
        .user-dashboard-complete {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .dashboard-header {
          margin-bottom: 30px;
        }
        
        .dashboard-header h1 {
          margin: 0 0 5px 0;
          color: #333;
        }
        
        .user-email {
          color: #666;
          margin: 0;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .stat-card {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
        }
        
        .stat-card h3 {
          margin: 0 0 10px 0;
          color: #666;
          font-size: 14px;
          font-weight: 500;
        }
        
        .stat-value {
          margin: 0;
          font-size: 24px;
          font-weight: bold;
          color: #333;
        }
        
        .dashboard-investments h2 {
          margin-bottom: 20px;
          color: #333;
        }
        
        .empty-state {
          text-align: center;
          padding: 40px;
          background: #f8f9fa;
          border-radius: 8px;
        }
        
        .investments-list {
          display: grid;
          gap: 15px;
        }
        
        .investment-card {
          background: white;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 20px;
        }
        
        .investment-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        
        .investment-id {
          font-family: monospace;
          color: #666;
        }
        
        .investment-status {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
        }
        
        .status-active {
          background: #d4edda;
          color: #155724;
        }
        
        .status-pending {
          background: #fff3cd;
          color: #856404;
        }
        
        .status-completed {
          background: #d1ecf1;
          color: #0c5460;
        }
        
        .investment-details p {
          margin: 5px 0;
        }
        
        .btn-primary {
          background: #007bff;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .btn-primary:hover {
          background: #0056b3;
        }
        
        .dashboard-loading,
        .dashboard-error {
          text-align: center;
          padding: 40px;
        }
        
        .loading-spinner {
          font-size: 18px;
          color: #666;
        }
        
        .dashboard-error {
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          border-radius: 8px;
          color: #721c24;
        }
      `}</style>
    </div>
  );
};

export default UserDashboardComplete;