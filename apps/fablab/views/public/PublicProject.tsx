import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FolderKanban, Globe, Calendar, User, ChevronLeft, ExternalLink, Heart, Code2 } from 'lucide-react';
import { getPublicCreationTool } from '@core/creation-tools/creation-tools.service';
import type { CreationTool } from '@core/creation-tools/creation-tools.types';

const PublicProject: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<CreationTool | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProject = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await getPublicCreationTool(parseInt(id));
        
        // Verificar que sea público
        if (!data.hasPublicStatus) {
          setError('Este proyecto es privado y no está disponible públicamente.');
          return;
        }
        
        // Verificar que sea tipo project
        if (data.type !== 'project') {
          setError('El recurso solicitado no es un proyecto.');
          return;
        }
        
        setProject(data);
      } catch (err) {
        console.error('Error cargando proyecto:', err);
        setError('No se pudo cargar el proyecto. Puede que no exista o no sea público.');
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [id]);

  const getProjectTypeIcon = (type: string) => {
    switch (type) {
      case 'landing page':
        return '🌐';
      case 'app':
        return '📱';
      case 'automation':
        return '⚙️';
      default:
        return '📁';
    }
  };

  const getProjectTypeLabel = (type: string) => {
    switch (type) {
      case 'landing page':
        return 'Landing Page';
      case 'app':
        return 'Aplicación';
      case 'automation':
        return 'Automatización';
      default:
        return 'Proyecto';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:to-indigo-900/10 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando proyecto...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:to-indigo-900/10 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FolderKanban size={32} className="text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Proyecto no disponible
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || 'No se encontró el proyecto solicitado.'}
          </p>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all"
          >
            <ChevronLeft size={20} />
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:to-indigo-900/10">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
              <FolderKanban size={32} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {project.title}
                </h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-semibold">
                  <Globe size={14} />
                  Público
                </span>
                {project.isFavorite && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-xs font-semibold">
                    <Heart size={14} fill="currentColor" />
                    Favorito
                  </span>
                )}
              </div>
              <p className="text-gray-500 dark:text-gray-400 mb-3">
                {project.description || 'Sin descripción'}
              </p>
              <div className="flex flex-wrap gap-3 text-sm">
                <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                  <span className="text-lg">{getProjectTypeIcon(project.projectType || 'project')}</span>
                  <span className="font-medium">{getProjectTypeLabel(project.projectType || 'project')}</span>
                </div>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                  <User size={16} />
                  <span>{project.authorName || 'Autor desconocido'}</span>
                </div>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                  <Calendar size={16} />
                  <span className="uppercase">{project.language || 'ES'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid gap-6">
          {/* Deployment URL Card */}
          {project.deploymentUrl && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <ExternalLink size={20} />
                  Proyecto en Vivo
                </h2>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">URL de despliegue</p>
                    <a
                      href={project.deploymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium break-all"
                    >
                      {project.deploymentUrl}
                    </a>
                  </div>
                  <a
                    href={project.deploymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2"
                  >
                    <ExternalLink size={18} />
                    Visitar
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Context Card */}
          {project.context && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Code2 size={20} />
                  Contexto del Proyecto
                </h2>
              </div>
              <div className="p-6">
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <pre className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 text-sm leading-relaxed text-gray-700 dark:text-gray-300 overflow-x-auto whitespace-pre-wrap">
{project.context}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Info Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <FolderKanban size={24} className="text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                      Vista pública de proyecto
                    </h3>
                    <p className="text-sm text-blue-800 dark:text-blue-400 leading-relaxed">
                      Esta es una vista de solo lectura del proyecto. Para acceder a todas las funcionalidades, herramientas de edición y gestión del proyecto, inicia sesión en la plataforma AIMaker FabLab.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Metadata Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4">
              <h2 className="text-lg font-bold text-white">
                Información del Proyecto
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tipo de Proyecto</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getProjectTypeIcon(project.projectType || 'project')}</span>
                    <p className="text-gray-900 dark:text-white font-semibold">
                      {getProjectTypeLabel(project.projectType || 'project')}
                    </p>
                  </div>
                </div>
                
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Idioma</p>
                  <p className="text-gray-900 dark:text-white font-semibold uppercase">
                    {project.language || 'Español'}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Categoría</p>
                  <p className="text-gray-900 dark:text-white font-semibold">
                    {project.category || 'Sin categoría'}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Estado</p>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm font-semibold">
                    <Globe size={14} />
                    Público
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicProject;
