import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@apps/fablab/language/useLanguage';
import { applicationDeploymentService, type ApplicationDeployment } from '@apps/fablab/modules/application-deployment/services/applicationDeployment.service';
import { linkBackendApplication } from '../services/linkBackend.service';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  makerPathId: number;
  currentDeploymentId: number;
  currentAppName?: string | null;
};

const BackendLinkerModal: React.FC<Props> = ({ isOpen, onClose, makerPathId, currentDeploymentId, currentAppName }) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [deployments, setDeployments] = useState<ApplicationDeployment[]>([]);
  const [selectedBackendId, setSelectedBackendId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentBackendUrl, setCurrentBackendUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      try {
        setLoading(true);
        const data = await applicationDeploymentService.getDeploymentsByMakerPath(makerPathId);
        setDeployments(data as any);

        // Find current deployment to read existing backend URL (supports snake/camel cases)
        const current = (data as any[])?.find?.((d) => d?.id === currentDeploymentId);
        const backendUrl = current?.backendUrl ?? current?.backend_url ?? null;
        setCurrentBackendUrl(backendUrl ? String(backendUrl) : null);
      } catch {
        setDeployments([]);
        setCurrentBackendUrl(null);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [isOpen, makerPathId, currentDeploymentId]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedBackendId(null);
      setCurrentBackendUrl(null);
    }
  }, [isOpen]);

  const options = useMemo(() => {
    const list = (deployments || [])
      .filter((d) => d.id !== currentDeploymentId)
      // Only show/select deployments that have a deployment URL available
      .filter((d) => {
        const url = (d as any).deploymentUrl || (d as any).deployment_url || '';
        return Boolean(String(url).trim());
      })
      .map((d) => {
        const title = (d as any).title || d.app_name || (d as any).appName || `App ${d.id}`;
        const url = (d as any).deploymentUrl || (d as any).deployment_url || '';
        return {
          id: d.id,
          label: `${title}${url ? ` — ${url}` : ''}`,
          title,
        };
      });
    return list;
  }, [deployments, currentDeploymentId]);

  const selectedTitle = useMemo(() => options.find(o => o.id === selectedBackendId)?.title || null, [options, selectedBackendId]);

  const handleSubmit = async () => {
    if (!selectedBackendId) {
      // eslint-disable-next-line no-alert
      alert('Please select an application to link as backend.');
      return;
    }

    const sourceName = selectedTitle || `#${selectedBackendId}`;
    const targetName = currentAppName || `#${currentDeploymentId}`;
    // eslint-disable-next-line no-alert
    const ok = confirm(`Are you sure to connect ${sourceName} to ${targetName}?\n${sourceName} will be the backend of ${targetName}.`);
    if (!ok) return;

    try {
      setSubmitting(true);
      const resp = await linkBackendApplication({ backendApplicationId: selectedBackendId, targetApplicationId: currentDeploymentId });
      // eslint-disable-next-line no-alert
      alert(resp?.message || 'Link created');
      onClose();
    } catch (e: any) {
      // eslint-disable-next-line no-alert
      alert(e?.message || 'Failed to link backend application');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg p-6">
        <h2 className="text-lg font-semibold mb-4">{(t as any)?.backendLinker?.title || 'Link backend application'}</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          {(t as any)?.backendLinker?.subtitle }
        </p>

        {currentBackendUrl && (
          <div className="mb-4 rounded border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-200">
            {(t as any)?.backendLinker?.connectedToBackend
              ? `${(t as any).backendLinker.connectedToBackend}: ${currentBackendUrl}`
              : `Connected to backend: ${currentBackendUrl}`}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-gray-500">{t?.common?.loading || 'Loading…'}</p>
        ) : options.length > 0 ? (
          <div className="space-y-2">
            <label htmlFor="backend-select" className="block text-sm font-medium">{(t as any)?.backendLinker?.selectLabel || 'Select backend application'}</label>
            <select
              id="backend-select"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedBackendId ?? ''}
              onChange={(e) => setSelectedBackendId(Number(e.target.value) || null)}
            >
              <option value="">-- {(t as any)?.backendLinker?.selectPlaceholder || 'Choose an application'} --</option>
              {options.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </div>
        ) : (
          <p className="text-sm text-gray-500">{(t as any)?.backendLinker?.noOptions || 'No other deployments found in this Maker Path.'}</p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            className="px-4 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            onClick={onClose}
            disabled={submitting}
          >
            {t?.common?.cancel || 'Cancel'}
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-semibold rounded-md ${(!selectedBackendId || submitting) ? 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            onClick={handleSubmit}
            disabled={!selectedBackendId || submitting}
          >
            {submitting ? (t?.common?.loading || 'Loading…') : ((t as any)?.backendLinker?.confirm || 'Connect')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BackendLinkerModal;
