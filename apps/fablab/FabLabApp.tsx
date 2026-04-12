import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@core/auth/useAuth';
import ProjectFlow from './views/projectflow/ProjectFlow';
import Notebook from '@apps/fablab/views/notebook/Notebook';
import RagMultimodal from '@apps/fablab/views/rag_multimodal/RagMultimodal';
import PerplexityIndex from './views/server-tools/PerplexityIndex';
import PromptOptimize from './views/server-tools/PromptOptimize';
import ImageGeneration from './views/server-tools/ImageGeneration';
import Administration from './views/server-tools/Administration';
import PromptView from './views/prompt/PromptView';
import AssistantView from './views/assistant/AssistantView';
import { ProjectView } from './views/project';
import ProductView from './views/product/ProductView';
import PublicPromptDetails from './views/public/prompt/PublicPromptDetails';
import PublicAssistantDetails from './views/public/assistant/PublicAssistantDetails';
import PublicProjectDetails from './views/public/project/PublicProjectDetails';
import RagChatPage from './views/rag-chat/RagChatPage';
import { UserProfile } from './types';
import FabLabLayout from '@apps/fablab/views/fablab_layout/FabLabLayout';
import { initializeLanguages } from './language';

// Wrapper components para extraer el id de la URL y pasarlo como toolId
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

const App: React.FC = () => {
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();

  // Inicializar tema desde localStorage - por defecto en modo claro
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('aimaker_theme');
    // Solo será dark si explícitamente está guardado como 'dark'
    return saved === 'dark';
  });

  // Initialize language system on app startup
  useEffect(() => {
    initializeLanguages();
  }, []);

  // Convertir usuario de backend a formato UserProfile
  const user: UserProfile = authUser ? {
    name: authUser.name || 'User',
    email: authUser.email || 'user@example.com',
    role: authUser.roles?.includes('admin') ? 'Admin' : 'AI Maker Pro',
    level: 'Intermediate',
    joinDate: authUser.createdAt 
      ? new Date(authUser.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      : 'N/A',
    stats: {
      projects: 5,
      documents: 142,
      tokensUsed: 45000,
      tokenLimit: 100000
    }
  } : {
    name: 'Guest',
    email: 'guest@example.com',
    role: 'Guest',
    level: 'Beginner',
    joinDate: 'N/A',
    stats: {
      projects: 0,
      documents: 0,
      tokensUsed: 0,
      tokenLimit: 0
    }
  };

  // Aplicar y persistir tema
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('aimaker_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('aimaker_theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  // Manejar logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <>
      <Routes>
        {/* Rutas públicas - Sin autenticación requerida (PRIMERO para evitar conflictos) */}
        <Route path="/product/notebook/:id" element={<ProductView />} />
        <Route path="/product/rag-multimodal/:id" element={<ProductView />} />
        <Route path="/public/prompt/:id" element={<PublicPromptWrapper />} />
        <Route path="/public/assistant/:id" element={<PublicAssistantWrapper />} />
        <Route path="/public/project/:id" element={<PublicProjectWrapper />} />
        
        {/* Rutas privadas sin Sidebar (vista completa) */}
        <Route path="/notebook/:id" element={<Notebook isPublicView={false} />} />
        <Route path="/rag-multimodal/:id" element={<RagMultimodal />} />
        <Route path="/prompt/:id" element={<PromptView />} />
        <Route path="/assistant/:id" element={<AssistantView />} />
        <Route path="/project/:id" element={<ProjectView />} />
        {/* ProjectFlow routes with query parameters */}
        <Route path="/projectflow" element={<ProjectFlow />} />
        {/* Standalone RAG Chat - without sidebar */}
        <Route path="/rag-chat" element={<RagChatPage />} />
        
        {/* Server Tools Routes - Sin Sidebar */}
        <Route path="/perplexity-index" element={<PerplexityIndex />} />
        <Route path="/prompt-optimize" element={<PromptOptimize />} />
        <Route path="/image-generation" element={<ImageGeneration />} />
        <Route path="/administration" element={<Administration />} />
        {/* Rutas con Sidebar y Header */}
        <Route
          path="/*"
          element={
            <FabLabLayout
              user={user}
              isDark={isDark}
              onToggleTheme={toggleTheme}
              onLogout={handleLogout}
            />
          }
        />
      </Routes>
    </>
  );
};

export default App;