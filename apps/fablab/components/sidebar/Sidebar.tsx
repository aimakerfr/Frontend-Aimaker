import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Server, ExternalLink, LogOut, Boxes, Package, Rocket, Blocks, Hammer, MessageSquare } from 'lucide-react';
import { useLanguage } from '../../language/useLanguage';
import {
  SIDEBAR_PATH_BY_KEY,
  loadSidebarOrder,
  loadSidebarOrderFromDatabase,
  normalizeSidebarOrder,
  saveSidebarOrder,
  type SidebarSectionKey,
} from '../sidebar-order';
import './style.css';

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
    { key: 'chat', path: SIDEBAR_PATH_BY_KEY.chat, label: (t.sidebar as any)?.fablabChat || 'Fablab Chat', icon: <MessageSquare size={20} /> },
    { key: 'objectsLibrary', path: SIDEBAR_PATH_BY_KEY.objectsLibrary, label: t.sidebar.objectsLibrary, icon: <Boxes size={20} /> },
    { key: 'projectBuilder', path: SIDEBAR_PATH_BY_KEY.projectBuilder, label: t.sidebar.projectBuilder, icon: <Hammer size={20} /> },
    { key: 'assembler', path: SIDEBAR_PATH_BY_KEY.assembler, label: t.sidebar.assembler, icon: <Blocks size={20} /> },
    // Project Builder section
    { 
      key: 'applications',
      path: SIDEBAR_PATH_BY_KEY.applications, 
      label: (t as any)?.applicationsManagement?.title ?? 'Applications Management', 
      icon: <Rocket size={20} /> 
    },
    { key: 'products', path: SIDEBAR_PATH_BY_KEY.products, label: (t as any).products?.title ?? 'Products', icon: <Package size={20} /> },
    { key: 'context', path: SIDEBAR_PATH_BY_KEY.context, label: t.sidebar.context, icon: <Server size={20} /> },
    { key: 'tools', path: SIDEBAR_PATH_BY_KEY.tools, label: t.sidebar.tools, icon: <ExternalLink size={20} /> },
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
    <aside className="fablab-sidebar">
      <div className="fablab-sidebar-header">
        <div className="fablab-sidebar-logo">
          A
        </div>
        <span className="fablab-sidebar-title">AiMaker</span>
      </div>

      <nav className="fablab-sidebar-nav">
        {orderedMenuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`fablab-sidebar-item ${isActive(item.path) ? 'active' : ''}`}
          >
            <span className="fablab-sidebar-item-icon">{item.icon}</span>
            <span className="fablab-sidebar-item-text">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="fablab-sidebar-footer">
        <button 
          onClick={onLogout}
          className="fablab-sidebar-logout"
        >
          <LogOut size={20} />
          <span className="fablab-sidebar-logout-text">{t.sidebar.signOut}</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
