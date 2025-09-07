import React from 'react';
import { AdminProvider } from '../contexts/AdminContext';
import { AdminDashboardComplete } from './AdminDashboardComplete';
import { useAuth } from '@/contexts/AuthContext';

// Composant principal de l'application admin
export function AdminApp() {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <AdminProvider>
      <AdminDashboardComplete onLogout={handleLogout} />
    </AdminProvider>
  );
}

export default AdminApp;