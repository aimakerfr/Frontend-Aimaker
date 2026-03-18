import React from 'react';
import { Moon, Sun, Menu, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../language/useLanguage';

interface HeaderProps {
  toggleTheme: () => void;
  isDark: boolean;
  toggleSidebar: () => void;
  title: string;
}

const Header: React.FC<HeaderProps> = ({ toggleTheme, isDark, toggleSidebar, title }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 sticky top-0 z-20 transition-colors duration-200">
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="md:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <Menu size={24} />
        </button>
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white capitalize">{title.replace(/([A-Z])/g, ' $1').trim()}</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        
        {/* Profile Button */}
        <button
          onClick={() => navigate('/dashboard/profile')}
          className="group inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sky-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-300 hover:bg-sky-100 hover:shadow-md dark:border-sky-800/70 dark:bg-sky-900/20 dark:text-sky-300"
          title={t.sidebar.profile}
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white text-sky-600 ring-1 ring-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:ring-sky-800">
            <User size={16} />
          </span>
          <span className="text-xs font-semibold tracking-wide">{t.sidebar.profile}</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
