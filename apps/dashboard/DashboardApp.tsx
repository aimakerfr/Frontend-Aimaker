/**
 * Dashboard App - Main dashboard with resource management
 * COMPLETELY DECOUPLED - Doesn't know about other apps
 */

import { useState, useMemo } from 'react';
import LibraryTable from './dashboard_components/LibraryTable';
import AssistantPanel from './dashboard_components/AssistantPanel';
import Sidebar from './dashboard_components/Sidebar';
import PromptCreation from './dashboard_components/PromptCreation';
import AgentCreation from './dashboard_components/AgentCreation';
import ProjectCreation from './dashboard_components/ProjectCreation';
import NotebookCreation from './dashboard_components/NotebookCreation';
import LearningCenter from './dashboard_components/LearningCenter';
import SharedResources from './dashboard_components/SharedResources';
import { RESOURCES } from './constants';
import './DashboardApp.css';

export default function DashboardApp() {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [sortOrder, setSortOrder] = useState('NEWEST');
  const [currentView, setCurrentView] = useState('LIBRARY');
  const [selectedResource, setSelectedResource] = useState<any>(null);

  const handleNewCreation = (type: string) => {
    setSelectedResource(null);
    if (type === 'PROMPT') setCurrentView('CREATE_PROMPT');
    else if (type === 'AGENT') setCurrentView('CREATE_AGENT');
    else if (type === 'PROJECT') setCurrentView('CREATE_PROJECT');
    else if (type === 'NOTEBOOK') setCurrentView('CREATE_NOTEBOOK');
    else setCurrentView('CREATE_PROMPT');
  };

  const handleViewDetails = (resource: any) => {
    setSelectedResource(resource);
    if (resource.type === 'PROMPT') setCurrentView('CREATE_PROMPT');
    else if (resource.type === 'AGENT') setCurrentView('CREATE_AGENT');
    else if (resource.type === 'PROJECT') setCurrentView('CREATE_PROJECT');
    else if (resource.type === 'NOTEBOOK') setCurrentView('CREATE_NOTEBOOK');
  };

  const filteredAndSortedResources = useMemo(() => {
    let result = [...RESOURCES];
    if (selectedType !== 'ALL') result = result.filter(r => r.type === selectedType);
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(r => r.name.toLowerCase().includes(query) || r.description.toLowerCase().includes(query));
    }
    result.sort((a, b) => {
      const d1 = new Date(a.author.date.split('/').reverse().join('-')).getTime();
      const d2 = new Date(b.author.date.split('/').reverse().join('-')).getTime();
      return sortOrder === 'NEWEST' ? d2 - d1 : d1 - d2;
    });
    return result;
  }, [searchQuery, selectedType, sortOrder]);

  return (
    <div className="dashboard-container">
      <Sidebar onNew={handleNewCreation} onViewChange={(v) => setCurrentView(v)} currentView={currentView} />

      <div className="dashboard-main">
        <header className="dashboard-header">
          <div className="breadcrumb">
            <span className="breadcrumb-item" onClick={() => setCurrentView('LIBRARY')}>Bibliothèque</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">{currentView}</span>
          </div>
        </header>

        <main className="dashboard-content">
          {currentView === 'LIBRARY' ? (
            <div className="library-view">
              <div className="library-header">
                <div className="library-title-section">
                  <h1 className="library-title">Bibliothèque</h1>
                  <p className="library-subtitle">Gérez vos ressources IA en un clin d'œil.</p>
                </div>
                <div className="library-actions">
                  <div className="search-box">
                    <span className="search-icon">🔍</span>
                    <input
                      type="text"
                      placeholder="Rechercher..."
                      className="search-input"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <button onClick={() => setSortOrder(prev => prev === 'NEWEST' ? 'OLDEST' : 'NEWEST')} className="sort-button">
                    <span>📅</span>
                    <span>{sortOrder === 'NEWEST' ? 'Récents' : 'Anciens'}</span>
                  </button>
                </div>
              </div>
              <LibraryTable resources={filteredAndSortedResources} onViewDetails={handleViewDetails} />
            </div>
          ) : currentView === 'CREATE_PROMPT' ? (
            <PromptCreation onCancel={() => setCurrentView('LIBRARY')} onSave={() => setCurrentView('LIBRARY')} initialData={selectedResource} />
          ) : currentView === 'CREATE_AGENT' ? (
            <AgentCreation onCancel={() => setCurrentView('LIBRARY')} onSave={() => setCurrentView('LIBRARY')} initialData={selectedResource} />
          ) : currentView === 'CREATE_PROJECT' ? (
            <ProjectCreation onCancel={() => setCurrentView('LIBRARY')} onSave={() => setCurrentView('LIBRARY')} initialData={selectedResource} />
          ) : currentView === 'CREATE_NOTEBOOK' ? (
            <NotebookCreation onCancel={() => setCurrentView('LIBRARY')} onSave={() => setCurrentView('LIBRARY')} initialData={selectedResource} />
          ) : currentView === 'LEARNING' ? (
            <LearningCenter />
          ) : (
            <SharedResources />
          )}
        </main>
      </div>

      <button
        onClick={() => setIsAssistantOpen(!isAssistantOpen)}
        className="assistant-fab"
      >
        {isAssistantOpen ? <span className="fab-icon-close">✕</span> : <span className="fab-icon">💬</span>}
        {!isAssistantOpen && (
          <div className="fab-tooltip">Aide ?</div>
        )}
      </button>

      {isAssistantOpen && <AssistantPanel onClose={() => setIsAssistantOpen(false)} />}
    </div>
  );
}
