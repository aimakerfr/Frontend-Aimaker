import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Save, Bot, Tag, AtSign, Cpu, MessageSquare, ChevronDown, Globe, Users, Lock, Check, ChevronRight } from 'lucide-react';
import './styles/AgentCreation.css';

interface AgentData {
  name?: string;
  slug?: string;
  model?: string;
  instructions?: string;
  visibility?: 'PUBLIC' | 'TEAM' | 'PRIVATE';
  sharedWith?: string[];
}

interface AgentCreationProps {
  onCancel: () => void;
  onSave: (data: FormData) => void;
  initialData?: AgentData;
}

interface FormData {
  title: string;
  slug: string;
  model: string;
  instructions: string;
  visibility: 'PUBLIC' | 'TEAM' | 'PRIVATE';
  sharedWith: string[];
}

const AVAILABLE_TEAMS = ['Admin', 'Équipe RH', 'Équipe Dev', 'Marketing', 'Design'];

const AgentCreation: React.FC<AgentCreationProps> = ({ onCancel, onSave, initialData }) => {
  const [formData, setFormData] = useState<FormData>({
    title: initialData?.name || '',
    slug: initialData?.slug || (initialData?.name ? initialData.name.toLowerCase().replace(/\s+/g, '-') : ''),
    model: initialData?.model || 'gemini-3-pro-preview',
    instructions: initialData?.instructions || '',
    visibility: initialData?.visibility || 'PRIVATE',
    sharedWith: initialData?.sharedWith || []
  });

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

  const models = [
    { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro (Recommandé)' },
    { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash (Rapide)' },
    { id: 'gpt-4o', name: 'GPT-4o' },
    { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet' }
  ];

  const toggleTeam = (team: string) => {
    setFormData(prev => ({
      ...prev,
      sharedWith: prev.sharedWith.includes(team)
        ? prev.sharedWith.filter(t => t !== team)
        : [...prev.sharedWith, team]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  interface VisibilityConfig {
    label: string;
    icon: React.ReactNode;
    color: string;
    bg: string;
  }

  const getVisibilityConfig = (type: 'PUBLIC' | 'TEAM' | 'PRIVATE'): VisibilityConfig => {
    switch (type) {
      case 'PUBLIC': return { label: 'Public', icon: <Globe size={14} />, color: 'agent-creation__visibility--public', bg: 'agent-creation__visibility-bg--public' };
      case 'TEAM': return {
        label: `Équipes ${formData.sharedWith.length > 0 ? `(${formData.sharedWith.length})` : ''}`,
        icon: <Users size={14} />,
        color: 'agent-creation__visibility--team',
        bg: 'agent-creation__visibility-bg--team'
      };
      default: return { label: 'Privé', icon: <Lock size={14} />, color: 'agent-creation__visibility--private', bg: 'agent-creation__visibility-bg--private' };
    }
  };

  const currentVisibility = getVisibilityConfig(formData.visibility);

  return (
    <div className="agent-creation">
      <div className="agent-creation__header">
        <button onClick={onCancel} className="agent-creation__back-btn">
          <ArrowLeft size={18} className="agent-creation__back-icon" />
          <span className="agent-creation__back-text">Retour à la bibliothèque</span>
        </button>

        <div className="agent-creation__header-actions">
          <div className="agent-creation__share-menu-wrapper" ref={shareMenuRef}>
            <button
              type="button"
              onClick={() => setIsShareMenuOpen(!isShareMenuOpen)}
              className={`agent-creation__visibility-btn ${currentVisibility.bg}`}
            >
              <span className={currentVisibility.color}>{currentVisibility.icon}</span>
              <span className="agent-creation__visibility-label">{currentVisibility.label}</span>
              <ChevronDown size={14} className={`agent-creation__visibility-chevron ${isShareMenuOpen ? 'agent-creation__visibility-chevron--open' : ''}`} />
            </button>

            {isShareMenuOpen && (
              <div className="agent-creation__share-menu">
                <div className="agent-creation__share-menu-main">
                  {[
                    { id: 'PRIVATE' as const, label: 'Privé', desc: 'Seulement vous', icon: <Lock size={16} /> },
                    { id: 'PUBLIC' as const, label: 'Public', desc: 'Tout le monde', icon: <Globe size={16} /> },
                    { id: 'TEAM' as const, label: 'Équipes', desc: 'Sélectionner...', icon: <Users size={16} /> }
                  ].map((opt) => (
                    <div
                      key={opt.id}
                      onClick={() => setFormData({ ...formData, visibility: opt.id })}
                      className={`agent-creation__share-option ${formData.visibility === opt.id ? 'agent-creation__share-option--active' : ''}`}
                    >
                      <div className="agent-creation__share-option-content">
                        <div className={`agent-creation__share-option-icon ${formData.visibility === opt.id ? 'agent-creation__share-option-icon--active' : ''}`}>
                          {opt.icon}
                        </div>
                        <div className="agent-creation__share-option-text">
                          <p className={`agent-creation__share-option-label ${formData.visibility === opt.id ? 'agent-creation__share-option-label--active' : ''}`}>{opt.label}</p>
                          <p className="agent-creation__share-option-desc">{opt.desc}</p>
                        </div>
                      </div>
                      {opt.id === 'TEAM' && <ChevronRight size={14} className="agent-creation__share-option-arrow" />}
                      {formData.visibility === opt.id && opt.id !== 'TEAM' && <Check size={14} className="agent-creation__share-option-check" />}
                    </div>
                  ))}
                </div>

                {formData.visibility === 'TEAM' && (
                  <div className="agent-creation__teams-menu">
                    <p className="agent-creation__teams-menu-title">Choisir les équipes</p>
                    {AVAILABLE_TEAMS.map(team => (
                      <label key={team} className="agent-creation__team-option">
                        <div className="agent-creation__team-checkbox-wrapper">
                          <input
                            type="checkbox"
                            className="agent-creation__team-checkbox"
                            checked={formData.sharedWith.includes(team)}
                            onChange={() => toggleTeam(team)}
                          />
                          <Check size={10} className="agent-creation__team-checkmark" />
                        </div>
                        <span className={`agent-creation__team-label ${formData.sharedWith.includes(team) ? 'agent-creation__team-label--checked' : ''}`}>
                          {team}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <button onClick={handleSubmit} className="agent-creation__save-btn">
            <Save size={18} />
            {initialData ? 'Mettre à jour' : 'Enregistrer'}
          </button>
        </div>
      </div>

      <div className="agent-creation__card">
        <div className="agent-creation__card-header">
          <div className="agent-creation__card-header-content">
            <div className="agent-creation__card-icon">
              <Bot size={24} />
            </div>
            <div>
              <h1 className="agent-creation__card-title">
                {initialData ? "Détails de l'Agent" : 'Nouveau Agent'}
              </h1>
              <p className="agent-creation__card-subtitle">Configurez un agent spécialisé con sa personalidad y sus instrucciones.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="agent-creation__form-wrapper">
          <div className="agent-creation__form-row">
            <div className="agent-creation__form-group">
              <label className="agent-creation__label">
                <Tag size={12} /> Titre de l'Agent
              </label>
              <input
                type="text"
                required
                placeholder="ex: Expert en Marketing Digital"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="agent-creation__input"
              />
            </div>
            <div className="agent-creation__form-group">
              <label className="agent-creation__label">
                <AtSign size={12} /> Identifiant unique (Slug)
              </label>
              <div className="agent-creation__slug-wrapper">
                <span className="agent-creation__slug-prefix">@</span>
                <input
                  type="text"
                  required
                  placeholder="nom-de-l-agent"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  className="agent-creation__input agent-creation__input--slug"
                />
              </div>
            </div>
          </div>
          <div className="agent-creation__form-group">
            <label className="agent-creation__label">
              <Cpu size={12} /> Modèle IA
            </label>
            <div className="agent-creation__select-wrapper">
              <select
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="agent-creation__select"
              >
                {models.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="agent-creation__select-icon" />
            </div>
          </div>
          <div className="agent-creation__form-group">
            <label className="agent-creation__label">
              <MessageSquare size={12} /> Instructions (System Prompt)
            </label>
            <textarea
              required
              rows={12}
              placeholder="Définissez ici le rôle, le ton et les comportements de l'agent..."
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              className="agent-creation__textarea"
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default AgentCreation;
