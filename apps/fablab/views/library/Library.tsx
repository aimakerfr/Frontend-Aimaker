
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Search, Link2, FileText, Notebook, FolderKanban, Smartphone, Globe, Code, Eye, Lock, Plus, X, ExternalLink, Trash2 } from 'lucide-react';
import FormGeneral from './components/Form-general';
import DetailsView from './components/DetailsView';
import { 
  getCreationTools, 
  createCreationTool, 
  updateCreationTool, 
  deleteCreationTool, 
  toggleCreationToolVisibility 
} from '../../../../core/src/creation-tools';
import type { CreationTool, CreationToolType } from '../../../../core/src/creation-tools';

// MOCK DATA - Solo se usa si falla la API
const mockItems = [
  { id: 1, type: 'note_books' as CreationToolType, title: 'REX Industrialisation LLM', description: 'Notes sur les tests de latence et coûts.', isPublic: false, author: 'JULIEDURAND', createdAt: '22/10/2023', category: 'Analyse', url: 'aimaker.fr/s/...', language: 'fr', usageCount: 0 },
  { id: 2, type: 'project' as CreationToolType, title: 'Prototype Chatbot Client', description: 'MVP pour le support client e-commerce.', isPublic: true, author: 'JEANDUPONT', createdAt: '20/10/2023', category: 'E-commerce', url: 'aimaker.fr/p/...', language: 'fr', usageCount: 0 },
  { id: 3, type: 'agent' as CreationToolType, title: 'Tuteur Juridique v2', description: 'Agent spécialisé en conformité RGPD pour les RH.', isPublic: false, author: 'MARCLEFEBVRE', createdAt: '15/10/2023', category: 'Juridique', url: '', language: 'fr', usageCount: 0 },
  { id: 4, type: 'prompt' as CreationToolType, title: 'Générateur de Synthèse Leads', description: 'Prompt optimisé pour extraire les intentions d\'achat...', isPublic: true, author: 'JULIEDURAND', createdAt: '12/10/2023', category: 'Marketing', url: 'aimaker.fr/pr/...', language: 'fr', usageCount: 0 },
  { id: 5, type: 'external_link' as CreationToolType, title: 'Documentation OpenAI API', description: 'Lien vers la doc officielle des endpoints GPT-4.', isPublic: true, author: 'SOPHIEMARTIN', createdAt: '08/10/2023', category: 'Documentation', url: 'docs.openai.com', language: 'en', usageCount: 0 },
  { id: 6, type: 'app' as CreationToolType, title: 'Dashboard Analytics IA', description: 'Application de visualisation des métriques de modèles.', isPublic: false, author: 'PIERREDUBOIS', createdAt: '05/10/2023', category: 'Analytics', url: '', language: 'fr', usageCount: 0 },
  { id: 7, type: 'perplexity_search' as CreationToolType, title: 'Template Recherche Juridique', description: 'Configuration optimisée pour recherches légales.', isPublic: true, author: 'MARCLEFEBVRE', createdAt: '02/10/2023', category: 'Recherche', url: 'perplexity.ai/...', language: 'fr', usageCount: 0 },
  { id: 8, type: 'vibe_coding' as CreationToolType, title: 'Assistant Python FastAPI', description: 'Outil de génération de code pour APIs REST.', isPublic: false, author: 'THOMASLEROY', createdAt: '28/09/2023', category: 'Development', url: '', language: 'python', usageCount: 0 },
];

type FilterType = 'all' | 'mine' | 'public' | 'private' | 'shared';
type ItemType = 'agent' | 'external_link' | 'prompt' | 'note_books' | 'project' | 'app' | 'perplexity_search' | 'vibe_coding';

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
  language?: string;
  usageCount?: number;
}

interface LibraryTableViewProps {
  items?: LibraryItem[];
  currentUser?: string;
  onFilterChange?: (filter: FilterType) => void;
  onSearch?: (query: string) => void;
  onCreate?: (type: ItemType) => void;
  onViewDetails?: (itemId: number) => void;
  onToggleVisibility?: (itemId: number, isPublic: boolean) => void;
  onRedirect?: (url: string) => void;
  onSave?: (data: any, itemId?: number) => Promise<boolean>;
  onDelete?: (itemId: number) => void;
  isLoading?: boolean;
}

const Library: React.FC<LibraryTableViewProps> = ({
  items = mockItems,
  onFilterChange,
  onSearch,
  onCreate,
  onViewDetails,
  onToggleVisibility,
  onRedirect,
  onSave,
  onDelete,
  isLoading = false
}) => {
  const navigate = useNavigate();
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
    { key: 'all', label: 'Tous' },
    { key: 'mine', label: 'Mios' },
    { key: 'shared', label: 'Partagés' },
    { key: 'public', label: 'Publics' },
    { key: 'private', label: 'Privés' }
  ];

  // Filtrar herramientas según el filtro activo y búsqueda
  const getFilteredTools = () => {
    let filtered = items;

    // Aplicar filtro de tipo
    switch (activeFilter) {
      case 'mine':
        // Ya están filtradas por usuario en el backend
        break;
      case 'shared':
        // Compartidos = solo públicos
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

    // Aplicar filtro por tipo de herramienta
    if (typeFilter !== 'all') {
      filtered = filtered.filter((tool: LibraryItem) => tool.type === typeFilter);
    }

    // Aplicar filtro de búsqueda
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
    { type: 'agent', icon: BookOpen, label: 'AGENT' },
    { type: 'external_link', icon: Link2, label: 'EXTERNAL LINK' },
    { type: 'prompt', icon: FileText, label: 'PROMPT' },
    { type: 'note_books', icon: Notebook, label: 'NOTEBOOK' },
    { type: 'project', icon: FolderKanban, label: 'PROJECT' },
    { type: 'app', icon: Smartphone, label: 'APP' },
    { type: 'perplexity_search', icon: Globe, label: 'PERPLEXITY SEARCH' },
    { type: 'vibe_coding', icon: Code, label: 'VIBE CODING' }
  ];

  const getTypeConfig = (type: ItemType) => {
    return itemTypes.find(t => t.type === type) || itemTypes[0];
  };

  const handleFilterClick = (filter: FilterType) => {
    setActiveFilter(filter);
    onFilterChange?.(filter);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearch?.(e.target.value);
  };

  const handleCreateClick = (type: ItemType) => {
    setSelectedType(type);
    setShowCreateModal(false);
    setShowCreateForm(true);
    onCreate?.(type);
  };

  const handleViewDetails = (itemId: number) => {
    setSelectedItemId(itemId);
    setShowDetailsView(true);
    setIsEditMode(false);
    onViewDetails?.(itemId);
  };

  const handleToggleVisibility = (itemId: number, currentIsPublic: boolean) => {
    onToggleVisibility?.(itemId, !currentIsPublic);
  };

  const handleRedirect = (url: string) => {
    if (url) {
      // Si es una ruta interna del notebook, usar navigate
      if (url.startsWith('/dashboard/notebook/')) {
        navigate(url);
      } else {
        // Para URLs externas, abrir en nueva pestaña
        onRedirect?.(url);
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
      console.log('Editando item:', selectedItemId, 'con datos:', data);
      const success = await onSave(data, selectedItemId);
      console.log('Resultado de actualización:', success);
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
      {/* Vista de Detalles de la Herramienta - Mostrar en lugar de tabla */}
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
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Bibliothèque
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

          {/* Search & Filters */}
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
                <option value="external_link">Enlaces</option>
                <option value="agent">Agentes</option>
                <option value="app">Apps</option>
                <option value="vibe_coding">Vibe Coding</option>
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

          {/* Table */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            {/* Header */}
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

            {/* Body */}
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
                      {/* Type */}
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

                      {/* Name & Description */}
                      <div className="col-span-4">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                          {item.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {item.description}
                        </p>
                      </div>

                      {/* Language */}
                      <div className="col-span-1">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 uppercase">
                          {item.language || 'N/A'}
                        </span>
                      </div>

                      {/* Action */}
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

                      {/* Public/Private + URL combinados */}
                      <div className="col-span-2">
                        {item.isPublic && item.url ? (
                          <button
                            onClick={() => handleRedirect(item.url)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 cursor-pointer hover:scale-105"
                          >
                            <Globe size={18} />
                            Public
                            <ExternalLink size={14} />
                          </button>
                        ) : item.isPublic ? (
                          <button
                            onClick={() => handleToggleVisibility(item.id, item.isPublic)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30"
                          >
                            <Globe size={18} />
                            Public
                          </button>
                        ) : (
                          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 opacity-75 cursor-not-allowed">
                            <Lock size={18} />
                            Privé
                          </div>
                        )}
                      </div>

                      {/* Author/Date */}
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

      {/* Create Modal */}
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

      {/* Form General Modal - Solo para crear */}
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
const LibraryContainer = () => {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos del backend
  const loadCreationTools = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const tools = await getCreationTools();
      
      // Ordenar por ID descendente (más recientes primero)
      const sortedTools = tools.sort((a, b) => b.id - a.id);
      
      const mappedItems: LibraryItem[] = sortedTools.map((tool: CreationTool) => ({
        id: tool.id,
        type: tool.type as ItemType,
        title: tool.title,
        description: tool.description,
        isPublic: tool.hasPublicStatus ?? false,
        url: tool.url || '',
        language: tool.language,
        usageCount: tool.usageCount,
        author: 'USER',
        createdAt: new Date().toLocaleDateString('fr-FR'),
        category: ''
      }));
      
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

  // Handler para crear/actualizar
  const handleSave = async (data: any, itemId?: number): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Construir payload solo con campos que tienen valor
      const payload: any = {};
      
      if (data.title) payload.title = data.title;
      if (data.description) payload.description = data.description;
      if (data.type) payload.type = data.type;
      if (data.language) payload.language = data.language;
      if (data.url) payload.url = data.url;
      
      // Campos booleanos (siempre incluir)
      payload.hasPublicStatus = data.hasPublicStatus ?? false;
      payload.isTemplate = data.isTemplate ?? false;

      console.log('Guardando payload:', payload);

      if (itemId) {
        // Actualizar existente - solo enviar campos modificados
        console.log('Actualizando item:', itemId);
        const updated = await updateCreationTool(itemId, payload);
        console.log('Item actualizado:', updated);
      } else {
        // Crear nuevo - todos los campos requeridos
        console.log('Creando nuevo item');
        const created = await createCreationTool(payload);
        console.log('Item creado:', created);
      }

      // Recargar lista
      console.log('Recargando lista...');
      await loadCreationTools();
      console.log('Lista recargada');
      return true;
    } catch (err) {
      console.error('Error guardando:', err);
      setError('Error al guardar');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Handler para eliminar
  const handleDelete = async (itemId: number) => {
    if (!confirm('¿Estás seguro de eliminar este elemento?')) return;
    
    try {
      setIsLoading(true);
      await deleteCreationTool(itemId);
      // Actualizar el estado local inmediatamente
      setItems(prev => prev.filter((item: LibraryItem) => item.id !== itemId));
    } catch (err) {
      console.error('Error eliminando:', err);
      setError('Error al eliminar');
      // Si hay error, recargar la lista
      await loadCreationTools();
    } finally {
      setIsLoading(false);
    }
  };

  // Handler para cambiar visibilidad
  const handleToggleVisibility = async (itemId: number, currentIsPublic: boolean) => {
    try {
      await toggleCreationToolVisibility(itemId, !currentIsPublic);
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
    <Library 
      items={items} 
      isLoading={isLoading}
      onSave={handleSave}
      onDelete={handleDelete}
      onToggleVisibility={handleToggleVisibility}
    />
  );
};

export default LibraryContainer;