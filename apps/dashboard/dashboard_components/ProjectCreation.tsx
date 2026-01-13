import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Save, Folder, Tag, AlignLeft, Code, ChevronDown, Upload, Database, CheckCircle2, Globe, Users, Lock, Check, ChevronRight } from 'lucide-react';
import './styles/ProjectCreation.css';

const AVAILABLE_TEAMS = ['Admin', 'Équipe RH', 'Équipe Dev', 'Marketing', 'Design'];

interface ProjectCreationProps {
  onCancel: () => void;
  onSave: (data: any) => void;
  initialData?: any;
}

export default function ProjectCreation({ onCancel, onSave, initialData }: ProjectCreationProps) {
  const [isCreated, setIsCreated] = useState(!!initialData);
  const [formData, setFormData] = useState({
    title: initialData?.name || '',
    category: initialData?.category || 'Développement',
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

  const categories = ['Développement', 'Marketing', 'Data Science', 'Design', 'Gestion', 'Autre'];

  const toggleTeam = (team: string) => {
    setFormData(prev => ({
      ...prev,
      sharedWith: prev.sharedWith.includes(team)
        ? prev.sharedWith.filter((t: string) => t !== team)
        : [...prev.sharedWith, team]
    }));
  };

  const handleCreateInitial = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title && formData.description) {
      setIsCreated(true);
    }
  };

  const handleFinalSave = () => {
    onSave(formData);
  };

  const getVisibilityConfig = (type: string) => {
    switch (type) {
      case 'PUBLIC': return { label: 'Public', icon: <Globe size={14} />, color: 'project-creation__visibility--public', bg: 'project-creation__visibility-bg--public' };
      case 'TEAM': return {
        label: `Équipes ${formData.sharedWith.length > 0 ? `(${formData.sharedWith.length})` : ''}`,
        icon: <Users size={14} />,
        color: 'project-creation__visibility--team',
        bg: 'project-creation__visibility-bg--team'
      };
      default: return { label: 'Privé', icon: <Lock size={14} />, color: 'project-creation__visibility--private', bg: 'project-creation__visibility-bg--private' };
    }
  };

  const currentVisibility = getVisibilityConfig(formData.visibility);

  return (
    <div className="project-creation">
      <div className="project-creation__header">
        <button onClick={onCancel} className="project-creation__back-btn">
          <ArrowLeft size={18} className="project-creation__back-icon" />
          <span className="project-creation__back-text">Retour à la bibliothèque</span>
        </button>

        <div className="project-creation__header-actions">
          <div className="project-creation__share-menu-wrapper" ref={shareMenuRef}>
            <button
              type="button"
              onClick={() => setIsShareMenuOpen(!isShareMenuOpen)}
              className={`project-creation__visibility-btn ${currentVisibility.bg}`}
            >
              <span className={currentVisibility.color}>{currentVisibility.icon}</span>
              <span className="project-creation__visibility-label">{currentVisibility.label}</span>
              <ChevronDown size={14} className={`project-creation__visibility-chevron ${isShareMenuOpen ? 'project-creation__visibility-chevron--open' : ''}`} />
            </button>

            {isShareMenuOpen && (
              <div className="project-creation__share-menu">
                <div className="project-creation__share-menu-main">
                  {[
                    { id: 'PRIVATE', label: 'Privé', desc: 'Seulement vous', icon: <Lock size={16} /> },
                    { id: 'PUBLIC', label: 'Public', desc: 'Tout le monde', icon: <Globe size={16} /> },
                    { id: 'TEAM', label: 'Équipes', desc: 'Sélectionner...', icon: <Users size={16} /> }
                  ].map((opt) => (
                    <div
                      key={opt.id}
                      onClick={() => setFormData({ ...formData, visibility: opt.id })}
                      className={`project-creation__share-option ${formData.visibility === opt.id ? 'project-creation__share-option--active' : ''}`}
                    >
                      <div className="project-creation__share-option-content">
                        <div className={`project-creation__share-option-icon ${formData.visibility === opt.id ? 'project-creation__share-option-icon--active' : ''}`}>
                          {opt.icon}
                        </div>
                        <div className="project-creation__share-option-text">
                          <p className={`project-creation__share-option-label ${formData.visibility === opt.id ? 'project-creation__share-option-label--active' : ''}`}>{opt.label}</p>
                          <p className="project-creation__share-option-desc">{opt.desc}</p>
                        </div>
                      </div>
                      {opt.id === 'TEAM' && <ChevronRight size={14} className="project-creation__share-option-arrow" />}
                      {formData.visibility === opt.id && opt.id !== 'TEAM' && <Check size={14} className="project-creation__share-option-check" />}
                    </div>
                  ))}
                </div>

                {formData.visibility === 'TEAM' && (
                  <div className="project-creation__teams-menu">
                    <p className="project-creation__teams-menu-title">Choisir les équipes</p>
                    {AVAILABLE_TEAMS.map(team => (
                      <label key={team} className="project-creation__team-option">
                        <div className="project-creation__team-checkbox-wrapper">
                          <input
                            type="checkbox"
                            className="project-creation__team-checkbox"
                            checked={formData.sharedWith.includes(team)}
                            onChange={() => toggleTeam(team)}
                          />
                          <Check size={10} className="project-creation__team-checkmark" />
                        </div>
                        <span className={`project-creation__team-label ${formData.sharedWith.includes(team) ? 'project-creation__team-label--checked' : ''}`}>
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
            onClick={handleFinalSave}
            disabled={!isCreated}
            className={`project-creation__save-btn ${isCreated ? '' : 'project-creation__save-btn--disabled'}`}
          >
            <Save size={18} />
            {initialData ? 'Mettre à jour' : 'Finaliser'}
          </button>
        </div>
      </div>

      <div className="project-creation__card">
        <div className="project-creation__card-header">
          <div className="project-creation__card-header-content">
            <div className="project-creation__card-icon">
              <Folder size={24} />
            </div>
            <div>
              <h1 className="project-creation__card-title">{initialData ? 'Détails du Projet' : 'Nouveau Projet'}</h1>
              <p className="project-creation__card-subtitle">Organisez vos ressources et documents au sein d'un projet structuré.</p>
            </div>
          </div>
        </div>

        <div className="project-creation__form-wrapper">
          <div className="project-creation__form-row">
            <div className="project-creation__form-group">
              <label className="project-creation__label"><Tag size={12} /> Titre du Projet</label>
              <input
                type="text"
                required
                disabled={isCreated && !initialData}
                placeholder="ex: Refonte Site E-commerce"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={`project-creation__input ${isCreated && !initialData ? 'project-creation__input--disabled' : ''}`}
              />
            </div>
            <div className="project-creation__form-group">
              <label className="project-creation__label"><Code size={12} /> Catégorie</label>
              <div className="project-creation__select-wrapper">
                <select
                  disabled={isCreated && !initialData}
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className={`project-creation__select ${isCreated && !initialData ? 'project-creation__select--disabled' : ''}`}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="project-creation__select-icon" />
              </div>
            </div>
          </div>
          <div className="project-creation__form-group">
            <label className="project-creation__label"><AlignLeft size={12} /> Description</label>
            <textarea
              required
              disabled={isCreated && !initialData}
              rows={4}
              placeholder="Décrivez les objectifs et le périmètre du projet..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={`project-creation__textarea ${isCreated && !initialData ? 'project-creation__textarea--disabled' : ''}`}
            />
          </div>
          {!isCreated && (
            <div className="project-creation__create-btn-wrapper">
              <button type="button" onClick={handleCreateInitial} className="project-creation__create-btn">Créer le projet</button>
            </div>
          )}
          {isCreated && (
            <div className="project-creation__resources-section">
              <div className="project-creation__resources-header">
                <div>
                  <h3 className="project-creation__resources-title"><CheckCircle2 size={12} className="project-creation__resources-title-icon" /> Ressources & Données</h3>
                  <p className="project-creation__resources-subtitle">Configurez maintenant vos documents et bases de données.</p>
                </div>
              </div>
              <div className="project-creation__resources-grid">
                <button type="button" className="project-creation__resource-card project-creation__resource-card--upload">
                  <div className="project-creation__resource-card-bg"></div>
                  <div className="project-creation__resource-card-icon project-creation__resource-card-icon--upload"><Upload size={22} /></div>
                  <div className="project-creation__resource-card-content">
                    <h4 className="project-creation__resource-card-title">Téléverser des fichiers</h4>
                    <p className="project-creation__resource-card-desc">Ajoutez vos PDF, Docs o imágenes.</p>
                  </div>
                </button>
                <button type="button" className="project-creation__resource-card project-creation__resource-card--database">
                  <div className="project-creation__resource-card-bg"></div>
                  <div className="project-creation__resource-card-icon project-creation__resource-card-icon--database"><Database size={22} /></div>
                  <div className="project-creation__resource-card-content">
                    <h4 className="project-creation__resource-card-title">Base de Datos</h4>
                    <p className="project-creation__resource-card-desc">Structurez vos connaissances.</p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
