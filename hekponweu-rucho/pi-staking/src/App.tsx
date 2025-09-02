import React from 'react';
import UserDashboardComplete from './components/dashboard/UserDashboardComplete';

function App() {
  return (
    <div className="App">
      <header className="app-header">
        <h1>Pi Staking Platform</h1>
      </header>
      
      <main className="app-main">
        <UserDashboardComplete />
      </main>
      
      <footer className="app-footer">
        <p>&copy; 2025 Pi Staking. Tous droits réservés.</p>
      </footer>
    </div>
  );
}

export default App;