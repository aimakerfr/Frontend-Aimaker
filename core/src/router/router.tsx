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
import FabLabApp from '@apps/fablab/FabLabApp';
import Notebook from '@apps/notebook/Notebook';
import TemplateSelector from '@apps/frontend_template_visualizer/components/TemplateSelector';
import PublicPrompt from '@apps/fablab/views/public/PublicPrompt';
import PublicAssistant from '@apps/fablab/views/public/PublicAssistant';
import PublicProject from '@apps/fablab/views/public/PublicProject';

const publicShareRoutes = [
  { path: '/public-share/notebook/:id', element: <Notebook isPublicView={true} /> },
  { path: '/public-share/prompt/:id', element: <PublicPrompt /> },
  { path: '/public-share/assistant/:id', element: <PublicAssistant /> },
  { path: '/public-share/project/:id', element: <PublicProject /> },
];

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
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        {/* Root Route - Redirect based on authentication */}
        <Route 
          path="/" 
          element={
            isLoading ? (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh'
              }}>
                <div>Cargando...</div>
              </div>
            ) : isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/auth/login" replace />
            )
          } 
        />
        
        {/* Public Routes */}
        <Route
          path="/auth/*"
          element={
            <PublicRoute>
              <AuthApp />
            </PublicRoute>
          }
        />

          {/* Public Share Routes - No auth required, read-only */}
          {publicShareRoutes.map((route) => (
              <Route key={route.path} path={route.path} element={route.element} />
          ))}

        {/* Public Notebook - No auth required, read-only */}
        <Route path="/public/notebook/:id" element={<Notebook isPublicView={true} />} />
        
        {/* Public Prompt - No auth required, read-only */}
        <Route path="/public/prompt/:id" element={<PublicPrompt />} />
        
        {/* Public Assistant - No auth required, read-only */}
        <Route path="/public/assistant/:id" element={<PublicAssistant />} />
        
        {/* Public Project - No auth required, read-only */}
        <Route path="/public/project/:id" element={<PublicProject />} />

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
