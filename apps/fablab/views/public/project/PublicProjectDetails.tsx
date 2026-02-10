import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../../language/useLanguage';

type Props = {
  toolId: number;
};

const PublicProjectDetails: React.FC<Props> = ({ toolId }) => {
  const { t } = useLanguage();
  const tp = t.projectDetails;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Project-specific fields from projects table
  const [filesUrl, setFilesUrl] = useState('');
  const [deploymentUrl, setDeploymentUrl] = useState('');
  const [databaseUrl, setDatabaseUrl] = useState('');
  const [dataBaseName, setDataBaseName] = useState('');
  const [appName, setAppName] = useState('');
  const [category, setCategory] = useState('');
  // Tool metadata
  const [toolTitle, setToolTitle] = useState('');
  const [toolDescription, setToolDescription] = useState('');
  const [toolCategory, setToolCategory] = useState('');
  const [toolLanguage, setToolLanguage] = useState('');

  // Load project data from public endpoint
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        // Load tool data
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8001'}/api/v1/tools/${toolId}`);
        if (!response.ok) {
          throw new Error('Failed to load tool');
        }
        const data = await response.json();
        if (cancelled) return;
        
        if (data.type !== 'project') {
          setError(tp.errorNotProject);
          return;
        }

        // Save tool metadata
        setToolTitle(data.title || '');
        setToolDescription(data.description || '');
        setToolCategory(data.category || '');
        setToolLanguage(data.language || '');

        // Load project-specific data
        const projectResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8001'}/api/v1/tools/${toolId}/project`);
        if (!projectResponse.ok) {
          throw new Error('Failed to load project');
        }
        const projectRes = await projectResponse.json();
        if (cancelled) return;
        
        setFilesUrl(projectRes.filesUrl || '');
        setDeploymentUrl(projectRes.deploymentUrl || '');
        setDatabaseUrl(projectRes.databaseUrl || '');
        setDataBaseName(projectRes.dataBaseName || '');
        setAppName(projectRes.appName || '');
        setCategory(projectRes.category || '');
        setError(null);
      } catch (e) {
        if (!cancelled) setError(tp.errorLoading);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [toolId, tp.errorNotProject, tp.errorLoading]);

  if (loading) {
    return (
      <div className="flex flex-col w-full space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-100 rounded w-1/3" />
          <div className="h-12 bg-slate-100 rounded" />
          <div className="h-12 bg-slate-100 rounded" />
          <div className="h-12 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-8 py-10">
      <div className="flex flex-col w-full space-y-6">
        {/* Header Section with Tool Info */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <h1 className="text-3xl font-bold text-slate-900">{toolTitle || 'Project'}</h1>
          <div className="flex gap-2">
            {toolCategory && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                {toolCategory}
              </span>
            )}
            {toolLanguage && (
              <span className="px-3 py-1 bg-cyan-100 text-cyan-700 text-xs font-semibold rounded-full uppercase">
                {toolLanguage}
              </span>
            )}
          </div>
        </div>
        {toolDescription && (
          <p className="text-slate-600 text-sm leading-relaxed">{toolDescription}</p>
        )}
      </div>

      <h2 className="text-lg font-bold text-slate-900">{tp.title}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{tp.appName}</label>
          <input
            type="text"
            value={appName}
            readOnly
            disabled
            className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm text-slate-600 bg-slate-50 cursor-not-allowed opacity-80"
          />
        </div>
        
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{tp.category}</label>
          <input
            type="text"
            value={category}
            readOnly
            disabled
            className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm text-slate-600 bg-slate-50 cursor-not-allowed opacity-80"
          />
        </div>
        
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{tp.filesUrl}</label>
          <input
            type="url"
            value={filesUrl}
            readOnly
            disabled
            className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm text-slate-600 bg-slate-50 cursor-not-allowed opacity-80"
          />
        </div>
        
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{tp.deploymentUrl}</label>
          <input
            type="url"
            value={deploymentUrl}
            readOnly
            disabled
            className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm text-slate-600 bg-slate-50 cursor-not-allowed opacity-80"
          />
        </div>
        
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{tp.databaseUrl}</label>
          <input
            type="url"
            value={databaseUrl}
            readOnly
            disabled
            className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm text-slate-600 bg-slate-50 cursor-not-allowed opacity-80"
          />
        </div>
        
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{tp.databaseName}</label>
          <input
            type="text"
            value={dataBaseName}
            readOnly
            disabled
            className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm text-slate-600 bg-slate-50 cursor-not-allowed opacity-80"
          />
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>
      )}
    </div>
    </div>
  );
};

export default PublicProjectDetails;
