import React, { useEffect, useRef, useState } from 'react';
import { applicationDeploymentService, type ApplicationDeployment } from '@core/application-deployment/applicationDeployment.service';

interface Props {
  makerPathId?: number | null;
  t: any;
}

const ApplicationDeploymentSection: React.FC<Props> = ({ makerPathId, t }) => {
  const [deployments, setDeployments] = useState<ApplicationDeployment[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const fileInputsRef = useRef<Record<number, HTMLInputElement | null>>({});

  // Load deployments tied to the MakerPath
  useEffect(() => {
    const load = async () => {
      if (!makerPathId) {
        setDeployments([]);
        return;
      }
      try {
        setLoading(true);
        const data = await applicationDeploymentService.getDeploymentsByMakerPath(makerPathId);
        // Normalize to camelCase for filesUrl and deploymentUrl while keeping original data shape
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
      // Enable directory (folder) selection while keeping multi-file support
      // Note: webkitdirectory is widely supported (Chromium/Safari); other browsers will still allow multi-file selection
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
    <div className="px-5 pt-4 pb-2 border-t border-gray-200 dark:border-gray-700 space-y-3">
      <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
        {t.projectFlow.applicationDeployment}
      </h3>

      <button
        disabled={!makerPathId || creating}
        onClick={handleCreate}
        className={`w-full py-2.5 text-sm font-bold uppercase tracking-wide rounded-lg transition-colors ${
          !makerPathId || creating
            ? 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {creating ? (t?.common?.loading || 'Loading…') : (t?.projectFlow?.createDeployment || 'Create deployment')}
      </button>

      {makerPathId && (
        <div className="mt-2">
          {loading ? (
            <p className="text-xs text-gray-500">{t.common.loading}</p>
          ) : deployments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="text-gray-500 dark:text-gray-400">
                  <tr>
                    <th className="py-2 pr-4">{t?.projectFlow?.appName || 'App name'}</th>
                    <th className="py-2 pr-4">{t?.projectFlow?.deploymentUrl || 'Deployment URL'}</th>
                    <th className="py-2 pr-4">{'Files URL'}</th>
                    <th className="py-2">{t?.projectFlow?.actions || 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="text-gray-800 dark:text-gray-200">
                  {deployments.map((d) => (
                    <tr key={d.id} className="border-t border-gray-100 dark:border-gray-700">
                      <td className="py-2 pr-4">{d.app_name || '-'}</td>
                      <td className="py-2 pr-4">
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
                      <td className="py-2 pr-4">
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
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openFilePicker(d.id)}
                            className="px-3 py-1.5 text-xs font-semibold rounded bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"
                          >
                            {(d as any).filesUrl
                              ? (t?.projectFlow?.reuploadFiles || 'Re-Upload files')
                              : (t?.projectFlow?.uploadFiles || 'Upload files')}
                          </button>
                          {(d as any).filesUrl && (
                            <button
                              onClick={async () => {
                                try {
                                  await applicationDeploymentService.deploy({ application_deployment_id: d.id });
                                  await refresh();
                                } catch {
                                  // Silent
                                }
                              }}
                              className="px-3 py-1.5 text-xs font-semibold rounded bg-blue-600 text-white hover:bg-blue-700"
                            >
                              {t?.projectFlow?.deploy || 'Deploy'}
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
            <p className="text-xs text-gray-500">{t?.projectFlow?.noDeploymentsYet || 'No deployments yet'}</p>
          )}
        </div>
      )}

      {/* Spacer so content doesn't sit under the floating gear button */}
      <div className="pb-16" />
    </div>
  );
};

export default ApplicationDeploymentSection;
