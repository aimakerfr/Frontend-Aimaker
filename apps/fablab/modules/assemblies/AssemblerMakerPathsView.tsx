import React, { useEffect, useState } from 'react';
import { useLanguage } from '@apps/fablab/language/useLanguage';
import { getMakerPaths } from '@core/maker-path/maker-path.service';
import { MakerPath } from '@core/maker-path/maker-path.types';
import { useNavigate } from 'react-router-dom';
import { deployAssembly } from './services/assemblyDeployment.service';
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

  const handleDeploy = async (id: number) => {
    try {
      await deployAssembly(id);
    } catch (error) {
      // Error handled in service (alert/console)
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
                <th className="py-3 px-4">{'Title'}</th>
                <th className="py-3 px-4">{'Description'}</th>
                <th className="py-3 px-4">{'Status'}</th>
                <th className="py-3 px-4">{'Created At'}</th>
                <th className="py-3 px-4">{t?.assembler?.actions || 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="text-gray-800 dark:text-gray-200">
              {makerPaths.map((mp) => (
                <tr key={mp.id} className="border-t border-gray-100 dark:border-gray-700">
                  <td className="py-3 px-4">{mp.title}</td>
                  <td className="py-3 px-4">{mp.description || '-'}</td>
                  <td className="py-3 px-4">{mp.status}</td>
                  <td className="py-3 px-4">{new Date(mp.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleDeploy(mp.id)}
                      className="px-3 py-1 text-xs font-semibold rounded-md transition-colors bg-green-600 text-white hover:bg-green-700"
                    >
                      {t?.assembler?.deployAssembly || 'Deploy assembly'}
                    </button>
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
