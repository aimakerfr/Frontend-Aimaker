import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Power, PowerOff, Bot, Workflow, Database, Zap, Image as ImageIcon, Settings } from 'lucide-react';
import { 
  getServerTools, 
  createServerTool, 
  updateServerTool, 
  deleteServerTool,
  toggleServerToolStatus 
} from '@core/server-tools';
import type { ServerTool, ServerToolType } from '@core/server-tools';
import { useLanguage } from '../../language/useLanguage';

type FilterType = 'all' | ServerToolType;

const ServerView: React.FC = () => {
  const { t } = useLanguage();
  
  const [tools, setTools] = useState<ServerTool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTool, setEditingTool] = useState<ServerTool | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'llm' as ServerToolType,
    url: '',
    apiKey: '',
    configJson: {},
    isActive: true
  });

  const toolTypes = [
    { type: 'llm' as const, icon: Bot, label: 'LLM', color: 'from-purple-500 to-pink-600' },
    { type: 'n8n_workflow' as const, icon: Workflow, label: 'n8n Workflow', color: 'from-orange-500 to-red-600' },
    { type: 'perplexity_index' as const, icon: Database, label: 'Perplexity Index', color: 'from-blue-500 to-cyan-600' },
    { type: 'api_prompt_optimize' as const, icon: Zap, label: 'API Prompt Optimize', color: 'from-yellow-500 to-orange-600' },
    { type: 'image_generation' as const, icon: ImageIcon, label: 'Image Generation', color: 'from-green-500 to-teal-600' },
    { type: 'administration' as const, icon: Settings, label: 'Administration', color: 'from-gray-500 to-slate-600' }
  ];

  useEffect(() => {
    loadTools();
  }, []);

  const loadTools = async () => {
    try {
      setIsLoading(true);
      const data = await getServerTools();
      setTools(data);
    } catch (error) {
      console.error('Error loading server tools:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await createServerTool(formData);
      await loadTools();
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error('Error creating server tool:', error);
    }
  };

  const handleUpdate = async () => {
    if (!editingTool) return;
    try {
      await updateServerTool(editingTool.id, formData);
      await loadTools();
      setEditingTool(null);
      resetForm();
    } catch (error) {
      console.error('Error updating server tool:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t.server.deleteConfirm)) return;
    try {
      await deleteServerTool(id);
      await loadTools();
    } catch (error) {
      console.error('Error deleting server tool:', error);
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      await toggleServerToolStatus(id, !currentStatus);
      await loadTools();
    } catch (error) {
      console.error('Error toggling server tool status:', error);
    }
  };

  const handleEdit = (tool: ServerTool) => {
    setEditingTool(tool);
    setFormData({
      name: tool.name,
      description: tool.description || '',
      type: tool.type,
      url: tool.url || '',
      apiKey: tool.apiKey || '',
      configJson: tool.configJson || {},
      isActive: tool.isActive
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'llm',
      url: '',
      apiKey: '',
      configJson: {},
      isActive: true
    });
  };

  const getFilteredTools = () => {
    let filtered = [...tools];

    if (activeFilter !== 'all') {
      filtered = filtered.filter(tool => tool.type === activeFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tool =>
        tool.name?.toLowerCase().includes(query) ||
        tool.description?.toLowerCase().includes(query) ||
        tool.type?.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const filteredTools = getFilteredTools();

  const getTypeConfig = (type: ServerToolType) => {
    return toolTypes.find(t => t.type === type) || toolTypes[0];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/10 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Server Tools
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Gestiona tus herramientas de servidor e integraciones</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-[1.02]"
          >
            <Plus size={20} />
            Nueva Herramienta
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar herramientas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none w-full shadow-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-5 py-2.5 font-medium transition-all rounded-xl ${
                activeFilter === 'all'
                  ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-md border border-blue-200 dark:border-blue-800'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Todos
            </button>
            {toolTypes.map(({ type, label }) => (
              <button
                key={type}
                onClick={() => setActiveFilter(type)}
                className={`px-5 py-2.5 font-medium transition-all rounded-xl ${
                  activeFilter === type
                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-md border border-blue-200 dark:border-blue-800'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-blue-50/50 dark:from-gray-900 dark:to-blue-900/20 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-12 gap-4 px-6 py-4">
              <div className="col-span-1 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{t.server.tableHeaders.type}</div>
              <div className="col-span-3 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{t.server.tableHeaders.nameDescription}</div>
              <div className="col-span-2 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{t.server.tableHeaders.url}</div>
              <div className="col-span-1 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{t.server.tableHeaders.status}</div>
              <div className="col-span-2 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{t.server.tableHeaders.creationDate}</div>
              <div className="col-span-3 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{t.server.tableHeaders.actions}</div>
            </div>
          </div>

          {isLoading ? (
            <div className="px-6 py-16 text-center text-gray-500">
              <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4">{t.common.loading}</p>
            </div>
          ) : filteredTools.length === 0 ? (
            <div className="px-6 py-16 text-center text-gray-500">No se encontraron herramientas</div>
          ) : (
            <div>
              {filteredTools.map((tool, index) => {
                const typeConfig = getTypeConfig(tool.type);
                const TypeIcon = typeConfig.icon;
                
                return (
                  <div
                    key={tool.id}
                    className={`grid grid-cols-12 gap-4 px-6 py-6 items-center hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all ${
                      index !== filteredTools.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
                    }`}
                  >
                    {/* Type */}
                    <div className="col-span-1">
                      <div className="flex flex-col items-center gap-2">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${typeConfig.color} flex items-center justify-center shadow-lg`}>
                          <TypeIcon size={24} className="text-white" />
                        </div>
                        <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide text-center">
                          {typeConfig.label}
                        </div>
                      </div>
                    </div>

                    {/* Name & Description */}
                    <div className="col-span-3">
                      <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1">
                        {tool.name}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                        {tool.description || 'Sin descripción'}
                      </p>
                    </div>

                    {/* URL */}
                    <div className="col-span-2">
                      {tool.url ? (
                        <a
                          href={tool.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline text-sm truncate block"
                        >
                          {tool.url}
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </div>

                    {/* Status */}
                    <div className="col-span-1">
                      {tool.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                          <Power size={12} />
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-xs font-medium">
                          <PowerOff size={12} />
                          Inactivo
                        </span>
                      )}
                    </div>

                    {/* Created At */}
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(tool.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="col-span-3 flex gap-2">
                      <button
                        onClick={() => handleToggleStatus(tool.id, tool.isActive)}
                        className={`p-2 rounded-lg transition-colors ${
                          tool.isActive
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400'
                            : 'bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400'
                        }`}
                        title={tool.isActive ? 'Desactivar' : 'Activar'}
                      >
                        {tool.isActive ? <PowerOff size={16} /> : <Power size={16} />}
                      </button>
                      <button
                        onClick={() => handleEdit(tool)}
                        className="p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                        title={t.server.tooltips.edit}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(tool.id)}
                        className="p-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                        title={t.server.tooltips.delete}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingTool) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {editingTool ? 'Editar Herramienta' : 'Nueva Herramienta'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingTool(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.server.form.name}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder={t.server.form.namePlaceholder}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.server.form.description}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  rows={3}
                  placeholder={t.server.form.descriptionPlaceholder}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as ServerToolType })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {toolTypes.map(({ type, label }) => (
                    <option key={type} value={type}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  URL
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  API Key
                </label>
                <input
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="API Key (opcional)"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Herramienta activa
                </label>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingTool(null);
                  resetForm();
                }}
                className="px-6 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors font-medium"
              >
                {t.server.form.cancel}
              </button>
              <button
                onClick={editingTool ? handleUpdate : handleCreate}
                disabled={!formData.name.trim()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingTool ? t.server.form.save : t.server.form.create}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServerView;
