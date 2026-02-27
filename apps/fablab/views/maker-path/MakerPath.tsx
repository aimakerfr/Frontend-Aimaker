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
  updateMakerPath,
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

  // Reload paths when returning to this view (e.g., after completing a maker path)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('[MakerPath] Page visible again, reloading paths...');
        loadPaths();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const loadPaths = async () => {
    try {
      setIsLoading(true);
      const data = await getMakerPaths();
      setPaths(data);
    } catch (error) {
      console.error(t.makerPathTranslations?.['text_1'] ?? 'Error al cargar las rutas del creador:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (
    type: 'blank' | 'landing_page_maker' | 'rag_chat_maker' | 'image_generator_rag' | 'translation_maker' = 'blank',
    customTitle?: string,
    customDescription?: string
  ) => {
    try {
      let title = customTitle || t.makerPathTranslations?.['text_2'] || 'Proyecto sin título';
      let description = customDescription || t.makerPathTranslations?.['text_4'] || 'Creado desde el dashboard';
      let data = '';

      if (type !== 'blank') {
        const paths = getInitialMakerPaths(t);
        const template = paths[type];
        if (template) {
          data = JSON.stringify(template.json);
        }
      } else {
        // Enviar un JSON mínimo para proyectos en blanco
        data = JSON.stringify({
          blank_project: {
            stage_name: 'blank_project',
            description: t.makerPathTranslations?.['text_3'] || 'Un nuevo proyecto desde cero.',
            output_type: 'OUTPUT',
            steps: []
          }
        });
      }

      const newPath = await createMakerPath({
        title,
        description,
        type: type !== 'blank' ? type : 'custom',
        status: 'draft',
        data
      });

      // Build the edition URL
      const editionUrl = type === 'blank' 
        ? `/dashboard/projectflow?id=${newPath.id}`
        : `/dashboard/projectflow?maker_path_template=${type}&id=${newPath.id}`;

      // Update the maker path with the edition URL
      await updateMakerPath(newPath.id, { editionUrl });

      setShowRouteTypeModal(false);
      navigate(editionUrl);

  } catch (error) {
    console.error(
      t.makerPathTranslations?.['text_5'] || 'Error al crear el proyecto:',
      error
    );
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t.makerPathTranslations?.['text_6'] ?? '¿Estás seguro de que quieres eliminar este proyecto?')) return;
    try {
      await deleteMakerPath(id);
      await loadPaths();
    } catch (error) {
      console.error(t.makerPathTranslations?.['text_7'] ?? 'Error al eliminar el proyecto:', error);
    }
  };
const handleRedirectToPlanner = (pathId: number) => {
  const path = paths.find(p => p.id === pathId);

  if ((path?.type as string) === 'module_connector' || (path?.type as string) === 'architect_ai') {
    navigate(`/dashboard/maker-path/modules/${pathId}`);
    return;
  }

  const knownTemplates = ['rag_chat_maker', 'landing_page_maker', 'image_generator_rag', 'translation_maker'];
  const isTemplate = knownTemplates.includes(path?.type ?? '');

  if (isTemplate) {
    navigate(`/dashboard/projectflow?maker_path_template=${path!.type}&id=${pathId}`);
  } else {
    navigate(`/dashboard/projectflow?id=${pathId}`);
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
      draft: t.makerPathTranslations?.['text_9'] ?? 'Borrador',
      in_progress: t.makerPathTranslations?.['text_10'] ?? 'En Progreso',
      completed: t.makerPathTranslations?.['text_11'] ?? 'Completado'
    };
    return labels[status] || status;
  };

  const getTypeLabel = (type: string) => {
    if (type === 'architect_ai') return t.makerPathTranslations?.['text_12'] ?? 'Ruta Arquitecto AI';
    if (type === 'module_connector') return t.makerPathTranslations?.['text_13'] ?? 'Conector de Módulos';
    if (type === 'custom') return t.makerPathTranslations?.['text_14'] ?? 'Personalizada';
    return t.makerPathTranslations?.['text_14'] ?? 'Personalizada';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/10 p-6">
      {/* Modal de selección de tipo de proyecto */}
      <RouteTypeModal
        isOpen={showRouteTypeModal}
        onClose={() => setShowRouteTypeModal(false)}
        onSelect={(type, title, description) =>
          handleCreate(type as any, title, description)
        }
      />

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {t.makerPathTranslations?.['text_15'] ?? 'Proyectos'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {t.makerPathTranslations?.['text_16'] ?? 'Gestiona y crea tus flujos de trabajo'}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowRouteTypeModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-[1.02]"
            >
              <Plus size={20} />{t.makerPathTranslations?.['text_17'] ?? 'Nuevo Proyecto'}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder={t.makerPathTranslations?.['text_18'] ?? 'Buscar rutas...'}
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
              <option value="all">{t.makerPathTranslations?.['text_19'] ?? 'Todos los tipos'}</option>
              <option value="architect_ai">{t.makerPathTranslations?.['text_12'] ?? 'Ruta Arquitecto AI'}</option>
              <option value="module_connector">{t.makerPathTranslations?.['text_13'] ?? 'Conector de Módulos'}</option>
              <option value="custom">{t.makerPathTranslations?.['text_14'] ?? 'Personalizada'}</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="px-4 py-2.5 font-medium rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">{t.makerPathTranslations?.['text_20'] ?? 'Todos los estados'}</option>
              <option value="draft">{t.makerPathTranslations?.['text_9'] ?? 'Borrador'}</option>
              <option value="in_progress">{t.makerPathTranslations?.['text_10'] ?? 'En Progreso'}</option>
              <option value="completed">{t.makerPathTranslations?.['text_11'] ?? 'Completado'}</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-blue-50/50 dark:from-gray-900 dark:to-blue-900/20 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-12 gap-4 px-6 py-4">
              <div className="col-span-1 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{t.makerPathTranslations?.['text_21'] ?? 'Tipo'}</div>
              <div className="col-span-4 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{t.makerPathTranslations?.['text_22'] ?? 'Título y Descripción'}</div>
              <div className="col-span-2 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{t.makerPathTranslations?.['text_23'] ?? 'Estado'}</div>
              <div className="col-span-2 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{t.makerPathTranslations?.['text_24'] ?? 'Fecha de Creación'}</div>
              <div className="col-span-3 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{t.makerPathTranslations?.['text_25'] ?? 'Acciones'}</div>
            </div>
          </div>

          {isLoading ? (
            <div className="px-6 py-16 text-center text-gray-500">
              <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4">{t.makerPathTranslations?.['text_26'] ?? 'Cargando...'}</p>
            </div>
          ) : filteredPaths.length === 0 ? (
            <div className="px-6 py-16 text-center text-gray-500">{t.makerPathTranslations?.['text_27'] ?? 'Sin resultados'}</div>
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
                      {path.description || (t.makerPathTranslations?.['text_28'] ?? 'Sin descripción')}
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
                      title={t.makerPathTranslations?.['text_29'] ?? 'Abrir ruta'}
                    >
                      <Eye size={16} />
                      {t.makerPathTranslations?.['text_30'] ?? 'Ver'}
                    </button>
                    <button
                      onClick={() => handleDelete(path.id)}
                      className="p-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                      title={t.makerPathTranslations?.['text_31'] ?? 'Eliminar'}
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