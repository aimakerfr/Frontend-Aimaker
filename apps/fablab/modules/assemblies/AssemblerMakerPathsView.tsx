import React, { useEffect, useState } from 'react';
import { useLanguage } from '@apps/fablab/language/useLanguage';
import { getMakerPaths } from '@core/maker-path/maker-path.service';
import { MakerPath } from '@core/maker-path/maker-path.types';
import { useNavigate } from 'react-router-dom';
import { deployAssembly } from './services/assemblyDeployment.service';
import { Rocket, ExternalLink, Settings } from 'lucide-react';
import './AssemblerMakerPathsView.css'; // Import the CSS file

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
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t?.assembler?.title || 'Assembler Maker Paths'}</h1>
        <button
          onClick={handleCreateNewAssembler}
          className="px-4 py-2 text-sm font-semibold rounded-lg transition-colors bg-blue-600 text-white hover:bg-blue-700"
        >
          {t?.assembler?.createNew || 'Create New Assembler'}
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">{t?.common?.loading || 'Loading…'}</p>
      ) : makerPaths.length > 0 ? (
        <div className="overflow-x-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <table className="min-w-full text-left text-sm">
            <thead className="text-gray-500 dark:text-gray-400">
              <tr>
                <th className="py-3 px-4">{t?.products?.fixed?.idLabel || 'ID'}</th>
                <th className="py-3 px-4">{'Title'}</th>
                <th className="py-3 px-4">{'Description'}</th>
                <th className="py-3 px-4">{'Status'}</th>
                <th className="py-3 px-4">{'Created At'}</th>
                <th className="py-3 px-4">{'Deployment URL'}</th>
                <th className="py-3 px-4">{t?.assembler?.actions || 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="text-gray-800 dark:text-gray-200">
              {makerPaths.map((mp: any) => (
                <tr key={mp.id} className="border-t border-gray-100 dark:border-gray-700">
                  <td className="py-3 px-4">{mp.id}</td>
                  <td className="py-3 px-4">{mp.title}</td>
                  <td className="py-3 px-4">{mp.description || '-'}</td>
                  <td className="py-3 px-4">{mp.status}</td>
                  <td className="py-3 px-4">{new Date(mp.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 px-4">
                    {mp.deploymentUrl || mp.deployment_url ? (
                      <a 
                        href={mp.deploymentUrl || mp.deployment_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <ExternalLink size={14} />
                        <span className="max-w-[150px] truncate block">
                          {mp.deploymentUrl || mp.deployment_url}
                        </span>
                      </a>
                    ) : '-'}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {mp.projectType === 'landing_page' ? (
                        <span className="px-3 py-2 text-sm font-semibold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 rounded-md">
                          {t?.products?.status?.deployed || 'Deployed'}
                        </span>
                      ) : (
                        <button
                          onClick={() => handleDeploy(mp.id)}
                          disabled={deployingId !== null}
                          title={t?.assembler?.deployAssembly || 'Deploy assembly'}
                          className={`px-3 py-2 rounded-md transition-all duration-300 text-white flex items-center gap-2 ${
                            deployingId === mp.id 
                              ? 'bg-green-700 scale-105 shadow-lg cursor-wait' 
                              : (mp.deploymentUrl || mp.deployment_url)
                                ? 'bg-orange-500 hover:bg-orange-600'
                                : 'bg-green-600 hover:bg-green-700'
                          } ${deployingId !== null && deployingId !== mp.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <Rocket 
                            size={16} 
                            className={deployingId === mp.id ? 'animate-rocket-deploy' : ''} 
                          />
                          <span className="font-medium">
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
                          className="p-2 rounded-md transition-colors bg-blue-600 text-white hover:bg-blue-700"
                        >
                          <Settings size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-gray-500">{t?.assembler?.noAssemblerMakerPaths || 'No assembler maker paths yet'}</p>
      )}
    </div>
  );
};

export default AssemblerMakerPathsView;
