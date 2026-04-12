import React from 'react';
import { Moon, Sun, Menu, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../language/useLanguage';
import './style.css';

interface HeaderProps {
  toggleTheme: () => void;
  isDark: boolean;
  toggleSidebar?: () => void;
  title: string;
}

const Header: React.FC<HeaderProps> = ({ toggleTheme, isDark, toggleSidebar, title }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <header className="fablab-header">
      <div className="fablab-header-left">
        <button onClick={toggleSidebar} className="fablab-header-menu-btn">
          <Menu size={24} />
        </button>
        <h1 className="fablab-header-title">{title.replace(/([A-Z])/g, ' $1').trim()}</h1>
      </div>

      <div className="fablab-header-right">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="fablab-header-theme-btn"
          title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        
        {/* Profile Button */}
        <button
          onClick={() => navigate('/dashboard/profile')}
          className="fablab-header-profile-btn"
          title={t.sidebar.profile}
        >
          <span className="fablab-header-profile-icon">
            <User size={16} />
          </span>
          <span className="fablab-header-profile-text">{t.sidebar.profile}</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
