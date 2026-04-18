import React, { useEffect, useState, useCallback } from 'react';
import { getMakerPaths } from '@core/maker-path/maker-path.service';
import { leaveSharedProject } from '@core/maker-path/maker-path-share.service';
import type { MakerPath } from '@core/maker-path/maker-path.types';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../language/useLanguage';
import { ShareProjectModal } from '../../components/ShareProjectModal';

const ApplicationsManagement: React.FC = () => {
  const [items, setItems] = useState<MakerPath[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<MakerPath | null>(null);
  const [leavingId, setLeavingId] = useState<number | null>(null);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMakerPaths({ hasApplicationDeployment: true });
      const filtered = Array.isArray(data)
        ? data.filter((mp: any) =>
            mp?.hasApplicationDeployment === true ||
            mp?.has_application_deployment === 1 ||
            mp?.has_application_deployment === true ||
            mp?.has_application_deployment === '1'
          )
        : [];
      setItems(filtered);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleShareClick = (project: MakerPath) => {
    setSelectedProject(project);
    setShareModalOpen(true);
  };

  const handleCloseShareModal = () => {
    setShareModalOpen(false);
    setSelectedProject(null);
  };

  const handleLeaveProject = async (project: MakerPath) => {
    if (!confirm(`Are you sure you want to leave the shared project "${project.title}"?\n\nYou will lose access to this project.`)) {
      return;
    }
    setLeavingId(project.id);
    try {
      await leaveSharedProject(project.id);
      await loadData();
    } catch (e: any) {
      alert(e?.message ?? 'Failed to leave project');
    } finally {
      setLeavingId(null);
    }
  };

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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {/* Leave action for shared projects */}
                </th>
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
              {items.map(item => {
                const isShared = item.isShared;
                const isOwner = item.isOwner ?? item.myRole === 'owner';
                const myRole = item.myRole;

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700/40 ${
                      isShared
                        ? 'bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-purple-900/10 dark:to-blue-900/10 border-l-4 border-purple-500'
                        : 'border-l-4 border-transparent'
                    }`}
                  >
                    {/* Leave action (for non-owners) */}
                    <td className="px-2 py-3 text-sm">
                      {!isOwner && myRole && (
                        <button
                          onClick={() => handleLeaveProject(item)}
                          disabled={leavingId === item.id}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                          title="Leave shared project"
                        >
                          {leavingId === item.id ? (
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      )}
                    </td>

                    <td className="px-4 py-3 text-sm font-medium">{item.id}</td>

                    {/* Name column with shared badge */}
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span>{item.title}</span>
                        {isShared && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                            </svg>
                            {isOwner ? 'Shared' : myRole}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{item.type}</td>

                    {/* Actions column */}
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/dashboard/applications/deployer?id=${item.id}`)}
                          className="inline-flex items-center px-3 py-1.5 rounded-md bg-brand-600 text-white hover:bg-brand-700 text-sm transition-colors"
                        >
                          {(t as any)?.actions?.manageProjectApplication ?? (t as any)?.deployProjectTranslations?.title ?? "Manage"}
                        </button>

                        {/* Share button (owner only) */}
                        {isOwner && (
                          <button
                            type="button"
                            onClick={() => handleShareClick(item)}
                            className="inline-flex items-center px-2 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm transition-colors"
                            title="Share project"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                            Share
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr>
                  {/* eslint-disable-next-line i18next/no-literal-string */}
                  <td className="px-4 py-6 text-sm text-gray-500" colSpan={5}>No applications found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Share Project Modal */}
      {selectedProject && (
        <ShareProjectModal
          project={selectedProject}
          isOpen={shareModalOpen}
          onClose={handleCloseShareModal}
          onShareUpdated={loadData}
        />
      )}
    </div>
  );
};

export default ApplicationsManagement;
