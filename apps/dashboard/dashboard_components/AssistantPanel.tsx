import React, { useState } from 'react';
import { X, BookOpen, Sparkles, Database, ArrowRight, Info, Trash2 } from 'lucide-react';
import './styles/AssistantPanel.css';

interface AssistantPanelProps {
  onClose: () => void;
}

type TabType = 'lexique' | 'ia' | 'rag';

interface TabConfig {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  headerIcon: string;
  headerColor: string;
  placeholder: string;
  status: string;
}

const AssistantPanel: React.FC<AssistantPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('ia');

  const tabConfigs: Record<TabType, TabConfig> = {
    lexique: {
      title: 'Lexique',
      subtitle: 'Concepts Fablab',
      icon: <BookOpen size={16} />,
      headerIcon: 'LX',
      headerColor: 'assistant-panel__header-icon--lexique',
      placeholder: 'Terme...',
      status: 'Base Delft',
    },
    ia: {
      title: 'Tuteur IA',
      subtitle: 'Idéation & Prompts',
      icon: <Sparkles size={16} />,
      headerIcon: 'IA',
      headerColor: 'assistant-panel__header-icon--ia',
      placeholder: 'Votre question...',
      status: 'Gemini Delft',
    },
    rag: {
      title: 'Tutor RAG',
      subtitle: 'Docs indexés',
      icon: <Database size={16} />,
      headerIcon: 'RG',
      headerColor: 'assistant-panel__header-icon--rag',
      placeholder: 'Rechercher...',
      status: 'Vector Store',
    }
  };

  const current = tabConfigs[activeTab];

  const suggestions: Record<TabType, string[]> = {
    lexique: ['Concept Delft Blue', 'Architecture Fablab'],
    ia: ['Optimiser mon workflow', 'Aide structurelle'],
    rag: ['Analyser documentation', 'Extraire données']
  };

  return (
    <div className="assistant-panel">
      <div className="assistant-panel__top-nav">
        <div className="assistant-panel__tabs">
          {(['lexique', 'ia', 'rag'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`assistant-panel__tab ${activeTab === tab ? 'assistant-panel__tab--active' : ''}`}
            >
              {tab === 'lexique' ? 'Lex' : tab === 'ia' ? 'IA' : 'Rag'}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="assistant-panel__close-btn">
          <X size={16} />
        </button>
      </div>

      <div className="assistant-panel__main">
        <div className="assistant-panel__inner-header">
          <div className="assistant-panel__header-left">
            <div className={`assistant-panel__header-icon ${current.headerColor}`}>
              {current.headerIcon}
            </div>
            <div className="assistant-panel__header-info">
              <h3 className="assistant-panel__header-title">{current.title}</h3>
              <div className="assistant-panel__header-status">
                <span className="assistant-panel__status-dot"></span>
                {current.status}
              </div>
            </div>
          </div>
          <button className="assistant-panel__trash-btn">
            <Trash2 size={14} />
          </button>
        </div>

        <div className="assistant-panel__chat">
          <div className="assistant-panel__empty">
            <div className="assistant-panel__empty-icon">
              {current.icon}
            </div>
            <p className="assistant-panel__empty-text">Posez vos questions sur le système Delft.</p>
          </div>

          <div className="assistant-panel__suggestions">
            {suggestions[activeTab].map(q => (
              <button key={q} className={`assistant-panel__suggestion assistant-panel__suggestion--${activeTab}`}>
                <span>{q}</span>
                <ArrowRight size={10} className="assistant-panel__suggestion-arrow" />
              </button>
            ))}
          </div>
        </div>

        <div className="assistant-panel__footer">
          <div className="assistant-panel__input-wrapper">
            <input
              type="text"
              placeholder={current.placeholder}
              className="assistant-panel__input"
            />
          </div>
          <button className="assistant-panel__send-btn">
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      <div className="assistant-panel__bottom-footer">
        <div className="assistant-panel__footer-left">
          <Info size={10} />
          <span>Fablab Delft</span>
        </div>
        <span>v3.0</span>
      </div>
    </div>
  );
};

export default AssistantPanel;
