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
        if (isMounted) setItems(data);
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
                      onClick={() => navigate(`/dashboard/deployer?id=${item.id}`)}
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
