import React, { useEffect, useState } from 'react';
import { useLanguage } from '@apps/fablab/language/useLanguage';
import { getMakerPaths } from '@core/maker-path/maker-path.service';
import { MakerPath } from '@core/maker-path/maker-path.types';
import { useNavigate } from 'react-router-dom';
import { deployAssembly } from './services/assemblyDeployment.service';
import { Rocket, ExternalLink, Settings } from 'lucide-react';
import '../../views/assembler/style.css'; // Import the CSS file

const AssemblerMakerPathsView: React.FC = () => {
  const { t } = useLanguage();
  const [makerPaths, setMakerPaths] = useState<MakerPath[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadMakerPaths = async () => {
      try {
        setLoading(true);
        // Fetch maker paths with type 'assembler'
        const data = await getMakerPaths({ type: 'assembler' });
        setMakerPaths(data);
      } catch (error) {
        console.error('Failed to load assembler maker paths:', error);
        setMakerPaths([]);
      } finally {
        setLoading(false);
      }
    };
    loadMakerPaths();
  }, []);

  const handleCreateNewAssembler = () => {
    navigate('/dashboard/assembler/new');
  };

  const [deployingId, setDeployingId] = useState<number | null>(null);

  // Prevent page closure during deployment
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (deployingId !== null) {
        event.preventDefault();
        event.returnValue = ''; // Trigger browser prompt
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [deployingId]);

  const handleDeploy = async (id: number) => {
    try {
      setDeployingId(id);
      await deployAssembly(id);
      
      // Redirect to the applications deployer view for this makerPathId
      navigate(`/dashboard/applications/deployer?id=${id}`);
    } catch (error: any) {
      console.error('Failed to deploy assembly:', error);
      alert(error.message || 'Failed to deploy assembly. Check console for details.');
    } finally {
      setDeployingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* CTA: Create New Assembler */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t?.assembler?.title || 'Assembler'}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t?.assembler?.subtitle || 'Create and manage your assembler projects'}
          </p>
        </div>
        <div>
          <button
            type="button"
            onClick={handleCreateNewAssembler}
            className="inline-flex items-center px-4 py-2 rounded-xl bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white text-sm font-semibold transition-colors"
          >
            {t?.assembler?.createNew || 'Ensamblar'}
          </button>
        </div>
      </div>

      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-semibold mb-2">
          {t?.assembler?.makerPathsTitle || 'Assembler Maker Paths'}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t?.assembler?.makerPathsSubtitle || 'Overview of your assembler projects and their deployment status'}
        </p>
      </div>

      {loading && (
        <div className="text-gray-600 dark:text-gray-300">{t?.common?.loading || 'Loading…'}</div>
      )}

      {!loading && makerPaths.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800/60">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t?.products?.fixed?.idLabel || 'ID'}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deployment URL</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Files URL</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t?.assembler?.actions || 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {makerPaths.map((mp: any) => (
                <tr key={mp.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                  <td className="px-4 py-3 text-sm">{mp.id}</td>
                  <td className="px-4 py-3 text-sm">{mp.title}</td>
                  <td className="px-4 py-3 text-sm">{mp.description || '-'}</td>
                  <td className="px-4 py-3 text-sm">{mp.status}</td>
                  <td className="px-4 py-3 text-sm">{new Date(mp.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm">
                    {mp.deploymentUrl || mp.deployment_url ? (
                      <a 
                        href={mp.deploymentUrl || mp.deployment_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <ExternalLink size={14} className="mr-1" />
                        <span className="truncate max-w-[200px]">
                          {mp.deploymentUrl || mp.deployment_url}
                        </span>
                      </a>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span>
                      {mp.projectType || mp.project_type || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {mp.filesUrl || mp.files_url ? (
                      <a 
                        href={mp.filesUrl || mp.files_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <ExternalLink size={14} className="mr-1" />
                        <span className="truncate max-w-[200px]">
                          {mp.filesUrl || mp.files_url}
                        </span>
                      </a>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex flex-wrap gap-2">
                      {mp.projectType === 'landing_page' ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-xs">
                          {t?.products?.status?.deployed || 'Deployed'}
                        </span>
                      ) : (
                        <button
                          onClick={() => handleDeploy(mp.id)}
                          disabled={deployingId !== null}
                          title={t?.assembler?.deployAssembly || 'Deploy assembly'}
                          className="inline-flex items-center px-3 py-1.5 rounded-md bg-brand-600 text-white hover:bg-brand-700 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Rocket 
                            size={16} 
                            className={`mr-1 ${deployingId === mp.id ? 'animate-rocket-deploy' : ''}`} 
                          />
                          <span>
                            {deployingId === mp.id 
                              ? (t?.common?.loading || 'Deploying...') 
                              : (mp.deploymentUrl || mp.deployment_url)
                                ? (t?.assembler?.reDeployAssembly || 'Re-Deploy')
                                : (t?.assembler?.deployAssembly || 'Deploy')}
                          </span>
                        </button>
                      )}

                      {(mp.hasApplicationDeployment === true || 
                        mp.has_application_deployment === 1 || 
                        mp.has_application_deployment === true || 
                        mp.has_application_deployment === '1') && (
                        <button
                          onClick={() => navigate(`/dashboard/applications/deployer?id=${mp.id}`)}
                          title={t?.actions?.manageProjectApplication || 'Manage project application'}
                          className="inline-flex items-center px-3 py-1.5 rounded-md bg-gray-600 text-white hover:bg-gray-700 text-sm transition-colors"
                        >
                          <Settings size={16} className="mr-1" />
                          <span>{t?.actions?.manage || 'Manage'}</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && makerPaths.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          {t?.assembler?.noAssemblerMakerPaths || 'No assembler maker paths yet'}
        </div>
      )}
    </div>
  );
};

export default AssemblerMakerPathsView;
