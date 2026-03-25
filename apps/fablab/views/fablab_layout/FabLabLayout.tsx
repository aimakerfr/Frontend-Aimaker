import React, { useMemo } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
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
import Products from '../products/Products';
import MyDashboard from '../dashboard/MyDashboard';
import NotebookAssembler from '../assembler/NotebookAssemblerLite';
import LandingPageAssembler from '../assembler/LandingPageAssembler';
import AssemblerNew from '../assembler/AssemblerNew';
import DeployerNew from '../../modules/deployer-new/View';
import Deployer from '../deployer/Deployer';
import { UserProfile } from '../../types';
import ApplicationsManagement from '../applications/ApplicationsManagement';
import { useLanguage } from '../../language/useLanguage';

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
  const location = useLocation();
  const { t } = useLanguage();

  // Compute breadcrumbs only for specific routes
  const { showBreadcrumbs, items: breadcrumbItems } = useMemo(() => {
    const pathname = location.pathname;
    const search = location.search;

    // Helper to read id from query string
    const params = new URLSearchParams(search);
    const id = params.get('id');

    const base = [
      { name: t?.sidebar?.dashboard ?? 'Dashboard', href: '/dashboard' },
    ];

    // /dashboard/applications
    if (pathname === '/dashboard/applications') {
      return {
        showBreadcrumbs: true,
        items: [
          ...base,
          { name: (t as any)?.applicationsManagement?.title ?? 'Applications', href: '/dashboard/applications' },
        ],
      };
    }

    // /dashboard/applications/new
    if (pathname === '/dashboard/applications/new') {
      return {
        showBreadcrumbs: true,
        items: [
          ...base,
          { name: (t as any)?.applicationsManagement?.title ?? 'Applications', href: '/dashboard/applications' },
          { name: (t as any)?.common?.create ?? 'Create', href: '/dashboard/applications/new' },
        ],
      };
    }

    // /dashboard/applications/deployer?id={id}
    if (pathname === '/dashboard/applications/deployer' && id) {
      return {
        showBreadcrumbs: true,
        items: [
          ...base,
          { name: (t as any)?.deployProjectTranslations?.title ?? 'Deployer', href: '/dashboard/applications' },
          { name: `#${id}`, href: `/dashboard/applications/deployer?id=${id}` },
        ],
      };
    }

    return { showBreadcrumbs: false, items: [] as { name: string; href: string }[] };
  }, [location.pathname, location.search, t]);

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
            {showBreadcrumbs && (
              <nav className="mb-4 text-sm" aria-label="Breadcrumb">
                <ol className="flex flex-wrap items-center gap-1 text-gray-500 dark:text-gray-400">
                  {breadcrumbItems.map((item, idx) => {
                    const isLast = idx === breadcrumbItems.length - 1;
                    return (
                      <li key={`${item.href}-${idx}`} className="flex items-center">
                        {isLast ? (
                          <span className="font-medium text-gray-900 dark:text-gray-100">{item.name}</span>
                        ) : (
                          <Link to={item.href} className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                            {item.name}
                          </Link>
                        )}
                        {!isLast && <span className="mx-2 text-gray-400">/</span>}
                      </li>
                    );
                  })}
                </ol>
              </nav>
            )}
            <Routes>
              {/* Rutas específicas para cada sección */}
              <Route path="/" element={<MyDashboard />} />
              <Route path="/library" element={<Library />} />
              {/* Home routes */}
              <Route path="/objects-library" element={<ObjectsLibrary />} />

              <Route path="/profile" element={<ProfileSection user={user} />} />
              <Route path="/context" element={<AIContext />} />
              <Route path="/maker-path" element={<MakerPathView />} />
              <Route path="/maker-path/:id" element={<ProjectPlanner />} />
              <Route path="/maker-path/modules/:id" element={<PathCreationModules />} />
              <Route path="/assembler/notebook" element={<NotebookAssembler />} />
              <Route path="/assembler/landing_page" element={<LandingPageAssembler />} />
              <Route path="/assembler/new" element={<AssemblerNew />} />
              <Route path="/applications/new" element={<DeployerNew />} />
              <Route path="/applications/deployer" element={<Deployer />} />
              <Route path="/applications" element={<ApplicationsManagement />} />
              <Route path="/products" element={<Products />} />
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
