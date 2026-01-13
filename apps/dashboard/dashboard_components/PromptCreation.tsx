import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Save, MessageSquare, Tag, AlignLeft, Code, Sparkles, ChevronDown, Wand2, Globe, Users, Lock, Check, ChevronRight } from 'lucide-react';
import './styles/PromptCreation.css';

const AVAILABLE_TEAMS = ['Admin', 'Équipe RH', 'Équipe Dev', 'Marketing', 'Design'];

interface PromptCreationProps {
    onCancel: () => void;
    onSave: (data: any) => void;
    initialData?: any;
}

const PromptCreation = ({ onCancel, onSave, initialData }: PromptCreationProps) => {
    const [formData, setFormData] = useState({
        title: initialData?.name || '',
        description: initialData?.description || '',
        prompt: initialData?.prompt || '',
        category: initialData?.category || 'General',
        visibility: initialData?.visibility || 'PRIVATE',
        sharedWith: initialData?.sharedWith || []
    });

    const [isOptimizerOpen, setIsOptimizerOpen] = useState(false);
    const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
    const shareMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
                setIsShareMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const categories = ['General', 'Marketing', 'Coding', 'Writing', 'Creative', 'Education'];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const toggleTeam = (team: string) => {
        setFormData(prev => ({
            ...prev,
            sharedWith: prev.sharedWith.includes(team)
                ? prev.sharedWith.filter((t: string) => t !== team)
                : [...prev.sharedWith, team]
        }));
    };

    const getVisibilityConfig = (type: string) => {
        switch (type) {
            case 'PUBLIC': return { label: 'Public', icon: <Globe size={14} />, color: 'prompt-creation__visibility--public', bg: 'prompt-creation__visibility-bg--public' };
            case 'TEAM': return {
                label: `Équipes ${formData.sharedWith.length > 0 ? `(${formData.sharedWith.length})` : ''}`,
                icon: <Users size={14} />,
                color: 'prompt-creation__visibility--team',
                bg: 'prompt-creation__visibility-bg--team'
            };
            default: return { label: 'Privé', icon: <Lock size={14} />, color: 'prompt-creation__visibility--private', bg: 'prompt-creation__visibility-bg--private' };
        }
    };

    const currentVisibility = getVisibilityConfig(formData.visibility);

    return (
        <div className="prompt-creation">
            <div className="prompt-creation__header">
                <button
                    onClick={onCancel}
                    className="prompt-creation__back-btn"
                >
                    <ArrowLeft size={18} className="prompt-creation__back-icon" />
                    <span className="prompt-creation__back-text">Retour à la bibliothèque</span>
                </button>

                <div className="prompt-creation__header-actions">
                    <div className="prompt-creation__share-menu-wrapper" ref={shareMenuRef}>
                        <button
                            type="button"
                            onClick={() => setIsShareMenuOpen(!isShareMenuOpen)}
                            className={`prompt-creation__visibility-btn ${currentVisibility.bg}`}
                        >
                            <span className={currentVisibility.color}>{currentVisibility.icon}</span>
                            <span className="prompt-creation__visibility-label">{currentVisibility.label}</span>
                            <ChevronDown size={14} className={`prompt-creation__visibility-chevron ${isShareMenuOpen ? 'prompt-creation__visibility-chevron--open' : ''}`} />
                        </button>

                        {isShareMenuOpen && (
                            <div className="prompt-creation__share-menu">
                                <div className="prompt-creation__share-menu-main">
                                    {[
                                        { id: 'PRIVATE', label: 'Privé', desc: 'Seulement vous', icon: <Lock size={16} /> },
                                        { id: 'PUBLIC', label: 'Public', desc: 'Tout le monde', icon: <Globe size={16} /> },
                                        { id: 'TEAM', label: 'Équipes', desc: 'Sélectionner...', icon: <Users size={16} /> }
                                    ].map((opt) => (
                                        <div
                                            key={opt.id}
                                            onClick={() => setFormData({ ...formData, visibility: opt.id })}
                                            className={`prompt-creation__share-option ${formData.visibility === opt.id ? 'prompt-creation__share-option--active' : ''}`}
                                        >
                                            <div className="prompt-creation__share-option-content">
                                                <div className={`prompt-creation__share-option-icon ${formData.visibility === opt.id ? 'prompt-creation__share-option-icon--active' : ''}`}>
                                                    {opt.icon}
                                                </div>
                                                <div className="prompt-creation__share-option-text">
                                                    <p className={`prompt-creation__share-option-label ${formData.visibility === opt.id ? 'prompt-creation__share-option-label--active' : ''}`}>{opt.label}</p>
                                                    <p className="prompt-creation__share-option-desc">{opt.desc}</p>
                                                </div>
                                            </div>
                                            {opt.id === 'TEAM' && <ChevronRight size={14} className="prompt-creation__share-option-arrow" />}
                                            {formData.visibility === opt.id && opt.id !== 'TEAM' && <Check size={14} className="prompt-creation__share-option-check" />}
                                        </div>
                                    ))}
                                </div>

                                {/* Teams Sub-menu */}
                                {formData.visibility === 'TEAM' && (
                                    <div className="prompt-creation__teams-menu">
                                        <p className="prompt-creation__teams-menu-title">Choisir les équipes</p>
                                        {AVAILABLE_TEAMS.map(team => (
                                            <label key={team} className="prompt-creation__team-option">
                                                <div className="prompt-creation__team-checkbox-wrapper">
                                                    <input
                                                        type="checkbox"
                                                        className="prompt-creation__team-checkbox"
                                                        checked={formData.sharedWith.includes(team)}
                                                        onChange={() => toggleTeam(team)}
                                                    />
                                                    <Check size={10} className="prompt-creation__team-checkmark" />
                                                </div>
                                                <span className={`prompt-creation__team-label ${formData.sharedWith.includes(team) ? 'prompt-creation__team-label--checked' : ''}`}>
                                                    {team}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleSubmit}
                        className="prompt-creation__save-btn"
                    >
                        <Save size={18} />
                        {initialData ? 'Mettre à jour' : 'Enregistrer'}
                    </button>
                </div>
            </div>

            <div className="prompt-creation__card">
                <div className="prompt-creation__card-header">
                    <div className="prompt-creation__card-header-content">
                        <div className="prompt-creation__card-icon">
                            <MessageSquare size={24} />
                        </div>
                        <div>
                            <h1 className="prompt-creation__card-title">
                                {initialData ? 'Détails du Prompt' : 'Nouveau Prompt'}
                            </h1>
                            <p className="prompt-creation__card-subtitle">Définissez les instructions et le contexte pour votre IA.</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="prompt-creation__form">
                    <div className="prompt-creation__form-row">
                        <div className="prompt-creation__form-group">
                            <label className="prompt-creation__label">
                                <Tag size={12} /> Titre du Prompt
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="ex: Générateur de mails marketing"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="prompt-creation__input"
                            />
                        </div>
                        <div className="prompt-creation__form-group">
                            <label className="prompt-creation__label">
                                <Code size={12} /> Catégorie
                            </label>
                            <div className="prompt-creation__select-wrapper">
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="prompt-creation__select"
                                >
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                                <ChevronDown size={14} className="prompt-creation__select-icon" />
                            </div>
                        </div>
                    </div>
                    <div className="prompt-creation__form-group">
                        <label className="prompt-creation__label">
                            <AlignLeft size={12} /> Description courte
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="Décrivez brièvement ce que fait ce prompt..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="prompt-creation__input"
                        />
                    </div>
                    <div className="prompt-creation__prompt-section">
                        <div className="prompt-creation__form-group">
                            <label className="prompt-creation__label">
                                <MessageSquare size={12} /> Contenu du Prompt
                            </label>
                            <textarea
                                required
                                rows={8}
                                placeholder="Rédigez ici les instructions détaillées..."
                                value={formData.prompt}
                                onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                                className="prompt-creation__textarea"
                            />
                        </div>
                        <div className="prompt-creation__optimizer-section">
                            <button
                                type="button"
                                onClick={() => setIsOptimizerOpen(!isOptimizerOpen)}
                                className={`prompt-creation__optimizer-toggle ${isOptimizerOpen ? 'prompt-creation__optimizer-toggle--open' : ''}`}
                            >
                                <div className="prompt-creation__optimizer-toggle-content">
                                    <div className={`prompt-creation__optimizer-icon ${isOptimizerOpen ? 'prompt-creation__optimizer-icon--open' : ''}`}>
                                        <Sparkles size={18} />
                                    </div>
                                    <div className="prompt-creation__optimizer-text">
                                        <span className="prompt-creation__optimizer-title">Optimiseur Universel de Prompts</span>
                                        <span className="prompt-creation__optimizer-subtitle">Outil optionnel d'amélioration IA</span>
                                    </div>
                                </div>
                                <div className="prompt-creation__optimizer-toggle-right">
                                    <span className="prompt-creation__optimizer-badge">Pro</span>
                                    <ChevronDown size={18} className={`prompt-creation__optimizer-chevron ${isOptimizerOpen ? 'prompt-creation__optimizer-chevron--open' : ''}`} />
                                </div>
                            </button>
                            {isOptimizerOpen && (
                                <div className="prompt-creation__optimizer-content">
                                    <div className="prompt-creation__optimizer-options">
                                        {[{ label: 'Clarté Maximale', desc: 'Structure logique' }, { label: 'Contraintes IA', desc: 'Règles strictes' }, { label: 'Format Pro', desc: 'Sortie structurée' }].map((opt, i) => (
                                            <div key={i} className="prompt-creation__optimizer-option">
                                                <div className="prompt-creation__optimizer-option-checkbox">
                                                    <div className="prompt-creation__optimizer-option-checkmark"></div>
                                                </div>
                                                <div className="prompt-creation__optimizer-option-text">
                                                    <span className="prompt-creation__optimizer-option-label">{opt.label}</span>
                                                    <span className="prompt-creation__optimizer-option-desc">{opt.desc}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="prompt-creation__optimizer-footer">
                                        <p className="prompt-creation__optimizer-quote">"Cet outil analyse votre prompt para y injecter des frameworks de pensée."</p>
                                        <button type="button" className="prompt-creation__optimizer-apply-btn">
                                            <Wand2 size={14} />
                                            <span>Appliquer la magie</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PromptCreation;
