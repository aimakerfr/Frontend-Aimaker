/* ⚠️ WARNING: Potential syntax issues detected:
 * - Potential invalid operators detected
 * Please review the code carefully before using.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Route, Search, Plus, Trash2, Eye, CheckCircle2, Clock, FileText } from 'lucide-react';
import {
  getMakerPaths,
  createMakerPath,
  deleteMakerPath
} from '@core/maker-path';
import type { MakerPath, MakerPathStatus } from '@core/maker-path';
import { RouteTypeModal } from './components';
import { useLanguage } from '../../language/useLanguage';
import { getInitialMakerPaths } from '../projectflow/demoWorkflows';

type FilterType = 'all' | 'architect_ai' | 'module_connector' | 'custom';
type StatusFilter = 'all' | 'draft' | 'in_progress' | 'completed';

const MakerPathView: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [paths, setPaths] = useState<MakerPath[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRouteTypeModal, setShowRouteTypeModal] = useState(false);

  useEffect(() => {
    loadPaths();
  }, []);

  const loadPaths = async () => {
    try {
      setIsLoading(true);
      const data = await getMakerPaths();
      setPaths(data);
    } catch (error) {
      console.error(t.makerPathTranslations?.['text_1'] ?? 'Error loading maker paths:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (type: 'blank' | 'landing_page_maker' | 'rag_chat_maker' | 'image_generator_rag' | 'translation_maker' = 'blank') => {
    try {
      let title = t.makerPathTranslations?.['text_2'] ?? 'New Project';
      let data = '';

      if (type !== 'blank') {
        const paths = getInitialMakerPaths(t);
        const template = paths[type];
        if (template) {
          title = template.path.name;
          data = JSON.stringify(template.json);
        }
      } else {
        // Enviar un JSON mínimo para proyectos en blanco
        data = JSON.stringify({
          blank_project: {
            stage_name: 'blank_project',
            description: t.makerPathTranslations?.['text_3'] ?? 'Un nuevo proyecto desde cero.',
            output_type: 'OUTPUT',
            steps: []
          }
        });
      }

      const newPath = await createMakerPath({
        title,
        description: t.makerPathTranslations?.['text_4'] ?? 'Creado desde el dashboard',
        type: 'custom',
        status: 'draft',
        data
      });

      setShowRouteTypeModal(false);

      if (type === 'blank') {
        navigate(`/dashboard/projectflow?id=${newPath.id}`);
      } else {
        navigate(`/dashboard/projectflow?maker_path_template=${type}&id=${newPath.id}`);
      }
    } catch (error) {
      console.error(t.makerPathTranslations?.['text_5'] ?? 'Error creating project:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t.makerPathTranslations?.['text_6'] ?? '¿Estás seguro de que quieres eliminar este proyecto?')) return;
    try {
      await deleteMakerPath(id);
      await loadPaths();
    } catch (error) {
      console.error(t.makerPathTranslations?.['text_7'] ?? 'Error deleting project:', error);
    }
  };

  const handleRedirectToPlanner = (pathId: number) => {
    const path = paths.find(p => p.id === pathId);
    if ((path?.type as string) === 'module_connector' || (path?.type as string) === 'architect_ai') {
      navigate(`/dashboard/maker-path/modules/${pathId}`);
    } else {
      // Try to detect which template was used by checking the data
      let detectedTemplate: string | null = null;

      if (path?.data) {
        try {
          const dataStr = typeof path.data === 'string' ? path.data : JSON.stringify(path.data);
          const parsed = JSON.parse(dataStr);
          const workflowKey = Object.keys(parsed)[0];

          // Check if the workflow matches any known template
          if (workflowKey === 'simple_landing_creator') {
            detectedTemplate = 'landing_page_maker';
          } else if (workflowKey === 'rag_chat_creator') {
            detectedTemplate = 'rag_chat_maker';
          } else if (workflowKey === 'rag_image_generator') {
            detectedTemplate = 'image_generator_rag';
          }
        } catch (e) {
          console.error(t.makerPathTranslations?.['text_8'] ?? 'Error parsing path data:', e);
        }
      }

      // Navigate with appropriate query parameters
      if (detectedTemplate) {
        navigate(`/dashboard/projectflow?maker_path_template=${detectedTemplate}&id=${pathId}`);
      } else {
        navigate(`/dashboard/projectflow?id=${pathId}`);
      }
    }
  };

  const getFilteredPaths = () => {
    let filtered = [...paths];

    if (activeFilter !== 'all') {
      filtered = filtered.filter(path => path.type === activeFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(path => path.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(path =>
        path.title?.toLowerCase().includes(query) ||
        path.description?.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const filteredPaths = getFilteredPaths();

  const getStatusIcon = (status: MakerPathStatus) => {
    switch (status) {
      case 'completed': return <CheckCircle2 size={16} className="text-green-500" />;
      case 'in_progress': return <Clock size={16} className="text-yellow-500" />;
      default: return <FileText size={16} className="text-gray-400" />;
    }
  };

  const getStatusLabel = (status: MakerPathStatus) => {
    const labels = {
      draft: t.makerPath.statuses.draft,
      in_progress: t.makerPath.statuses.inProgress,
      completed: t.makerPath.statuses.completed
    };
    return labels[status] || status;
  };

  const getTypeLabel = (type: string) => {
    if (type === 'architect_ai') return t.makerPath.types.architectAI;
    if (type === 'module_connector') return t.makerPath.types.moduleConnector;
    if (type === 'custom') return 'custom';
    return t.makerPath.types.custom;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/10 p-6">
      {/* Modal de selección de tipo de proyecto */}
      <RouteTypeModal
        isOpen={showRouteTypeModal}
        onClose={() => setShowRouteTypeModal(false)}
        onSelect={(type) => handleCreate(type as any)}
      />

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{t.makerPathTranslations?.['text_9']}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{t.makerPathTranslations?.['text_10']}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowRouteTypeModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-[1.02]"
            >
              <Plus size={20} />{t.makerPathTranslations?.['text_11']}</button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder={t.makerPath.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none w-full shadow-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value as FilterType)}
              className="px-4 py-2.5 font-medium rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">{t.makerPath.allTypes}</option>
              <option value="architect_ai">{t.makerPath.types.architectAI}</option>
              <option value="module_connector">{t.makerPath.types.moduleConnector}</option>
              <option value="custom">{t.makerPath.types.custom}</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="px-4 py-2.5 font-medium rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">{t.makerPath.allStatuses}</option>
              <option value="draft">{t.makerPath.statuses.draft}</option>
              <option value="in_progress">{t.makerPath.statuses.inProgress}</option>
              <option value="completed">{t.makerPath.statuses.completed}</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-blue-50/50 dark:from-gray-900 dark:to-blue-900/20 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-12 gap-4 px-6 py-4">
              <div className="col-span-1 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{t.makerPathTranslations?.['text_12']}</div>
              <div className="col-span-4 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{t.makerPathTranslations?.['text_13']}</div>
              <div className="col-span-2 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{t.makerPathTranslations?.['text_14']}</div>
              <div className="col-span-2 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{t.makerPathTranslations?.['text_15']}</div>
              <div className="col-span-3 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{t.makerPathTranslations?.['text_16']}</div>
            </div>
          </div>

          {isLoading ? (
            <div className="px-6 py-16 text-center text-gray-500">
              <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4">{t.common.loading}</p>
            </div>
          ) : filteredPaths.length === 0 ? (
            <div className="px-6 py-16 text-center text-gray-500">{t.server.noResults}</div>
          ) : (
            <div>
              {filteredPaths.map((path, index) => (
                <div
                  key={path.id}
                  className={`grid grid-cols-12 gap-4 px-6 py-6 items-center hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all ${index !== filteredPaths.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
                    }`}
                >
                  {/* Type */}
                  <div className="col-span-1">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                        <Route size={24} className="text-white" />
                      </div>
                      <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide text-center">
                        {getTypeLabel(path.type)}
                      </div>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="col-span-4">
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1">
                      {path.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                      {path.description || t.makerPath.noDescription}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(path.status)}
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {getStatusLabel(path.status)}
                      </span>
                    </div>
                  </div>

                  {/* Created At */}
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(path.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="col-span-3 flex gap-2">
                    <button
                      onClick={() => handleRedirectToPlanner(path.id)}
                      className="flex items-center gap-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium"
                      title={t.makerPath.tooltips.open}
                    >
                      <Eye size={16} />
                      {t.common.view}
                    </button>
                    <button
                      onClick={() => handleDelete(path.id)}
                      className="p-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                      title={t.common.delete}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MakerPathView;
