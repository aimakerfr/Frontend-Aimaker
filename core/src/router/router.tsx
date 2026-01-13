/**
 * Router - Core routing orchestration
 * The ONLY place that knows about all apps
 * Apps are completely decoupled from each other
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Import Apps (ONLY THE CORE KNOWS THEM)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import AuthApp from '@apps/auth/AuthApp';
import HomeApp from '@apps/home/HomeApp';
import DashboardApp from '@apps/dashboard/DashboardApp';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Protected Route Component
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Cargando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  return <>{children}</>;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Public Route Component
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface PublicRouteProps {
  children: React.ReactNode;
}

function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Cargando...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// App Router
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomeApp />} />
        <Route
          path="/auth/*"
          element={
            <PublicRoute>
              <AuthApp />
            </PublicRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <DashboardApp />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
