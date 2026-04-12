import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Sidebar from '../../components/sidebar/Sidebar';
import Header from '../../components/header/Header';
import AIChat from '../../components/AIChat';
import { UserProfile } from '../../types';
import { useBreadcrumbs, BreadcrumbItem } from './FabLabLayoutHelper';
import { FabLabRoutes } from './FabLabRoutes';
import './FabLabLayout.css';

type Props = {
  user: UserProfile;
  isDark: boolean;
  onToggleTheme: () => void;
  onLogout: () => void;
};

const  FabLabLayout: React.FC<Props> = ({
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
            {showBreadcrumbs && (
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
            <FabLabRoutes user={user} />
          </div>
        </div>
      </div>

      {/* AIChat flotante (no en chat route) */}
      {!isChatRoute && <AIChat />}
    </div>
  );
};

export default FabLabLayout;
