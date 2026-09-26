import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FullPageSpinner } from './LoadingSpinner';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
