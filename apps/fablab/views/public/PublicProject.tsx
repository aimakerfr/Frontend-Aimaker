import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FolderKanban, Globe, Calendar, User, ChevronLeft, ExternalLink, Heart, Code2, Database } from 'lucide-react';
import { getPublicCreationTool } from '@core/creation-tools/creation-tools.service';
import type { CreationTool } from '@core/creation-tools/creation-tools.types';
import { httpClient } from '@core/api/http.client';
import { useLanguage } from '../../language/useLanguage';

const PublicProject: React.FC = () => {
  const { t } = useLanguage();
  const tp = t.publicProject;
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<CreationTool | null>(null);
  const [projectData, setProjectData] = useState<{
    filesUrl?: string;
    deploymentUrl?: string;
    databaseUrl?: string;
    dataBaseName?: string;
    appName?: string;
    category?: string;
  } | null>(null);
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
          setError(tp.errorPrivate);
          return;
        }
        
        // Verificar que sea tipo project
        if (data.type !== 'project') {
          setError(tp.errorNotProject);
          return;
        }
        
        setProject(data);
        
        // Cargar datos específicos del proyecto desde la tabla projects
        try {
          const projectRes = await httpClient.get<{
            filesUrl?: string;
            deploymentUrl?: string;
            databaseUrl?: string;
            dataBaseName?: string;
            appName?: string;
            category?: string;
          }>(
            `/api/v1/tools/${id}/project`,
            { requiresAuth: false }
          );
          setProjectData(projectRes);
        } catch (projectErr) {
          console.error('Error cargando datos del proyecto:', projectErr);
          // No es error crítico, puede no tener datos específicos aún
        }
      } catch (err) {
        console.error('Error cargando proyecto:', err);
        setError(tp.errorLoading);
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [id, tp.errorPrivate, tp.errorNotProject, tp.errorLoading]);

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
        return tp.types.landingPage;
      case 'app':
        return tp.types.app;
      case 'automation':
        return tp.types.automation;
      default:
        return tp.types.project;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:to-indigo-900/10 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">{tp.loading}</p>
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
            {tp.projectInfo}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || tp.errorNotFound}
          </p>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all"
          >
            <ChevronLeft size={20} />
            {tp.back}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header simplificado con contenedor */}
      <div className="bg-white dark:bg-gray-800 border-b-2 border-gray-900 dark:border-gray-700 shadow-sm">
        <div className="max-w-5xl mx-auto px-8 py-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gray-900 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0 border-2 border-gray-900 dark:border-gray-600">
              <FolderKanban size={32} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {project.title}
                </h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-md text-xs font-semibold border-2 border-green-700">
                  <Globe size={12} />
                  {tp.public}
                </span>
                {project.isFavorite && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-md text-xs font-semibold border-2 border-red-700">
                    <Heart size={12} fill="currentColor" />
                    {tp.favorite}
                  </span>
                )}
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-3 text-base">
                {project.description || tp.noDescription}
              </p>
              <div className="flex flex-wrap gap-3 text-sm">
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600">
                  <span className="text-xl">{getProjectTypeIcon(project.projectType || 'project')}</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{getProjectTypeLabel(project.projectType || 'project')}</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600">
                  <User size={16} className="text-gray-700 dark:text-gray-300" />
                  <span className="text-gray-900 dark:text-gray-100">{project.authorName || tp.unknownAuthor}</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600">
                  <Calendar size={16} className="text-gray-700 dark:text-gray-300" />
                  <span className="font-medium uppercase text-gray-900 dark:text-gray-100">{project.language || 'ES'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content con márgenes y contenedores bien definidos */}
      <div className="max-w-5xl mx-auto px-8 py-8">
        <div className="space-y-6">{/* Deployment URL Card */}
          {projectData?.deploymentUrl && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-blue-200 dark:border-blue-900 shadow-md overflow-hidden">
              <div className="bg-blue-50 dark:bg-blue-950 px-6 py-4 border-b-2 border-blue-200 dark:border-blue-900">
                <h2 className="text-lg font-bold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                  <ExternalLink size={20} />
                  {tp.liveProject}
                </h2>
              </div>
              <div className="p-8 bg-white dark:bg-gray-800">
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">{tp.deploymentUrl}</p>
                  <a
                    href={projectData.deploymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base font-medium text-blue-600 dark:text-blue-400 hover:underline break-all"
                  >
                    {projectData.deploymentUrl}
                  </a>
                </div>
                <a
                  href={projectData.deploymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white font-semibold rounded-lg border-2 border-blue-700 dark:border-blue-600 transition-colors"
                >
                  <ExternalLink size={18} />
                  {tp.visit}
                </a>
              </div>
            </div>
          )}

          {/* Project Metadata */}
          {projectData && (projectData.filesUrl || projectData.databaseUrl || projectData.dataBaseName || projectData.appName) && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-green-200 dark:border-green-900 shadow-md overflow-hidden">
              <div className="bg-green-50 dark:bg-green-950 px-6 py-4 border-b-2 border-green-200 dark:border-green-900">
                <h2 className="text-lg font-bold text-green-900 dark:text-green-100 flex items-center gap-2">
                  <Database size={20} />
                  {tp.projectInfo}
                </h2>
              </div>
              <div className="p-8 bg-white dark:bg-gray-800">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projectData.appName && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">{tp.appName}</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{projectData.appName}</p>
                    </div>
                  )}
                  {projectData.category && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">{tp.category}</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{projectData.category}</p>
                    </div>
                  )}
                  {projectData.filesUrl && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">{tp.filesRepo}</p>
                      <a href={projectData.filesUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline break-all">
                        {projectData.filesUrl}
                      </a>
                    </div>
                  )}
                  {projectData.dataBaseName && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">{tp.database}</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{projectData.dataBaseName}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Context Card */}
          {project.context && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-purple-200 dark:border-purple-900 shadow-md overflow-hidden">
              <div className="bg-purple-50 dark:bg-purple-950 px-6 py-4 border-b-2 border-purple-200 dark:border-purple-900">
                <h2 className="text-lg font-bold text-purple-900 dark:text-purple-100 flex items-center gap-2">
                  <Code2 size={20} />
                  {tp.projectContext}
                </h2>
              </div>
              <div className="p-8 bg-white dark:bg-gray-800">
                <pre className="bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-300 dark:border-gray-700 p-4 text-sm text-gray-800 dark:text-gray-200 overflow-x-auto whitespace-pre-wrap">
{project.context}
                </pre>
              </div>
            </div>
          )}

          {/* Additional Information Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-amber-200 dark:border-amber-900 shadow-md overflow-hidden">
            <div className="bg-amber-50 dark:bg-amber-950 px-6 py-4 border-b-2 border-amber-200 dark:border-amber-900">
              <h2 className="text-lg font-bold text-amber-900 dark:text-amber-100">
                {tp.projectInfo}
              </h2>
            </div>
            <div className="p-8 bg-white dark:bg-gray-800">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">{tp.type}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getProjectTypeIcon(project.projectType || 'project')}</span>
                    <p className="text-gray-900 dark:text-white font-semibold">
                      {getProjectTypeLabel(project.projectType || 'project')}
                    </p>
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">{tp.language}</p>
                  <p className="text-gray-900 dark:text-white font-semibold uppercase">
                    {project.language || 'Español'}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">{tp.category}</p>
                  <p className="text-gray-900 dark:text-white font-semibold">
                    {project.category || tp.noCategory}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">{tp.status}</p>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-md text-sm font-semibold border-2 border-green-700">
                    <Globe size={14} />
                    {tp.public}
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
