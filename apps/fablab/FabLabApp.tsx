import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@core/auth/useAuth';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Library from './views/library/Library';
import ProfileSection from './components/ProfileSection';
import AIContext from './components/AIContext';
import MakerPathView from './views/maker-path/MakerPath';
import ProjectPlanner from './views/projects/ProjectPlanner';
import ExternalAccess from './views/external-access/ExternalAccess';
import AIChat from './components/AIChat';
import Notebook from '@apps/notebook/Notebook';
import PerplexityIndex from './views/server-tools/PerplexityIndex';
import PromptOptimize from './views/server-tools/PromptOptimize';
import ImageGeneration from './views/server-tools/ImageGeneration';
import Administration from './views/server-tools/Administration';
import PromptView from './views/prompt/PromptView';
import AssistantView from './views/assistant/AssistantView';
import { ProjectView } from './views/projects';
import PublicNotebook from './views/public/PublicNotebook';
import PublicPrompt from './views/public/PublicPrompt';
import PublicAssistant from './views/public/PublicAssistant';
import { UserProfile } from './types';

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: authUser, logout } = useAuth();

  // Inicializar tema desde localStorage - por defecto en modo claro
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('aimaker_theme');
    // Solo será dark si explícitamente está guardado como 'dark'
    return saved === 'dark';
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Cerrar sidebar cuando cambia la ruta (útil en móvil)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

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
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

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
        {/* Rutas privadas sin Sidebar (vista completa) */}
        <Route path="/notebook/:id" element={<Notebook isPublicView={false} />} />
        <Route path="/prompt/:id" element={<PromptView />} />
        <Route path="/assistant/:id" element={<AssistantView />} />
        <Route path="/project/:id" element={<ProjectView />} />
        
        {/* Rutas públicas - Sin autenticación requerida */}
        <Route path="/public/notebook/:id" element={<PublicNotebook />} />
        <Route path="/public/prompt/:id" element={<PublicPrompt />} />
        <Route path="/public/assistant/:id" element={<PublicAssistant />} />
        
        {/* Server Tools Routes - Sin Sidebar */}
        <Route path="/perplexity-index" element={<PerplexityIndex />} />
        <Route path="/prompt-optimize" element={<PromptOptimize />} />
        <Route path="/image-generation" element={<ImageGeneration />} />
        <Route path="/administration" element={<Administration />} />
        
        {/* Rutas con Sidebar y Header */}
        <Route path="/*" element={
          <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
              <div
                className="fixed inset-0 bg-black/50 z-0 md:hidden"
                onClick={() => setIsSidebarOpen(false)}
              />
            )}

            {/* Sidebar - Responsive */}
            <div className={`fixed inset-y-0 left-0 z-10 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-200 ease-in-out`}>
              <Sidebar
                onLogout={handleLogout}
              />
              {/* Overlay para cerrar sidebar en móvil al hacer click */}
              {isSidebarOpen && (
                <div 
                  className="md:hidden fixed inset-0 z-[-1]"
                  onClick={() => setIsSidebarOpen(false)}
                />
              )}
            </div>

            <div className="flex-1 flex flex-col h-screen overflow-hidden">
              <Header
                toggleTheme={toggleTheme}
                isDark={isDark}
                toggleSidebar={toggleSidebar}
                title="dashboard"
              />

              <main className="flex-1 overflow-y-auto p-6 md:p-8">
                <div className="max-w-7xl mx-auto">
                  <Routes>
                    {/* Rutas específicas para cada sección */}
                    <Route path="/" element={<ProfileSection user={user} />} />
                    <Route path="/library" element={<Library />} />
                    <Route path="/profile" element={<ProfileSection user={user} />} />
                    <Route path="/context" element={<AIContext />} />
                    <Route path="/maker-path" element={<MakerPathView />} />
                    <Route path="/maker-path/:id" element={<ProjectPlanner />} />
                    <Route path="/tools" element={<ExternalAccess />} />
                  </Routes>
                </div>
              </main>
            </div>

            <AIChat />
          </div>
        } />
      </Routes>
    </>
  );
};

export default App;