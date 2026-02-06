import React, { useCallback, useEffect, useState } from 'react';
import { getTool } from '@core/creation-tools/creation-tools.service';
import { getProjectByToolId, updateProject } from '@core/projects/projects.service';
import { Check, Loader2, XCircle } from 'lucide-react';
import { useLanguage } from '../../language/useLanguage';

type Props = {
  toolId: number;
};

const ProjectDetails: React.FC<Props> = ({ toolId }) => {
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
  // Save status
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Load project data
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        // 1) Validate type with getTool
        const data = await getTool(toolId);
        if (cancelled) return;
        if (data.type !== 'project') {
          setError(tp.errorNotProject);
          return;
        }

        // 2) Load project-specific data from projects table via /tools/{id}/project
        const projectRes = await getProjectByToolId(toolId);
        if (cancelled) return;
        // Extract all fields from project table
        setFilesUrl((projectRes as any).filesUrl || '');
        setDeploymentUrl((projectRes as any).deploymentUrl || '');
        setDatabaseUrl((projectRes as any).databaseUrl || '');
        setDataBaseName((projectRes as any).dataBaseName || '');
        setAppName((projectRes as any).appName || '');
        setCategory((projectRes as any).category || '');
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
  }, [toolId]);

  // Save handler
  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      setSaveStatus('idle');
      // Update project via PATCH /tools/{id}/project with all project fields
      await updateProject(toolId, { filesUrl, deploymentUrl, databaseUrl, dataBaseName, appName, category });
      setSaveStatus('success');
    } catch (e) {
      setSaveStatus('error');
      setError(tp.errorSaving);
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  }, [toolId, filesUrl, deploymentUrl, databaseUrl, dataBaseName, appName, category]);

  const getIcon = () => {
    if (saving) return <Loader2 size={18} className="animate-spin" />;
    if (saveStatus === 'success') return <Check size={18} />;
    if (saveStatus === 'error') return <XCircle size={18} />;
    return <Check size={18} />;
  };

  const getButtonClasses = () => {
    if (saveStatus === 'success') return 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100';
    if (saveStatus === 'error') return 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100';
    return 'bg-white border-blue-200 text-blue-600 hover:bg-blue-50';
  };

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
    <div className="flex flex-col w-full space-y-6">
      <h2 className="text-lg font-bold text-slate-900">{tp.title}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{tp.appName}</label>
          <input
            type="text"
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-600 bg-white"
            placeholder={tp.placeholderAppName}
            disabled={saving}
          />
        </div>
        
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{tp.category}</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-600 bg-white"
            placeholder={tp.placeholderCategory}
            disabled={saving}
          />
        </div>
        
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{tp.filesUrl}</label>
          <input
            type="url"
            value={filesUrl}
            onChange={(e) => setFilesUrl(e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-600 bg-white"
            placeholder={tp.placeholderFilesUrl}
            disabled={saving}
          />
        </div>
        
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{tp.deploymentUrl}</label>
          <input
            type="url"
            value={deploymentUrl}
            onChange={(e) => setDeploymentUrl(e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-600 bg-white"
            placeholder={tp.placeholderDeploymentUrl}
            disabled={saving}
          />
        </div>
        
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{tp.databaseUrl}</label>
          <input
            type="url"
            value={databaseUrl}
            onChange={(e) => setDatabaseUrl(e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-600 bg-white"
            placeholder={tp.placeholderDatabaseUrl}
            disabled={saving}
          />
        </div>
        
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{tp.databaseName}</label>
          <input
            type="text"
            value={dataBaseName}
            onChange={(e) => setDataBaseName(e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-600 bg-white"
            placeholder={tp.placeholderDatabaseName}
            disabled={saving}
          />
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>
      )}

      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className={`w-11 h-11 rounded-full border-2 flex items-center justify-center font-semibold shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed ${getButtonClasses()}`}
        >
          {getIcon()}
        </button>
      </div>
    </div>
  );
};

export default ProjectDetails;
