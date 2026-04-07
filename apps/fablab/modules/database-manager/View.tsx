import React, { useCallback, useState } from 'react';
import DatabaseManagerModal from './components/DatabaseManagerModal';
import { useLanguage } from '@apps/fablab/language/useLanguage';

type Props = {
  deploymentId: number;
  databaseName?: string | null;
  className?: string;
};

const DatabaseManager: React.FC<Props> = ({ deploymentId, databaseName, className }) => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 ${className || ''}`}
      >
        {(t as any)?.databaseManager?.openButton || 'Manage DataBase'}
      </button>

      <DatabaseManagerModal
        isOpen={open}
        onClose={handleClose}
        deploymentId={deploymentId}
        databaseName={databaseName}
      />
    </>
  );
};

export default DatabaseManager;
