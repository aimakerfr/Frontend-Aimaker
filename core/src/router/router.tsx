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
import FabLabApp from '@apps/fablab/FabLabApp';
import Notebook from '@apps/notebook/Notebook';
import TemplateSelector from '@apps/frontend_template_visualizer/components/TemplateSelector';

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
        
        {/* Public Notebook - No auth required, read-only */}
        <Route path="/public/notebook/:id" element={<Notebook isPublicView={true} />} />

        {/* Templates Visualizer */}
        <Route path="/templates_visualizer" element={<TemplateSelector />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <FabLabApp />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
