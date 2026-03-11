import React from 'react';
import { Moon, Sun, Menu, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  toggleTheme: () => void;
  isDark: boolean;
  toggleSidebar: () => void;
  title: string;
}

const Header: React.FC<HeaderProps> = ({ toggleTheme, isDark, toggleSidebar, title }) => {
  const navigate = useNavigate();

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
          className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 border-2 border-white dark:border-gray-700 shadow-md hover:shadow-lg hover:scale-105 transition-all flex items-center justify-center group relative overflow-hidden"
          title="Ver mi perfil"
        >
          {/* User icon visible on hover */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <User size={18} className="text-white" />
          </div>
          {/* Animated gradient on hover */}
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-600 via-pink-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </button>
      </div>
    </header>
  );
};

export default Header;
