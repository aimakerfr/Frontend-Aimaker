import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Server, ExternalLink, LogOut, Boxes, Package, Rocket, Blocks, Hammer, MessageSquare } from 'lucide-react';
import { useLanguage } from '../language/useLanguage';
import {
  loadSidebarOrder,
  loadSidebarOrderFromDatabase,
  normalizeSidebarOrder,
  saveSidebarOrder,
  type SidebarSectionKey,
} from './sidebar-order';

interface SidebarProps {
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const [sectionOrder, setSectionOrder] = useState<SidebarSectionKey[]>(() => loadSidebarOrder());

  useEffect(() => {
    let active = true;

    const hydrateOrderFromDatabase = async () => {
      const persistedOrder = await loadSidebarOrderFromDatabase();
      if (!active) return;
      setSectionOrder(persistedOrder);
      saveSidebarOrder(persistedOrder);
    };

    void hydrateOrderFromDatabase();

    return () => {
      active = false;
    };
  }, []);

  const menuItems: { key: SidebarSectionKey; path: string; label: string; icon: React.ReactNode }[] = [
    { key: 'chat', path: '/dashboard/chat', label: (t.sidebar as any)?.fablabChat || 'Fablab Chat', icon: <MessageSquare size={20} /> },
    { key: 'objectsLibrary', path: '/dashboard/objects-library', label: t.sidebar.objectsLibrary, icon: <Boxes size={20} /> },
    { key: 'projectBuilder', path: '/dashboard/project-builder', label: t.sidebar.projectBuilder, icon: <Hammer size={20} /> },
    { key: 'assembler', path: '/dashboard/assembler', label: t.sidebar.assembler, icon: <Blocks size={20} /> },
    // Project Builder section
    { 
      key: 'applications',
      path: '/dashboard/applications', 
      label: (t as any)?.applicationsManagement?.title ?? 'Applications Management', 
      icon: <Rocket size={20} /> 
    },
    { key: 'products', path: '/dashboard/products', label: (t as any).products?.title ?? 'Products', icon: <Package size={20} /> },
    { key: 'context', path: '/dashboard/context', label: t.sidebar.context, icon: <Server size={20} /> },
    { key: 'tools', path: '/dashboard/tools', label: t.sidebar.tools, icon: <ExternalLink size={20} /> },
  ];

  useEffect(() => {
    const handler = () => {
      setSectionOrder(loadSidebarOrder());
    };

    window.addEventListener('fablab:sidebar-order-changed', handler);
    return () => window.removeEventListener('fablab:sidebar-order-changed', handler);
  }, []);

  const orderedMenuItems = useMemo(() => {
    const normalized = normalizeSidebarOrder(sectionOrder);
    const rank = new Map(normalized.map((key, index) => [key, index]));
    return [...menuItems].sort((left, right) => {
      const leftRank = rank.get(left.key) ?? Number.MAX_SAFE_INTEGER;
      const rightRank = rank.get(right.key) ?? Number.MAX_SAFE_INTEGER;
      return leftRank - rightRank;
    });
  }, [menuItems, sectionOrder]);

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="w-64 md:w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full transition-colors duration-200">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
        <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
          A
        </div>
        {/* eslint-disable-next-line i18next/no-literal-string */}
        <span className="text-xl font-bold text-gray-800 dark:text-white">AiMaker</span>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {orderedMenuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-lg transition-colors min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-0 ${
              isActive(item.path)
                ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 font-medium'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {item.icon}
            <span className="truncate text-left">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-start gap-3 px-4 py-3 min-h-[44px] text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-0"
        >
          <LogOut size={20} />
          <span>{t.sidebar.signOut}</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;