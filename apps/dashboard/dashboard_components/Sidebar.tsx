import { useState, useRef, useEffect } from 'react';
import {
    Plus,
    BookOpen,
    Share2,
    ChevronDown,
    PanelLeftClose,
    PanelLeft,
    User,
    LogOut,
    MessageSquare,
    Bot,
    Folder,
    Book,
    Search,
    X,
    LayoutGrid
} from 'lucide-react';
import { useAuth } from '../../../core/src/auth/useAuth';
import { TYPE_CONFIG } from '../constants';
import './styles/Sidebar.css';

const Logo = ({ className = "logo-default" }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 2L91.5692 26V74L50 98L8.43079 74V26L50 2Z" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
        <path d="M50 2V50M91.5692 26L50 50M91.5692 74L50 50M50 98V50M8.43079 74L50 50M8.43079 26L50 50" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <path d="M70.7846 38V62L50 74L29.2154 62V38L50 26L70.7846 38Z" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
    </svg>
);

interface SidebarProps {
    onNew: (type: string) => void;
    onViewChange: (view: string) => void;
    currentView: string;
}

const Sidebar = ({ onNew, onViewChange, currentView }: SidebarProps) => {
    const [isPinned, setIsPinned] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);

    const { logout } = useAuth();
    const userMenuRef = useRef<HTMLDivElement>(null);
    const newMenuRef = useRef<HTMLDivElement>(null);

    const isExpanded = isPinned || isHovered;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
            if (newMenuRef.current && !newMenuRef.current.contains(event.target as Node)) {
                setIsNewMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const navItems = [
        { icon: <LayoutGrid size={20} />, label: 'Bibliothèque', count: 0, view: 'LIBRARY' },
        { icon: <BookOpen size={20} />, label: 'Apprendre', count: 4, view: 'LEARNING' },
        { icon: <Share2 size={20} />, label: 'Partager', count: 12, view: 'SHARED' },
    ];

    const creationOptions = [
        { type: 'PROMPT', label: 'Prompt', icon: <MessageSquare size={16} /> },
        { type: 'AGENT', label: 'Agent', icon: <Bot size={16} /> },
        { type: 'PROJECT', label: 'Project', icon: <Folder size={16} /> },
        { type: 'NOTEBOOK', label: 'Notebook', icon: <Book size={16} /> },
        { type: 'RECHERCHE', label: 'Recherche', icon: <Search size={16} /> },
    ];

    return (
        <aside
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => {
                setIsHovered(false);
                setIsNewMenuOpen(false);
            }}
            className={`sidebar ${isExpanded ? 'sidebar--expanded' : ''}`}
        >
            {/* Branding & Collapse */}
            <div className={`sidebar__header ${isExpanded ? '' : 'sidebar__header--centered'}`}>
                <div className="sidebar__branding">
                    <Logo className="sidebar__logo" />
                    {isExpanded && (
                        <h2 className="sidebar__title">
                            Aimaker<br /><span className="sidebar__subtitle">Fablab</span>
                        </h2>
                    )}
                </div>
                {isExpanded && (
                    <button
                        onClick={() => setIsPinned(!isPinned)}
                        className="sidebar__pin-btn"
                    >
                        {isPinned ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
                    </button>
                )}
            </div>

            {/* Action Button Section */}
            <div className="sidebar__action-wrapper" ref={newMenuRef}>
                <button
                    onClick={() => {
                        if (!isExpanded) {
                            setIsPinned(true);
                        }
                        setIsNewMenuOpen(!isNewMenuOpen);
                    }}
                    className={`sidebar__new-btn ${isExpanded ? 'sidebar__new-btn--expanded' : ''}`}
                >
                    <div className="sidebar__new-btn-content">
                        <Plus size={24} className={`sidebar__new-icon ${isNewMenuOpen ? 'sidebar__new-icon--rotated' : ''}`} />
                        {isExpanded && <span className="sidebar__new-text">Faire</span>}
                    </div>
                    {isExpanded && <ChevronDown size={16} className={`sidebar__new-chevron ${isNewMenuOpen ? 'sidebar__new-chevron--open' : ''}`} />}
                </button>

                {/* New Creation Menu Popover */}
                {isNewMenuOpen && isExpanded && (
                    <div className="sidebar__new-menu">
                        <div className="sidebar__new-menu-header">
                            <span className="sidebar__new-menu-title">Nouveau Ressource</span>
                            <X size={12} className="sidebar__new-menu-close" onClick={() => setIsNewMenuOpen(false)} />
                        </div>
                        {creationOptions.map((option) => (
                            <button
                                key={option.type}
                                onClick={() => {
                                    onNew(option.type);
                                    setIsNewMenuOpen(false);
                                }}
                                className="sidebar__new-menu-item"
                            >
                                <div className={`sidebar__new-menu-icon ${TYPE_CONFIG[option.type]?.bg || ''} ${TYPE_CONFIG[option.type]?.color || ''}`}>
                                    {option.icon}
                                </div>
                                <span className="sidebar__new-menu-label">{option.label}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Main Navigation */}
            <nav className="sidebar__nav">
                {navItems.map((item, idx) => (
                    <div
                        key={idx}
                        onClick={() => onViewChange(item.view)}
                        className={`sidebar__nav-item ${isExpanded ? '' : 'sidebar__nav-item--collapsed'} ${currentView === item.view ? 'sidebar__nav-item--active' : ''}`}
                        title={!isExpanded ? item.label : ''}
                    >
                        <div className="sidebar__nav-item-content">
                            <span className={`sidebar__nav-icon ${currentView === item.view ? 'sidebar__nav-icon--active' : ''}`}>{item.icon}</span>
                            {isExpanded && <span className={`sidebar__nav-label ${currentView === item.view ? 'sidebar__nav-label--active' : ''}`}>{item.label}</span>}
                        </div>
                        {isExpanded && item.count > 0 && (
                            <span className={`sidebar__nav-badge ${currentView === item.view ? 'sidebar__nav-badge--active' : ''}`}>
                                {item.count}
                            </span>
                        )}
                    </div>
                ))}
            </nav>

            {/* User Footer */}
            <div className="sidebar__user-footer" ref={userMenuRef}>
                <div
                    onClick={() => {
                        if (!isExpanded) setIsPinned(true);
                        setIsUserMenuOpen(!isUserMenuOpen);
                    }}
                    className={`sidebar__user-info ${isExpanded ? '' : 'sidebar__user-info--collapsed'} ${isUserMenuOpen ? 'sidebar__user-info--open' : ''}`}
                >
                    <div className="sidebar__user-avatar-wrapper">
                        <div className="sidebar__user-avatar">
                            A
                        </div>
                        {isExpanded && (
                            <div className="sidebar__user-details">
                                <span className="sidebar__user-name">admin</span>
                                <span className="sidebar__user-status">Connecté</span>
                            </div>
                        )}
                    </div>
                    {isExpanded && <ChevronDown size={16} className={`sidebar__user-chevron ${isUserMenuOpen ? 'sidebar__user-chevron--open' : ''}`} />}
                </div>

                {/* User Menu Popover */}
                {isUserMenuOpen && isExpanded && (
                    <div className="sidebar__user-menu">
                        <button className="sidebar__user-menu-item">
                            <User size={16} className="sidebar__user-menu-icon" />
                            <span className="sidebar__user-menu-label">Profil</span>
                        </button>
                        <div className="sidebar__user-menu-divider" />
                        <button 
                            className="sidebar__user-menu-item sidebar__user-menu-item--logout"
                            onClick={logout}
                        >
                            <LogOut size={16} />
                            <span className="sidebar__user-menu-label">Déconnexion</span>
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;
