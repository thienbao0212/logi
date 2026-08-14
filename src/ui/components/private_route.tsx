import React from 'react';
import { Navigate } from 'react-router-dom';
import AppShell from './app_shell.js';

export default function PrivateRoute({ children, role }: { children: React.ReactNode, role?: string }) {
  const token = localStorage.getItem('token');
  const memberships = JSON.parse(localStorage.getItem('memberships') || '[]');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (role) {
    const isAdmin = memberships.some((m: any) => m.role === 'admin');
    // Admin có toàn quyền — bỏ qua kiểm tra role cho mọi route
    if (!isAdmin) {
      const hasRole = memberships.some((m: any) => m.role === role);
      if (!hasRole) {
        return <Navigate to="/shipments" replace />;
      }
    }
  }

  return <AppShell>{children}</AppShell>;
}
