import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@apps/fablab/language/useLanguage';
import { createProductFromTemplate } from '@core/products';
import {
  applicationDeploymentService,
  type ApplicationDeployment,
} from './services/applicationDeployment.service';
import DeployActionButton from './components/DeployActionButton';
import { getMakerPath, type MakerPath } from './services/makerPath.service';
import { DatabaseManager } from '@apps/fablab/modules/database-manager';

type Props = {
  makerPathId: number | null | undefined;
  /** Optional component to render a "Create Database" action per deployment row */
  DatabaseCreatorComponent?: React.ComponentType<any>;
};

const ApplicationDeploymentFullPage: React.FC<Props> = ({ makerPathId, DatabaseCreatorComponent }) => {
  const { t } = useLanguage();
  const [deployments, setDeployments] = useState<ApplicationDeployment[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [convertingDeploymentId, setConvertingDeploymentId] = useState<number | null>(null);
  const [convertMessage, setConvertMessage] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const fileInputsRef = useRef<Record<number, HTMLInputElement | null>>({});
  const [makerPath, setMakerPath] = useState<MakerPath | null>(null);
  const [makerPathLoading, setMakerPathLoading] = useState(false);

  const renderStatusChip = (status?: string | null) => {
    const s = (status || '').toLowerCase();
    let label = s || '-';
    let classes = 'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200';

    if (s === 'deployed_successful') {
      classes = 'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      label = t?.projectFlow?.statusDeployedSuccessful || 'Deployed';
    } else if (s === 'deployment_in_progress') {
      classes = 'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
      label = t?.projectFlow?.statusDeploymentInProgress || 'In progress';
    } else if (s === 'waiting_files') {
      classes = 'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
      label = t?.projectFlow?.statusWaitingFiles || 'Waiting files';
    } else if (s === 'deployment_failed') {
      classes = 'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
      label = t?.projectFlow?.statusDeploymentFailed || 'Failed';
    }

    return <span className={classes}>{label}</span>;
  };

  useEffect(() => {
    // Load MakerPath details for header area
    const loadMakerPath = async () => {
      if (!makerPathId) {
        setMakerPath(null);
        return;
      }
      try {
        setMakerPathLoading(true);
        const mp = await getMakerPath(makerPathId);
        setMakerPath(mp);
      } catch {
        setMakerPath(null);
      } finally {
        setMakerPathLoading(false);
      }
    };

    loadMakerPath().then(r => console.log(r));

    const load = async () => {
      if (!makerPathId) {
        setDeployments([]);
        return;
      }
      try {
        setLoading(true);
        const data = await applicationDeploymentService.getDeploymentsByMakerPath(makerPathId);
        const normalized = data.map((d) => ({
          ...(d as any),
          filesUrl: (d as any).filesUrl ?? (d as any).files_url ?? null,
          deploymentUrl: (d as any).deploymentUrl ?? (d as any).deployment_url ?? null,
          // keep original db name fields; rendering will fall back
        }));
        setDeployments(normalized as any);
      } catch {
        setDeployments([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [makerPathId]);

  const refresh = async () => {
    if (!makerPathId) return;
    try {
      const data = await applicationDeploymentService.getDeploymentsByMakerPath(makerPathId);
      const normalized = data.map((d) => ({
        ...(d as any),
        filesUrl: (d as any).filesUrl ?? (d as any).files_url ?? null,
        deploymentUrl: (d as any).deploymentUrl ?? (d as any).deployment_url ?? null,
      }));
      setDeployments(normalized as any);
    } catch {
      // Silent
    }
  };

  const handleCreateConfirm = async () => {
    if (!makerPathId) return;
    try {
      setCreating(true);
      await applicationDeploymentService.createDeployment({ maker_path_id: makerPathId, title: newTitle });
      setIsCreateModalOpen(false);
      setNewTitle('');
      await refresh();
    } catch {
      // Silent
    } finally {
      setCreating(false);
    }
  };

  const handleConvertToProduct = async (deployment: ApplicationDeployment) => {
    const deploymentUrl = ((deployment as any).deploymentUrl ?? (deployment as any).deployment_url ?? '').toString().trim();
    if (!deploymentUrl) return;

    const title = ((deployment as any).title || deployment.app_name || (deployment as any).appName || `App ${deployment.id}`).toString().trim();
    const description = `App deployed from deployment #${deployment.id}`;

    try {
      setConvertingDeploymentId(deployment.id);
      setConvertMessage(null);
      await createProductFromTemplate('app', title, description, {
        productLink: deploymentUrl,
        isPublic: true,
      });
      setConvertMessage(t?.projectFlow?.convertedToProductSuccess || 'Aplicacion convertida en producto correctamente.');
    } catch {
      setConvertMessage(t?.projectFlow?.convertedToProductError || 'No se pudo convertir la aplicacion en producto.');
    } finally {
      setConvertingDeploymentId(null);
    }
  };

  const openFilePicker = (deploymentId: number) => {
    let input = fileInputsRef.current[deploymentId];
    if (!input) {
      input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      (input as any).webkitdirectory = true;
      (input as any).directory = true;
      input.setAttribute('webkitdirectory', '');
      input.setAttribute('directory', '');
      input.style.display = 'none';
      input.addEventListener('change', async () => {
        const files = input!.files;
        if (!files || files.length === 0) return;
        try {
          await applicationDeploymentService.uploadFiles({ application_deployment_id: deploymentId, files: Array.from(files) });
          await refresh();
        } catch {
          // Silent
        } finally {
          input!.value = '';
        }
      });
      document.body.appendChild(input);
      fileInputsRef.current[deploymentId] = input;
    }
    input.click();
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t?.projectFlow?.applicationDeployment || 'Application deployment'}</h1>
        <button
          disabled={!makerPathId || creating}
          onClick={() => setIsCreateModalOpen(true)}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            !makerPathId || creating
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {creating ? (t?.common?.loading || 'Loading…') : (t?.projectFlow?.createDeployment || 'Create deployment')}
        </button>
      </div>

      {makerPathId && (
        <div className="">
          {makerPathLoading ? (
            <p className="text-sm text-gray-500">{t?.common?.loading || 'Loading…'}</p>
          ) : makerPath ? (
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{makerPath.title}</h2>
              {makerPath.description && (
                <p className="text-sm text-gray-600 dark:text-gray-300">{makerPath.description}</p>
              )}
            </div>
          ) : null}
        </div>
      )}

      {!makerPathId && (
        <p className="text-sm text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-200 border border-amber-200 dark:border-amber-900/40 rounded p-3">
          {t?.projectFlow?.selectOrCreateMakerPath || 'Create a Maker Path first to deploy your application.'}
        </p>
      )}

      {makerPathId && (
        <div className="">
          {convertMessage && (
            <p className="mb-3 rounded border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-200">
              {convertMessage}
            </p>
          )}
          {loading ? (
            <p className="text-sm text-gray-500">{t?.common?.loading || 'Loading…'}</p>
          ) : deployments.length > 0 ? (
            <div className="overflow-x-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <table className="min-w-full text-left text-sm">
                <thead className="text-gray-500 dark:text-gray-400">
                  <tr>
                    <th className="py-3 px-4">{'Title'}</th>
                    <th className="py-3 px-4">{t?.projectFlow?.databaseName || 'Database name'}</th>
                    <th className="py-3 px-4">{t?.projectFlow?.deploymentUrl || 'Deployment URL'}</th>
                    <th className="py-3 px-4">{'Project Type'}</th>
                    <th className="py-3 px-4">{t?.projectFlow?.status || 'Status'}</th>
                    <th className="py-3 px-4">{'Files URL'}</th>
                    <th className="py-3 px-4">{t?.projectFlow?.actions || 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="text-gray-800 dark:text-gray-200">
                  {deployments.map((d) => (
                    <tr key={d.id} className="border-t border-gray-100 dark:border-gray-700">
                      <td className="py-3 px-4">{(d as any).title || d.app_name || (d as any).appName || '-'}</td>
                      <td className="py-3 px-4">{(d as any).data_base_name || (d as any).dataBaseName || '-'}</td>
                      <td className="py-3 px-4">
                        {(d as any).deploymentUrl ? (
                          <a
                            href={(d as any).deploymentUrl as string}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline break-all"
                          >
                            {(d as any).deploymentUrl as string}
                          </a>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                          {(d as any).projectType || (d as any).project_type || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {renderStatusChip((d as any).status)}
                      </td>
                      <td className="py-3 px-4">
                        {(d as any).filesUrl ? (
                          <a
                            href={(d as any).filesUrl as string}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline break-all"
                          >
                            {(d as any).filesUrl as string}
                          </a>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => openFilePicker(d.id)}
                            className="px-3 py-1.5 text-xs font-semibold rounded bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"
                          >
                            {(d as any).filesUrl
                              ? (t?.projectFlow?.reuploadFiles || 'Re-Upload files')
                              : (t?.projectFlow?.uploadFiles || 'Upload files')}
                          </button>
                          {/** Single compacted action: Deploy or Re-Deploy depending on status */}
                          {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                          {/* @ts-ignore - local component path */}
                          <DeployActionButton
                            deploymentId={d.id}
                            status={(d as any).status}
                            hasFiles={Boolean((d as any).filesUrl)}
                            onAfter={refresh}
                          />
                          {String((d as any).status || '').toLowerCase() === 'deployed_successful' && Boolean((d as any).deploymentUrl) && (
                            <button
                              onClick={() => handleConvertToProduct(d)}
                              disabled={convertingDeploymentId === d.id}
                              className="px-3 py-1.5 text-xs font-semibold rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {convertingDeploymentId === d.id
                                ? (t?.projectFlow?.convertingToProduct || 'Convirtiendo...')
                                : (t?.projectFlow?.convertToProduct || 'Convertir en producto')}
                            </button>
                          )}
                          {((d as any).data_base_name || (d as any).dataBaseName) ? (
                            <DatabaseManager
                              deploymentId={d.id}
                              databaseName={(d as any).data_base_name || (d as any).dataBaseName}
                              className="px-3 py-1.5 text-xs"
                            />
                          ) : (
                            DatabaseCreatorComponent && (
                              <DatabaseCreatorComponent
                                deploymentId={d.id}
                                onCreated={() => {
                                  // After creating a DB, refresh data if needed
                                  void refresh();
                                }}
                                className="px-3 py-1.5 text-xs"
                              />
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-500">{t?.projectFlow?.noDeploymentsYet || 'No deployments yet'}</p>
          )}
        </div>
      )}

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">{t?.projectFlow?.createDeployment || 'Create deployment'}</h2>
            <label className="block text-sm mb-2" htmlFor="new-title">
              {'Title'}
            </label>
            <input
              id="new-title"
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder={'My app title'}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setNewTitle('');
                }}
                disabled={creating}
              >
                {t?.common?.cancel || 'Cancel'}
              </button>
              <button
                type="button"
                className={`px-4 py-2 text-sm font-semibold rounded-md ${creating ? 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                onClick={handleCreateConfirm}
                disabled={creating}
              >
                {creating ? (t?.common?.loading || 'Loading…') : (t?.common?.create || 'Create')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationDeploymentFullPage;
