import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@core/auth/useAuth';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './views/dashboard/Dashboard';
import Library from './views/library/Library';
import ProfileSection from './components/ProfileSection';
import AIContext from './components/AIContext';
import Projects from './views/projects/ProjectPlanner';
import ExternalAccess from './views/external-access/ExternalAccess';
import AIChat from './components/AIChat';
import Notebook from '@apps/notebook/Notebook';
import { View, UserProfile } from './types';

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

  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Detectar si se debe navegar a una vista específica desde el state
  useEffect(() => {
    const state = location.state as { view?: View };
    if (state?.view) {
      setCurrentView(state.view);
      // Limpiar el state para evitar que se reaplique
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

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

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'library': return <Library />;
      case 'profile': return <ProfileSection user={user} />;
      case 'projects': return <Projects />;
      case 'context': return <AIContext />;
      case 'tools': return <ExternalAccess />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden">
      <Routes>
        {/* Ruta del Notebook sin Sidebar (vista completa) - Private access */}
        <Route path="/notebook/:id" element={<Notebook isPublicView={false} />} />
        
        {/* Rutas con Sidebar y Header */}
        <Route path="/*" element={
          <>
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
                currentView={currentView}
                onChangeView={(view) => { setCurrentView(view); setIsSidebarOpen(false); }}
                onLogout={handleLogout}
              />
            </div>

            <div className="flex-1 flex flex-col h-screen overflow-hidden">
              <Header
                toggleTheme={toggleTheme}
                isDark={isDark}
                toggleSidebar={toggleSidebar}
                title={currentView}
              />

              <main className="flex-1 overflow-y-auto p-6 md:p-8">
                <div className="max-w-7xl mx-auto">
                  {renderView()}
                </div>
              </main>
            </div>

            <AIChat />
          </>
        } />
      </Routes>
    </div>
  );
};

export default App;