/**
 * Router - Core routing orchestration
 * The ONLY place that knows about all apps
 * Apps are completely decoupled from each other
 */

import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Import Apps (ONLY THE CORE KNOWS THEM)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import AuthApp from '@apps/auth/AuthApp';
import FabLabApp from '@apps/fablab/FabLabApp';
import Notebook from '@apps/fablab/views/notebook/Notebook';
import ProductView from '@apps/fablab/views/product/ProductView';
import LandingPageView from '@apps/fablab/views/product/LandingPageView';
import ImageGeneratorView from '@apps/fablab/views/product/ImageGeneratorView';
import StyleTransferView from '@apps/fablab/views/product/StyleTransferView';
import { TranslationView } from '@apps/fablab/views/product/TranslationView';
import ApiKeyInspectorView from '@apps/fablab/views/product/ApiKeyInspectorView';
import ApiKeyHtmlInjectionView from '@apps/fablab/views/product/ApiKeyHtmlInjectionView';
import ProfileB2BView from '@apps/fablab/views/product/ProfileB2BView';
import ApiKeyManager from '@apps/fablab/views/api-proxy/ApiKeyManager';
import { LandingPageEntry, ImageGeneratorEntry, TranslationEntry, StyleTransferEntry, ApiKeyEntry, ApiKeyHtmlInjectionEntry, ProfileB2BEntry, PerplexitySearchEntry, PromptOptimizerEntry, ApiCostManagerEntry, SuiviDemandesEntry } from '@apps/fablab/views/product/FixedProductEntry';
import PromptOptimizerView from '@apps/fablab/views/product/PromptOptimizerView';
import PerplexitySearchView from '@apps/fablab/views/product/PerplexitySearchView';
import CreationPathView from '@apps/fablab/views/product/CreationPathView';
import ApiCostManagerView from '@apps/fablab/views/product/ApiCostManagerView';
import SuiviDemandesView from '@apps/fablab/views/product/SuiviDemandesView';
import TemplateSelector from '@apps/frontend_template_visualizer/components/TemplateSelector';
import PublicPromptDetails from '@apps/fablab/views/public/prompt/PublicPromptDetails';
import PublicAssistantDetails from '@apps/fablab/views/public/assistant/PublicAssistantDetails';
import PublicProjectDetails from '@apps/fablab/views/public/project/PublicProjectDetails';

const PublicPromptWrapper = () => {
  const { id } = useParams<{ id: string }>();
  return <PublicPromptDetails toolId={parseInt(id || '0')} />;
};

const PublicAssistantWrapper = () => {
  const { id } = useParams<{ id: string }>();
  return <PublicAssistantDetails toolId={parseInt(id || '0')} />;
};

const PublicProjectWrapper = () => {
  const { id } = useParams<{ id: string }>();
  return <PublicProjectDetails toolId={parseInt(id || '0')} />;
};

const publicShareRoutes = [
  { path: '/public-share/notebook/:id', element: <Notebook isPublicView={true} /> },
  { path: '/public-share/prompt/:id', element: <PublicPromptWrapper /> },
  { path: '/public-share/assistant/:id', element: <PublicAssistantWrapper /> },
  { path: '/public-share/project/:id', element: <PublicProjectWrapper /> },
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

        {/* Public Notebook (Product View) - No auth required, read-only */}
        <Route path="/product/notebook/:id" element={<ProductView />} />

        {/* Fixed product entrypoints (resolve or create once, then redirect) */}
        <Route
          path="/product/landing-page"
          element={
            <ProtectedRoute>
              <LandingPageEntry />
            </ProtectedRoute>
          }
        />
        <Route
          path="/product/style-transfer"
          element={
            <ProtectedRoute>
              <StyleTransferEntry />
            </ProtectedRoute>
          }
        />
        <Route
          path="/product/image-generator"
          element={
            <ProtectedRoute>
              <ImageGeneratorEntry />
            </ProtectedRoute>
          }
        />
        <Route
          path="/product/translation"
          element={
            <ProtectedRoute>
              <TranslationEntry />
            </ProtectedRoute>
          }
        />
        <Route
          path="/product/api-key"
          element={
            <ProtectedRoute>
              <ApiKeyEntry />
            </ProtectedRoute>
          }
        />
        <Route
          path="/product/api-key-html"
          element={
            <ProtectedRoute>
              <ApiKeyHtmlInjectionEntry />
            </ProtectedRoute>
          }
        />
        <Route
          path="/product/profile-b2b"
          element={
            <ProtectedRoute>
              <ProfileB2BEntry />
            </ProtectedRoute>
          }
        />
        <Route
          path="/product/perplexity-search"
          element={
            <ProtectedRoute>
              <PerplexitySearchEntry />
            </ProtectedRoute>
          }
        />
        <Route
          path="/product/prompt-optimizer"
          element={
            <ProtectedRoute>
              <PromptOptimizerEntry />
            </ProtectedRoute>
          }
        />
        <Route
          path="/product/creation-path"
          element={
            <ProtectedRoute>
              <CreationPathView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/product/api-cost"
          element={
            <ProtectedRoute>
              <ApiCostManagerEntry />
            </ProtectedRoute>
          }
        />
        <Route
          path="/product/suivi-demandes"
          element={
            <ProtectedRoute>
              <SuiviDemandesEntry />
            </ProtectedRoute>
          }
        />
        
        {/* Public Landing Page Product View */}
        <Route path="/product/landing-page/:id" element={<LandingPageView />} />

        {/* Public Style Transfer Product View */}
        <Route path="/product/style-transfer/:id" element={<StyleTransferView />} />
        
        {/* Public Image Generator Product View */}
        <Route path="/product/image-generator/:id" element={<ImageGeneratorView />} />
        
        {/* Public Translation Product View */}
        <Route path="/product/translation/:id" element={<TranslationView />} />

        {/* Public API Key Inspector Product View */}
        <Route path="/product/api-key/:id" element={<ApiKeyInspectorView />} />
        <Route path="/product/api-key-html/:id" element={<ApiKeyHtmlInjectionView />} />
        <Route path="/product/profile-b2b/:id" element={<ProfileB2BView />} />
        <Route path="/product/prompt-optimizer/:id" element={<PromptOptimizerView />} />
        <Route path="/product/perplexity-search/:id" element={<PerplexitySearchView />} />
        <Route
          path="/product/creation-path/:id"
          element={
            <ProtectedRoute>
              <Navigate to="/product/creation-path" replace />
            </ProtectedRoute>
          }
        />
        <Route path="/product/api-cost/:id" element={<ApiCostManagerView />} />
        <Route path="/product/suivi-demandes/:id" element={<SuiviDemandesView />} />
        
        {/* Public Prompt - No auth required, read-only (config view) */}
        <Route path="/public/prompt/:id" element={<PublicPromptWrapper />} />
        
        {/* Public Assistant - No auth required, read-only (config view) */}
        <Route path="/public/assistant/:id" element={<PublicAssistantWrapper />} />
        
        {/* Public Project - No auth required, read-only (config view) */}
        <Route path="/public/project/:id" element={<PublicProjectWrapper />} />

        {/* Templates Visualizer */}
        <Route path="/templates_visualizer" element={<TemplateSelector />} />

        <Route
          path="/api-key-manager"
          element={
            <ProtectedRoute>
              <ApiKeyManager />
            </ProtectedRoute>
          }
        />

        {/* Protected Routes */}
        {/*
          Some FabLab feature routes are registered inside `FabLabApp` as absolute paths
          (e.g. `/rag-multimodal/:id`). Since `FabLabApp` was previously mounted only
          under `/dashboard/*`, direct navigation to those absolute paths would not
          render the app.

          Mount `FabLabApp` for those absolute protected entrypoints as well.
        */}
        <Route
          path="/rag-multimodal/:id"
          element={
            <ProtectedRoute>
              <FabLabApp />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <FabLabApp />
            </ProtectedRoute>
          }
        />
        <Route
          path="/home/*"
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
