import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@apps/fablab/language/useLanguage';
import {
  applicationDeploymentService,
  type ApplicationDeployment,
} from './services/applicationDeployment.service';
import DeployActionButton from './components/DeployActionButton';

type Props = {
  makerPathId: number | null | undefined;
};

const ApplicationDeploymentFullPage: React.FC<Props> = ({ makerPathId }) => {
  const { t } = useLanguage();
  const [deployments, setDeployments] = useState<ApplicationDeployment[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const fileInputsRef = useRef<Record<number, HTMLInputElement | null>>({});

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

  const handleCreate = async () => {
    if (!makerPathId) return;
    try {
      setCreating(true);
      await applicationDeploymentService.createDeployment({ maker_path_id: makerPathId });
      await refresh();
    } catch {
      // Silent
    } finally {
      setCreating(false);
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
          onClick={handleCreate}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            !makerPathId || creating
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {creating ? (t?.common?.loading || 'Loading…') : (t?.projectFlow?.createDeployment || 'Create deployment')}
        </button>
      </div>

      {!makerPathId && (
        <p className="text-sm text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-200 border border-amber-200 dark:border-amber-900/40 rounded p-3">
          {t?.projectFlow?.selectOrCreateMakerPath || 'Create a Maker Path first to deploy your application.'}
        </p>
      )}

      {makerPathId && (
        <div className="">
          {loading ? (
            <p className="text-sm text-gray-500">{t?.common?.loading || 'Loading…'}</p>
          ) : deployments.length > 0 ? (
            <div className="overflow-x-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <table className="min-w-full text-left text-sm">
                <thead className="text-gray-500 dark:text-gray-400">
                  <tr>
                    <th className="py-3 px-4">{t?.projectFlow?.appName || 'App name'}</th>
                    <th className="py-3 px-4">{t?.projectFlow?.deploymentUrl || 'Deployment URL'}</th>
                    <th className="py-3 px-4">{t?.projectFlow?.status || 'Status'}</th>
                    <th className="py-3 px-4">{t?.projectFlow?.actions || 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="text-gray-800 dark:text-gray-200">
                  {deployments.map((d) => (
                    <tr key={d.id} className="border-t border-gray-100 dark:border-gray-700">
                      <td className="py-3 px-4">{d.app_name || '-'}</td>
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
                        {renderStatusChip((d as any).status)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
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
    </div>
  );
};

export default ApplicationDeploymentFullPage;
