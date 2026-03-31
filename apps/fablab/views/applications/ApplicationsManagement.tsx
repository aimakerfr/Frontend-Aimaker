import React, { useEffect, useState } from 'react';
import { getMakerPaths } from '@core/maker-path/maker-path.service';
import type { MakerPath } from '@core/maker-path/maker-path.types';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../language/useLanguage';

const ApplicationsManagement: React.FC = () => {
  const [items, setItems] = useState<MakerPath[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await getMakerPaths();
        // Only include maker paths that are marked as having an application deployment
        const filtered = Array.isArray(data)
          ? data.filter((mp: any) =>
              mp?.hasApplicationDeployment === true ||
              mp?.has_application_deployment === 1 ||
              mp?.has_application_deployment === true ||
              mp?.has_application_deployment === '1'
            )
          : [];
        if (isMounted) setItems(filtered);
      } catch (e: any) {
        if (isMounted) setError(e?.message ?? 'Failed to load applications');
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="space-y-6">
      {/* CTA: Déployer un projet (moved from /dashboard/maker-path to be at top here) */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {/* i18n fallback in FR as requested */}
            {(t as any)?.projectsHubTranslations?.card2Title ?? 'Déployer un projet'}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {(t as any)?.projectsHubTranslations?.card2Desc ?? 'Connectez et déployez votre code existant.'}
          </p>
        </div>
        <div>
          <button
            type="button"
            onClick={() => navigate('/dashboard/applications/new')}
            className="inline-flex items-center px-4 py-2 rounded-xl bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white text-sm font-semibold transition-colors"
          >
            {(t as any)?.projectsHubTranslations?.continueBtn ?? 'Continuer'}
          </button>
        </div>
      </div>
      <div>
        <h1 className="text-2xl font-semibold mb-2">
          {(t as any)?.applicationsManagement?.title ?? 'Applications Management'}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {(t as any)?.applicationsManagement?.subtitle ?? 'Overview of the projects, open a project to manage its applications'}
        </p>
      </div>

      {loading && (
        <div className="text-gray-600 dark:text-gray-300">Loading...</div>
      )}

      {error && (
        <div className="text-red-600">{error}</div>
      )}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800/60">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                {/* eslint-disable-next-line i18next/no-literal-string */}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                {/* eslint-disable-next-line i18next/no-literal-string */}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                {/* eslint-disable-next-line i18next/no-literal-string */}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {(t as any).makerPath?.tableHeaders?.actions ?? 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                  <td className="px-4 py-3 text-sm">{item.id}</td>
                  <td className="px-4 py-3 text-sm">{item.title}</td>
                  <td className="px-4 py-3 text-sm">{item.type}</td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      type="button"
                      onClick={() => navigate(`/dashboard/applications/deployer?id=${item.id}`)}
                      className="inline-flex items-center px-3 py-1.5 rounded-md bg-brand-600 text-white hover:bg-brand-700 text-sm transition-colors"
                    >
                      {(t as any)?.actions?.manageProjectApplication ?? (t as any)?.deployProjectTranslations?.title ?? "Manage Project's Application"}
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  {/* eslint-disable-next-line i18next/no-literal-string */}
                  <td className="px-4 py-6 text-sm text-gray-500" colSpan={4}>No applications found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ApplicationsManagement;
