import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, User, Server, ExternalLink, LogOut, Library as LibraryIcon, Route } from 'lucide-react';
import { useLanguage } from '../language/useLanguage';
import { translations } from '../language/translations';

interface SidebarProps {
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const t = translations[language];

  const menuItems: { path: string; label: string; icon: React.ReactNode }[] = [
    { path: '/dashboard/profile', label: t.sidebar.profile, icon: <User size={20} /> },
    { path: '/dashboard/library', label: t.sidebar.library, icon: <LibraryIcon size={20} /> },
    { path: '/dashboard/context', label: t.sidebar.context, icon: <Server size={20} /> },
    { path: '/dashboard/maker-path', label: t.sidebar.makerPath, icon: <Route size={20} /> },
    { path: '/dashboard/tools', label: t.sidebar.tools, icon: <ExternalLink size={20} /> },
  ];

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full transition-colors duration-200 fixed left-0 top-0 bottom-0 z-10 md:relative">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
        <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
          A
        </div>
        <span className="text-xl font-bold text-gray-800 dark:text-white">AiMaker</span>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive(item.path)
                ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 font-medium'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          <span>{t.sidebar.signOut}</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;