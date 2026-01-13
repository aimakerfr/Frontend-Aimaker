import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Save, Book, Tag, Code, Link as LinkIcon, AlignLeft, ChevronDown, Globe, Users, Lock, Check, ChevronRight } from 'lucide-react';
import './styles/NotebookCreation.css';

const AVAILABLE_TEAMS = ['Admin', 'Équipe RH', 'Équipe Dev', 'Marketing', 'Design'];

interface NotebookCreationProps {
  onCancel: () => void;
  onSave: (data: any) => void;
  initialData?: any;
}

export default function NotebookCreation({ onCancel, onSave, initialData }: NotebookCreationProps) {
  const [formData, setFormData] = useState({
    title: initialData?.name || '',
    category: initialData?.category || 'Analyse',
    url: initialData?.link || '',
    description: initialData?.description || '',
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

  const categories = ['Analyse', 'Recherche', 'Tutoriel', 'Expérimentation', 'Documentation', 'Autre'];

  const toggleTeam = (team: string) => {
    setFormData(prev => ({
      ...prev,
      sharedWith: prev.sharedWith.includes(team)
        ? prev.sharedWith.filter((t: string) => t !== team)
        : [...prev.sharedWith, team]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const getVisibilityConfig = (type: string) => {
    switch (type) {
      case 'PUBLIC': return { label: 'Public', icon: <Globe size={14} />, color: 'notebook-creation__visibility--public', bg: 'notebook-creation__visibility-bg--public' };
      case 'TEAM': return {
        label: `Équipes ${formData.sharedWith.length > 0 ? `(${formData.sharedWith.length})` : ''}`,
        icon: <Users size={14} />,
        color: 'notebook-creation__visibility--team',
        bg: 'notebook-creation__visibility-bg--team'
      };
      default: return { label: 'Privé', icon: <Lock size={14} />, color: 'notebook-creation__visibility--private', bg: 'notebook-creation__visibility-bg--private' };
    }
  };

  const currentVisibility = getVisibilityConfig(formData.visibility);

  return (
    <div className="notebook-creation">
      <div className="notebook-creation__header">
        <button onClick={onCancel} className="notebook-creation__back-btn">
          <ArrowLeft size={18} className="notebook-creation__back-icon" />
          <span className="notebook-creation__back-text">Retour à la bibliothèque</span>
        </button>

        <div className="notebook-creation__header-actions">
          <div className="notebook-creation__share-menu-wrapper" ref={shareMenuRef}>
            <button
              type="button"
              onClick={() => setIsShareMenuOpen(!isShareMenuOpen)}
              className={`notebook-creation__visibility-btn ${currentVisibility.bg}`}
            >
              <span className={currentVisibility.color}>{currentVisibility.icon}</span>
              <span className="notebook-creation__visibility-label">{currentVisibility.label}</span>
              <ChevronDown size={14} className={`notebook-creation__visibility-chevron ${isShareMenuOpen ? 'notebook-creation__visibility-chevron--open' : ''}`} />
            </button>

            {isShareMenuOpen && (
              <div className="notebook-creation__share-menu">
                <div className="notebook-creation__share-menu-main">
                  {[
                    { id: 'PRIVATE', label: 'Privé', desc: 'Seulement vous', icon: <Lock size={16} /> },
                    { id: 'PUBLIC', label: 'Public', desc: 'Tout le monde', icon: <Globe size={16} /> },
                    { id: 'TEAM', label: 'Équipes', desc: 'Sélectionner...', icon: <Users size={16} /> }
                  ].map((opt) => (
                    <div
                      key={opt.id}
                      onClick={() => setFormData({ ...formData, visibility: opt.id })}
                      className={`notebook-creation__share-option ${formData.visibility === opt.id ? 'notebook-creation__share-option--active' : ''}`}
                    >
                      <div className="notebook-creation__share-option-content">
                        <div className={`notebook-creation__share-option-icon ${formData.visibility === opt.id ? 'notebook-creation__share-option-icon--active' : ''}`}>
                          {opt.icon}
                        </div>
                        <div className="notebook-creation__share-option-text">
                          <p className={`notebook-creation__share-option-label ${formData.visibility === opt.id ? 'notebook-creation__share-option-label--active' : ''}`}>{opt.label}</p>
                          <p className="notebook-creation__share-option-desc">{opt.desc}</p>
                        </div>
                      </div>
                      {opt.id === 'TEAM' && <ChevronRight size={14} className="notebook-creation__share-option-arrow" />}
                      {formData.visibility === opt.id && opt.id !== 'TEAM' && <Check size={14} className="notebook-creation__share-option-check" />}
                    </div>
                  ))}
                </div>

                {formData.visibility === 'TEAM' && (
                  <div className="notebook-creation__teams-menu">
                    <p className="notebook-creation__teams-menu-title">Choisir les équipes</p>
                    {AVAILABLE_TEAMS.map(team => (
                      <label key={team} className="notebook-creation__team-option">
                        <div className="notebook-creation__team-checkbox-wrapper">
                          <input
                            type="checkbox"
                            className="notebook-creation__team-checkbox"
                            checked={formData.sharedWith.includes(team)}
                            onChange={() => toggleTeam(team)}
                          />
                          <Check size={10} className="notebook-creation__team-checkmark" />
                        </div>
                        <span className={`notebook-creation__team-label ${formData.sharedWith.includes(team) ? 'notebook-creation__team-label--checked' : ''}`}>
                          {team}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <button onClick={handleSubmit} className="notebook-creation__save-btn">
            <Save size={18} />
            {initialData ? 'Mettre à jour' : 'Enregistrer'}
          </button>
        </div>
      </div>

      <div className="notebook-creation__card">
        <div className="notebook-creation__card-header">
          <div className="notebook-creation__card-header-content">
            <div className="notebook-creation__card-icon">
              <Book size={24} />
            </div>
            <div>
              <h1 className="notebook-creation__card-title">{initialData ? 'Détails du Notebook' : 'Nouveau Notebook'}</h1>
              <p className="notebook-creation__card-subtitle">Documentez vos recherches et partagez vos connaissances interactives.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="notebook-creation__form">
          <div className="notebook-creation__form-row">
            <div className="notebook-creation__form-group">
              <label className="notebook-creation__label"><Tag size={12} /> Titre du Notebook</label>
              <input
                type="text"
                required
                placeholder="ex: Analyse des performances LLM"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="notebook-creation__input"
              />
            </div>
            <div className="notebook-creation__form-group">
              <label className="notebook-creation__label"><Code size={12} /> Catégorie</label>
              <div className="notebook-creation__select-wrapper">
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="notebook-creation__select"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="notebook-creation__select-icon" />
              </div>
            </div>
          </div>
          <div className="notebook-creation__form-group">
            <label className="notebook-creation__label"><LinkIcon size={12} /> URL (Optionnel)</label>
            <input
              type="url"
              placeholder="https://colab.research.google.com/..."
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="notebook-creation__input"
            />
          </div>
          <div className="notebook-creation__form-group">
            <label className="notebook-creation__label"><AlignLeft size={12} /> Description</label>
            <textarea
              required
              rows={6}
              placeholder="Décrivez le contenido y l'objectif de ce notebook..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="notebook-creation__textarea"
            />
          </div>
        </form>
      </div>
    </div>
  );
}
