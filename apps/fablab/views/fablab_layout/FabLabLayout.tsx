import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import Library from '../library/Library';
import ProfileSection from '../../components/ProfileSection';
import AIContext from '../../components/AIContext';
import MakerPathView from '../maker-path/MakerPath';
import ProjectPlanner from '../projects/ProjectPlanner';
import PathCreationModules from '../path-creation-modules/App';
import ExternalAccess from '../external-access/ExternalAccess';
import AIChat from '../../components/AIChat';
import ObjectsLibrary from '../objects/ObjectsLibrary';
import { UserProfile } from '../../types';

type Props = {
  user: UserProfile;
  isDark: boolean;
  onToggleTheme: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onCloseSidebar: () => void;
  onLogout: () => void;
};

const FabLabLayout: React.FC<Props> = ({
  user,
  isDark,
  onToggleTheme,
  isSidebarOpen,
  onToggleSidebar,
  onCloseSidebar,
  onLogout,
}) => {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-0 md:hidden"
          onClick={onCloseSidebar}
        />
      )}

      {/* Sidebar - Responsive */}
      <div className={`fixed inset-y-0 left-0 z-10 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-200 ease-in-out`}>
        <Sidebar onLogout={onLogout} />
        {/* Overlay para cerrar sidebar en móvil al hacer click */}
        {isSidebarOpen && (
          <div
            className="md:hidden fixed inset-0 z-[-1]"
            onClick={onCloseSidebar}
          />
        )}
      </div>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header
          toggleTheme={onToggleTheme}
          isDark={isDark}
          toggleSidebar={onToggleSidebar}
          title="dashboard"
        />

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            <Routes>
              {/* Rutas específicas para cada sección */}
              <Route path="/" element={<ProfileSection user={user} />} />
              <Route path="/library" element={<Library />} />
              {/* Home routes */}
              <Route path="/objects-library" element={<ObjectsLibrary />} />

              <Route path="/profile" element={<ProfileSection user={user} />} />
              <Route path="/context" element={<AIContext />} />
              <Route path="/maker-path" element={<MakerPathView />} />
              <Route path="/maker-path/:id" element={<ProjectPlanner />} />
              <Route path="/maker-path/modules/:id" element={<PathCreationModules />} />
              <Route path="/tools" element={<ExternalAccess />} />
            </Routes>
          </div>
        </main>
      </div>

      <AIChat />
    </div>
  );
};

export default FabLabLayout;
