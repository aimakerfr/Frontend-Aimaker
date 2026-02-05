
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Search, FileText, Notebook, FolderKanban, Globe, Eye, Lock, Plus, X, ExternalLink, Trash2, Star } from 'lucide-react';
import FormGeneral from './components/Form-general';
import { useLanguage } from '../../language/useLanguage';
import { 
  getTools, 
  createTool, 
  updateTool, 
  deleteTool, 
  toggleToolFavorite
} from '@core/creation-tools/creation-tools.service';
import type { Tool } from '@core/creation-tools/creation-tools.types';

// MOCK DATA - Solo se usa si falla la API
const mockItems: LibraryItem[] = [
  { id: 1, type: 'note_books', title: 'REX Industrialisation LLM', description: 'Notes sur les tests de latence et coûts.', isPublic: false, author: 'JULIEDURAND', createdAt: '22/10/2023', category: 'Analyse', url: 'aimaker.fr/s/...', language: 'fr', usageCount: 0 },
  { id: 2, type: 'project', title: 'Prototype Chatbot Client', description: 'MVP pour le support client e-commerce.', isPublic: true, author: 'JEANDUPONT', createdAt: '20/10/2023', category: 'E-commerce', url: 'aimaker.fr/p/...', language: 'fr', usageCount: 0 },
];

type FilterType = 'all' | 'mine' | 'public' | 'private' | 'shared' | 'favorites';
type ItemType = 'assistant' | 'prompt' | 'note_books' | 'project' | 'perplexity_search';

interface LibraryItem {
  id: number;
  type: ItemType;
  title: string;
  description: string;
  isPublic: boolean;
  author: string;
  authorName?: string;
  createdAt: string;
  category: string;
  url: string;
  publicUrl?: string;
  language?: string;
  usageCount?: number;
  isFavorite?: boolean;
}

interface LibraryViewProps {
  items?: LibraryItem[];
  onSave?: (data: any, itemId?: number) => Promise<boolean>;
  onDelete?: (itemId: number) => void;
  onToggleFavorite?: (itemId: number) => Promise<void>;
  isLoading?: boolean;
}

const LibraryView: React.FC<LibraryViewProps> = ({
  items = mockItems,
  onSave,
  onDelete,
  onToggleFavorite,
  isLoading = false
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<ItemType | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedType, setSelectedType] = useState<ItemType>('note_books');

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: t.library.filters.all },
    { key: 'mine', label: t.library.filters.mine },
    { key: 'shared', label: t.library.filters.shared },
    { key: 'public', label: t.library.filters.public },
    { key: 'private', label: t.library.filters.private },
    { key: 'favorites', label: t.library.filters.favorites || 'Favoris' }
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
      case 'favorites':
        filtered = filtered.filter((tool: any) => tool.isFavorite === true);
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
    { type: 'note_books', icon: Notebook, label: t.library.types.notebook },
    { type: 'prompt', icon: FileText, label: t.library.types.prompt },
    { type: 'assistant', icon: BookOpen, label: t.library.types.assistant },
    { type: 'project', icon: FolderKanban, label: t.library.types.project }
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

  const handleToggleFavorite = async (itemId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      await onToggleFavorite(itemId);
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

  const handleFormClose = () => {
    setShowCreateForm(false);
  };

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/10 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {t.library.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{t.library.subtitle}</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-[1.02]"
          >
            <Plus size={20} />
            {t.library.createNew}
          </button>
        </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder={t.library.searchPlaceholder}
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
                <div className="col-span-1 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{t.library.tableHeaders.type}</div>
                <div className="col-span-3 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{t.library.tableHeaders.nameDescription}</div>
                <div className="col-span-1 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{t.library.tableHeaders.language}</div>
                <div className="col-span-2 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{t.library.tableHeaders.action}</div>
                <div className="col-span-2 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{t.library.tableHeaders.publicPrivate}</div>
                <div className="col-span-2 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{t.library.tableHeaders.authorDate}</div>
                <div className="col-span-1 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider text-center">{t.library.filters.favorites}</div>
              </div>
            </div>

            {isLoading ? (
              <div className="px-6 py-16 text-center text-gray-500">
                <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4">{t.common.loading}</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="px-6 py-16 text-center text-gray-500">{t.library.noResults}</div>
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

                      <div className="col-span-3">
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
                            onClick={() => {
                              const urlType = item.type === 'note_books' ? 'notebook' : item.type;
                              navigate(`/dashboard/${urlType}/${item.id}`);
                            }}
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
                          <button
                            onClick={() => {
                              const urlType = item.type === 'note_books' ? 'notebook' : item.type;
                              const publicUrl = item.publicUrl || `http://localhost:3001/public/${urlType}/${item.id}`;
                              window.open(publicUrl, '_blank');
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 cursor-pointer hover:scale-105"
                          >
                            <Globe size={18} />
                            Public
                            <ExternalLink size={14} />
                          </button>
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
                            {(item.authorName || item.author).substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900 dark:text-white">
                              {item.authorName || item.author}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {item.createdAt}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="col-span-1 flex justify-center">
                        <button
                          onClick={(e) => handleToggleFavorite(item.id, e)}
                          className={`p-2 rounded-lg transition-all hover:scale-110 ${
                            (item as any).isFavorite 
                              ? 'text-yellow-500 hover:text-yellow-600' 
                              : 'text-gray-400 hover:text-yellow-500'
                          }`}
                          title={(item as any).isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                        >
                          <Star 
                            size={24} 
                            fill={(item as any).isFavorite ? 'currentColor' : 'none'}
                            className="transition-all"
                          />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{t.library.modal.createTitle}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {t.library.modal.createSubtitle}
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
      console.log('=== LOADING CREATION TOOLS ===');
      const tools = await getTools();
      console.log('Tools recibidos del backend:', tools);
      console.log('Número de tools:', tools.length);
      
      // Filtrar external_link y vibe_coding (ahora están en Acceso Externo)
      const filteredTools = tools.filter((tool: Tool) => 
        (tool.type as string) !== 'external_link' && (tool.type as string) !== 'vibe_coding'
      );
      console.log('Tools después de filtrar:', filteredTools.length);
      
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
        isFavorite: tool.isFavorite ?? false,
        author: tool.authorName || 'Usuario',
        authorName: tool.authorName || 'Usuario',
        createdAt: new Date().toLocaleDateString('fr-FR'),
        category: tool.category || ''
      })) as LibraryItem[];
      
      console.log('Items mapeados:', mappedItems);
      console.log('===============================');
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
        const updatedTool = await updateTool(itemId, payload);
        console.log('=== TOOL UPDATE RESPONSE ===');
        console.log('Updated Tool:', updatedTool);
        console.log('publicUrl:', updatedTool.publicUrl);
        console.log('url:', updatedTool.url);
        console.log('hasPublicStatus:', updatedTool.hasPublicStatus);
        console.log('============================');
        
        // Actualizar el item en el estado con la respuesta del servidor
        setItems(prev => prev.map((item: LibraryItem) => 
          item.id === itemId ? {
            ...item,
            title: updatedTool.title,
            description: updatedTool.description,
            type: updatedTool.type as ItemType,
            language: updatedTool.language,
            url: updatedTool.url || '',
            publicUrl: updatedTool.publicUrl || undefined,
            isPublic: updatedTool.hasPublicStatus ?? false,
            isFavorite: updatedTool.isFavorite ?? item.isFavorite
          } : item
        ));
      } else {
        await createTool(payload);
        await loadCreationTools();
      }

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

  const handleToggleFavorite = async (itemId: number) => {
    try {
      const result = await toggleToolFavorite(itemId);
      // Actualizar el estado local inmediatamente
      setItems(prev => prev.map((item: LibraryItem) => 
        item.id === itemId 
          ? { ...item, isFavorite: result.isFavorite }
          : item
      ));
    } catch (err) {
      console.error('Error cambiando favorito:', err);
      setError('Error al cambiar favorito');
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
      onToggleFavorite={handleToggleFavorite}
    />
  );
};

export default Library;
