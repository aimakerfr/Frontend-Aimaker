import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import Sidebar from '../../components/sidebar/Sidebar';
import Header from '../../components/header/Header';
import AIChat from '../../components/AIChat';
import { UserProfile } from '../../types';
import { useBreadcrumbs, BreadcrumbItem } from './FabLabLayoutHelper';
import { getDefaultDashboardPath, loadSidebarOrder, loadSidebarOrderFromDatabase } from '../../components/sidebar-order';
import './FabLabLayout.css';

// Importaciones de vistas
import ProjectBuilderView from '../project/ProjectBuilderView';
import CreationPathView from '../project/CreationPathView';
import Library from '../library/Library';
import ProfileSection from '../../components/ProfileSection';
import AIContext from '../../components/AIContext';
import MakerPathView from '../maker-path/MakerPath';
import ProjectPlanner from '../projects/ProjectPlanner';
import PathCreationModules from '../path-creation-modules/App';
import ExternalAccess from '../external-access/ExternalAccess';
import ApplicationsManagement from '../applications/ApplicationsManagement';
import ApiKeyManager from '../api-proxy/ApiKeyManager';
import FablabChatView from '../chat/FablabChatView';

// Importaciones adicionales para rutas
import ObjectsLibrary from '../objects/ObjectsLibrary';
import ProjectExplorer from '../objects/ProjectExplorer';
import NotebookAssembler from '../assembler/NotebookAssembler';
import LandingPageAssembler from '../assembler/LandingPageAssembler';
import AssemblerNew from '../assembler/AssemblerNew';
import DeployerNew from '../deployer/DeployerNew';
import Deployer from '../deployer/Deployer';
import Products from '../products/Products';

type Props = {
  user: UserProfile;
  isDark: boolean;
  onToggleTheme: () => void;
  onLogout: () => void;
};

const DefaultDashboardRedirect: React.FC = () => {
  const [targetPath, setTargetPath] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const resolveDefaultPath = async () => {
      try {
        const dbOrder = await loadSidebarOrderFromDatabase();
        if (!active) return;
        setTargetPath(getDefaultDashboardPath(dbOrder));
      } catch {
        if (!active) return;
        setTargetPath(getDefaultDashboardPath(loadSidebarOrder()));
      }
    };

    void resolveDefaultPath();
    return () => {
      active = false;
    };
  }, []);

  if (!targetPath) {
    return (
      <div className="p-6 text-sm text-gray-500 dark:text-gray-400">Cargando...</div>
    );
  }

  return <Navigate to={targetPath} replace />;
};

const FabLabLayout: React.FC<Props> = ({
  user,
  isDark,
  onToggleTheme,
  onLogout,
}) => {
  const location = useLocation();
  const { showBreadcrumbs, items: breadcrumbItems } = useBreadcrumbs();
  const isChatRoute = location.pathname.startsWith('/dashboard/chat');

  return (
    <div className="fablab-layout">
      {/* Header */}
      <div className="fablab-layout-header">
        <Header
          toggleTheme={onToggleTheme}
          isDark={isDark}
          title="dashboard"
        />
      </div>

      {/* Content: Sidebar + Router */}
      <div className="fablab-layout-content">
        {/* Sidebar */}
        <div className="fablab-layout-sidebar">
          <Sidebar onLogout={onLogout} />
        </div>

        {/* Router */}
        <div className={`fablab-layout-router ${isChatRoute ? 'chat-route' : ''}`}>
          <div className={`fablab-layout-router-wrapper ${isChatRoute ? 'chat-route' : 'default-route'}`}>
            {showBreadcrumbs && !isChatRoute && (
              <nav className="fablab-breadcrumbs" aria-label="Breadcrumb">
                <ol className="fablab-breadcrumbs-list">
                  {breadcrumbItems.map((item: BreadcrumbItem, idx: number) => {
                    const isLast = idx === breadcrumbItems.length - 1;
                    return (
                      <li key={`${item.href}-${idx}`} className="fablab-breadcrumb-item">
                        {isLast ? (
                          <span className="fablab-breadcrumb-active">{item.name}</span>
                        ) : (
                          <Link to={item.href} className="fablab-breadcrumb-link">
                            {item.name}
                          </Link>
                        )}
                        {!isLast && <span className="fablab-breadcrumb-separator">/</span>}
                      </li>
                    );
                  })}
                </ol>
              </nav>
            )}
            <Routes>
              {/* Rutas específicas para cada sección */}
              <Route path="/" element={<DefaultDashboardRedirect />} />
              <Route path="/chat" element={<FablabChatView />} />
              <Route path="/library" element={<Library />} />
              {/* Home routes */}
              <Route path="/objects-library" element={<ObjectsLibrary />} />
              <Route path="/objects-library/:id" element={<ProjectExplorer />} />

              <Route path="/profile" element={<ProfileSection user={user} />} />
              <Route path="/context" element={<AIContext />} />
              <Route path="/maker-path" element={<MakerPathView />} />
              <Route path="/maker-path/:id" element={<ProjectPlanner />} />
              <Route path="/project-builder" element={<ProjectBuilderView />} />
              <Route path="/creation-path" element={<CreationPathView />} />
              <Route path="/maker-path/modules/:id" element={<PathCreationModules />} />
              <Route path="/assembler" element={<AssemblerNew />} />
              <Route path="/assembler/notebook" element={<NotebookAssembler />} />
              <Route path="/assembler/landing_page" element={<LandingPageAssembler />} />
              <Route path="/assembler/new" element={<AssemblerNew />} />
              <Route path="/applications/new" element={<DeployerNew />} />
              <Route path="/applications/deployer" element={<Deployer />} />
              <Route path="/applications" element={<ApplicationsManagement />} />
              <Route path="/products" element={<Products />} />
              <Route path="/api-key-manager" element={<ApiKeyManager />} />
              <Route path="/tools" element={<ExternalAccess />} />
            </Routes>
          </div>
        </div>
      </div>

      {/* AIChat flotante (no en chat route) */}
      {!isChatRoute && <AIChat />}
    </div>
  );
};

export default FabLabLayout;
