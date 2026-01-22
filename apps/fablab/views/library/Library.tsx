
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Search, FileText, Notebook, FolderKanban, Globe, Eye, Lock, Plus, X, ExternalLink, Trash2 } from 'lucide-react';
import FormGeneral from './components/Form-general';
import DetailsView from './components/DetailsView';
import { useLanguage } from '../../language/useLanguage';
import { translations } from '../../language/translations';
import { 
  getTools, 
  createTool, 
  updateTool, 
  deleteTool, 
  toggleToolVisibility 
} from '@core/creation-tools/creation-tools.service';
import type { Tool } from '@core/creation-tools/creation-tools.types';

// MOCK DATA - Solo se usa si falla la API
const mockItems: LibraryItem[] = [
  { id: 1, type: 'note_books', title: 'REX Industrialisation LLM', description: 'Notes sur les tests de latence et coûts.', isPublic: false, author: 'JULIEDURAND', createdAt: '22/10/2023', category: 'Analyse', url: 'aimaker.fr/s/...', language: 'fr', usageCount: 0 },
  { id: 2, type: 'project', title: 'Prototype Chatbot Client', description: 'MVP pour le support client e-commerce.', isPublic: true, author: 'JEANDUPONT', createdAt: '20/10/2023', category: 'E-commerce', url: 'aimaker.fr/p/...', language: 'fr', usageCount: 0 },
];

type FilterType = 'all' | 'mine' | 'public' | 'private' | 'shared';
type ItemType = 'assistant' | 'prompt' | 'note_books' | 'project' | 'perplexity_search';

interface LibraryItem {
  id: number;
  type: ItemType;
  title: string;
  description: string;
  isPublic: boolean;
  author: string;
  createdAt: string;
  category: string;
  url: string;
  publicUrl?: string;
  language?: string;
  usageCount?: number;
}

interface LibraryViewProps {
  items?: LibraryItem[];
  onSave?: (data: any, itemId?: number) => Promise<boolean>;
  onDelete?: (itemId: number) => void;
  onToggleVisibility?: (itemId: number, isPublic: boolean) => void;
  isLoading?: boolean;
}

const LibraryView: React.FC<LibraryViewProps> = ({
  items = mockItems,
  onSave,
  onDelete,
  onToggleVisibility,
  isLoading = false
}) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = translations[language];
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<ItemType | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDetailsView, setShowDetailsView] = useState(false);
  const [selectedType, setSelectedType] = useState<ItemType>('note_books');
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: t.library.filters.all },
    { key: 'mine', label: t.library.filters.mine },
    { key: 'shared', label: t.library.filters.shared },
    { key: 'public', label: t.library.filters.public },
    { key: 'private', label: t.library.filters.private }
  ];

  const getFilteredTools = () => {
    let filtered: any = items;

    switch (activeFilter) {
      case 'mine':
        break;
      case 'shared':
        filtered = filtered.filter((tool: LibraryItem) => tool.isPublic);
        break;
      case 'public':
        filtered = filtered.filter((tool: LibraryItem) => tool.isPublic);
        break;
      case 'private':
        filtered = filtered.filter((tool: LibraryItem) => !tool.isPublic);
        break;
      case 'all':
      default:
        break;
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter((tool: LibraryItem) => tool.type === typeFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((tool: LibraryItem) => 
        tool.title?.toLowerCase().includes(query) ||
        tool.description?.toLowerCase().includes(query) ||
        tool.type?.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const filteredItems = getFilteredTools();

  const itemTypes: { type: ItemType; icon: any; label: string }[] = [
    { type: 'assistant', icon: BookOpen, label: t.library.types.assistant },
    { type: 'prompt', icon: FileText, label: t.library.types.prompt },
    { type: 'note_books', icon: Notebook, label: t.library.types.notebook },
    { type: 'project', icon: FolderKanban, label: t.library.types.project },
    { type: 'perplexity_search', icon: Globe, label: t.library.types.perplexitySearch }
  ];

  const getTypeConfig = (type: ItemType) => {
    return itemTypes.find(t => t.type === type) || itemTypes[0];
  };

  const handleFilterClick = (filter: FilterType) => {
    setActiveFilter(filter);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleCreateClick = (type: ItemType) => {
    setSelectedType(type);
    setShowCreateModal(false);
    setShowCreateForm(true);
  };

  const handleViewDetails = (itemId: number) => {
    setSelectedItemId(itemId);
    setShowDetailsView(true);
    setIsEditMode(false);
  };

  const handleToggleVisibility = (itemId: number, currentIsPublic: boolean) => {
    onToggleVisibility?.(itemId, !currentIsPublic);
  };

  const handleRedirect = (url: string) => {
    if (url) {
      if (url.startsWith('/dashboard/notebook/')) {
        navigate(url);
      } else {
        window.open(url.startsWith('http') ? url : `https://${url}`, '_blank');
      }
    }
  };

  const handleFormSave = async (data: any) => {
    if (onSave) {
      const success = await onSave(data, undefined);
      if (success) {
        setShowCreateForm(false);
      }
    }
  };

  const handleEditSave = async (data: any): Promise<boolean> => {
    if (onSave && selectedItemId) {
      const success = await onSave(data, selectedItemId);
      if (success) {
        setIsEditMode(false);
      }
      return success;
    }
    return false;
  };

  const handleFormClose = () => {
    setShowCreateForm(false);
    setShowDetailsView(false);
    setSelectedItemId(null);
    setIsEditMode(false);
  };

  const getSelectedItemData = () => {
    if (selectedItemId) {
      return items.find(item => item.id === selectedItemId);
    }
    return undefined;
  };

  return (
    <>
      {showDetailsView && selectedItemId ? (
        <DetailsView
          item={getSelectedItemData()}
          isEditMode={isEditMode}
          onClose={handleFormClose}
          onEdit={() => setIsEditMode(true)}
          onSave={handleEditSave}
          onRedirect={handleRedirect}
        />
      ) : (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/10 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Library
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Gérez vos ressources IA en un clin d'œil.</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-[1.02]"
            >
              <Plus size={20} />
              Créer
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none w-full shadow-sm"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as ItemType | 'all')}
                className="px-4 py-2.5 font-medium rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="all">Todos los tipos</option>
                <option value="note_books">Notebooks</option>
                <option value="project">Proyectos</option>
                <option value="prompt">Prompts</option>
                <option value="assistant">Asistentes</option>
                <option value="perplexity_search">Perplexity</option>
              </select>
              {filters.map(filter => (
                <button
                  key={filter.key}
                  onClick={() => handleFilterClick(filter.key)}
                  className={`px-5 py-2.5 font-medium transition-all rounded-xl ${
                    activeFilter === filter.key
                      ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-md border border-blue-200 dark:border-blue-800'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-blue-50/50 dark:from-gray-900 dark:to-blue-900/20 border-b border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-12 gap-4 px-6 py-4">
                <div className="col-span-1 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Type</div>
                <div className="col-span-4 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Nom & Description</div>
                <div className="col-span-1 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Language</div>
                <div className="col-span-2 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Action</div>
                <div className="col-span-2 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Public/Privé</div>
                <div className="col-span-2 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Auteur / Date</div>
              </div>
            </div>

            {isLoading ? (
              <div className="px-6 py-16 text-center text-gray-500">
                <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4">Chargement...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="px-6 py-16 text-center text-gray-500">Aucun élément trouvé</div>
            ) : (
              <div>
                {filteredItems.map((item: LibraryItem, index: number) => {
                  const typeConfig = getTypeConfig(item.type as ItemType);
                  const TypeIcon = typeConfig.icon;
                  
                  return (
                    <div 
                      key={item.id} 
                      className={`grid grid-cols-12 gap-4 px-6 py-6 items-center hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all ${
                        index !== filteredItems.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
                      }`}
                    >
                      <div className="col-span-1">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                            <TypeIcon size={24} className="text-white" />
                          </div>
                          <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide text-center">
                            {typeConfig.label}
                          </div>
                        </div>
                      </div>

                      <div className="col-span-4">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                          {item.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {item.description}
                        </p>
                      </div>

                      <div className="col-span-1">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 uppercase">
                          {item.language || 'N/A'}
                        </span>
                      </div>

                      <div className="col-span-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewDetails(item.id)}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold transition-all text-sm hover:scale-105"
                          >
                            <Eye size={16} />
                            VOIR
                          </button>
                          <button
                            onClick={() => onDelete?.(item.id)}
                            className="inline-flex items-center gap-2 px-3 py-2.5 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 border-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl font-semibold transition-all text-sm hover:scale-105"
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="col-span-2">
                        {item.isPublic ? (
                          item.type === 'note_books' && item.publicUrl ? (
                            <button
                              onClick={() => handleRedirect(item.publicUrl!)}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 cursor-pointer hover:scale-105"
                            >
                              <Globe size={18} />
                              Public
                              <ExternalLink size={14} />
                            </button>
                          ) : item.url ? (
                            <button
                              onClick={() => handleRedirect(item.url)}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 cursor-pointer hover:scale-105"
                            >
                              <Globe size={18} />
                              Public
                              <ExternalLink size={14} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleVisibility(item.id, item.isPublic)}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30"
                            >
                              <Globe size={18} />
                              Public
                            </button>
                          )
                        ) : (
                          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 opacity-75 cursor-not-allowed">
                            <Lock size={18} />
                            Privé
                          </div>
                        )}
                      </div>

                      <div className="col-span-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
                            {item.author.substring(0, 2)}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900 dark:text-white">
                              {item.author}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {item.createdAt}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Créer une ressource</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Sélectionnez le type de ressource que vous souhaitez créer
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              {itemTypes.map(type => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.type}
                    onClick={() => handleCreateClick(type.type)}
                    className="group flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                  >
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Icon size={32} className="text-white" />
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white text-center">
                      {type.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {showCreateForm && (
        <FormGeneral
          onClose={handleFormClose}
          onSave={handleFormSave}
          selectedType={selectedType}
        />
      )}
    </>
  );
};

// Componente contenedor que maneja la carga de datos desde la API
const Library = () => {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCreationTools = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const tools = await getTools();
      // Filtrar external_link y vibe_coding (ahora están en Acceso Externo)
      const filteredTools = tools.filter((tool: Tool) => 
        (tool.type as string) !== 'external_link' && (tool.type as string) !== 'vibe_coding'
      );
      const sortedTools = filteredTools.sort((a, b) => b.id - a.id);
      
      const mappedItems: LibraryItem[] = sortedTools.map((tool: Tool) => ({
        id: tool.id,
        type: tool.type as ItemType,
        title: tool.title,
        description: tool.description,
        isPublic: tool.hasPublicStatus ?? false,
        url: tool.url || '',
        publicUrl: tool.publicUrl || undefined,
        language: tool.language,
        usageCount: tool.usageCount,
        author: 'USER',
        createdAt: new Date().toLocaleDateString('fr-FR'),
        category: ''
      })) as LibraryItem[];
      
      setItems(mappedItems);
    } catch (err) {
      console.error('Error cargando creation tools:', err);
      setError('Error al cargar los datos');
      setItems(mockItems);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCreationTools();
  }, []);

  const handleSave = async (data: any, itemId?: number): Promise<boolean> => {
    try {
      setIsLoading(true);
      const payload: any = {};
      
      if (data.title) payload.title = data.title;
      if (data.description) payload.description = data.description;
      if (data.type) payload.type = data.type;
      if (data.language) payload.language = data.language;
      if (data.url) payload.url = data.url;
      
      payload.hasPublicStatus = data.hasPublicStatus ?? false;
      payload.isTemplate = data.isTemplate ?? false;

      if (itemId) {
        await updateTool(itemId, payload);
      } else {
        await createTool(payload);
      }

      await loadCreationTools();
      return true;
    } catch (err) {
      console.error('Error guardando:', err);
      setError('Error al guardar');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (itemId: number) => {
    if (!confirm('¿Estás seguro de eliminar este elemento?')) return;
    
    try {
      setIsLoading(true);
      await deleteTool(itemId);
      setItems(prev => prev.filter((item: LibraryItem) => item.id !== itemId));
    } catch (err) {
      console.error('Error eliminando:', err);
      setError('Error al eliminar');
      await loadCreationTools();
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleVisibility = async (itemId: number, currentIsPublic: boolean) => {
    try {
      await toggleToolVisibility(itemId, !currentIsPublic);
      await loadCreationTools();
    } catch (err) {
      console.error('Error cambiando visibilidad:', err);
      setError('Error al cambiar visibilidad');
    }
  };

  if (error && items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-4">{error}</p>
          <button
            onClick={() => loadCreationTools()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <LibraryView 
      items={items} 
      isLoading={isLoading}
      onSave={handleSave}
      onDelete={handleDelete}
      onToggleVisibility={handleToggleVisibility}
    />
  );
};

export default Library;
