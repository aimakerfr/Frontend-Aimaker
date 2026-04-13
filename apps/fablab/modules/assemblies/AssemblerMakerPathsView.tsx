import React, { useEffect, useState } from 'react';
import { useLanguage } from '@apps/fablab/language/useLanguage';
import { getMakerPaths } from '@core/maker-path/maker-path.service';
import { MakerPath } from '@core/maker-path/maker-path.types';
import { useNavigate } from 'react-router-dom';
import { deployAssembly } from './services/assemblyDeployment.service';
import { Rocket, ExternalLink, Settings } from 'lucide-react';
import '../views/assembler/style.css'; // Import the CSS file

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
    <div>
      <div>
        <h1>{t?.assembler?.title || 'Assembler Maker Paths'}</h1>
        <button
          onClick={handleCreateNewAssembler}
        >
          {t?.assembler?.createNew || 'Create New Assembler'}
        </button>
      </div>

      {loading ? (
        <p>{t?.common?.loading || 'Loading…'}</p>
      ) : makerPaths.length > 0 ? (
        <div>
          <table>
            <thead>
              <tr>
                <th>{t?.products?.fixed?.idLabel || 'ID'}</th>
                <th>{'Title'}</th>
                <th>{'Description'}</th>
                <th>{'Status'}</th>
                <th>{'Created At'}</th>
                <th>{'Deployment URL'}</th>
                <th>{'Project Type'}</th>
                <th>{'Files URL'}</th>
                <th>{t?.assembler?.actions || 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {makerPaths.map((mp: any) => (
                <tr key={mp.id}>
                  <td>{mp.id}</td>
                  <td>{mp.title}</td>
                  <td>{mp.description || '-'}</td>
                  <td>{mp.status}</td>
                  <td>{new Date(mp.createdAt).toLocaleDateString()}</td>
                  <td>
                    {mp.deploymentUrl || mp.deployment_url ? (
                      <a 
                        href={mp.deploymentUrl || mp.deployment_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <ExternalLink size={14} />
                        <span>
                          {mp.deploymentUrl || mp.deployment_url}
                        </span>
                      </a>
                    ) : '-'}
                  </td>
                  <td>
                    <span>
                      {mp.projectType || mp.project_type || '-'}
                    </span>
                  </td>
                  <td>
                    {mp.filesUrl || mp.files_url ? (
                      <a 
                        href={mp.filesUrl || mp.files_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <ExternalLink size={14} />
                        <span>
                          {mp.filesUrl || mp.files_url}
                        </span>
                      </a>
                    ) : '-'}
                  </td>
                  <td>
                    <div>
                      {mp.projectType === 'landing_page' ? (
                        <span>
                          {t?.products?.status?.deployed || 'Deployed'}
                        </span>
                      ) : (
                        <button
                          onClick={() => handleDeploy(mp.id)}
                          disabled={deployingId !== null}
                          title={t?.assembler?.deployAssembly || 'Deploy assembly'}
                        >
                          <Rocket 
                            size={16} 
                            className={deployingId === mp.id ? 'animate-rocket-deploy' : ''} 
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
        <p>{t?.assembler?.noAssemblerMakerPaths || 'No assembler maker paths yet'}</p>
      )}
    </div>
  );
};

export default AssemblerMakerPathsView;
