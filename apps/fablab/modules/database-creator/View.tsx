import React, { useState, useCallback } from 'react';
import DatabaseCreatorModal from './components/DatabaseCreatorModal';
import type { CreateDatabaseResponse } from './services/database.service';
import { useLanguage } from '@apps/fablab/language/useLanguage';

type Props = {
  deploymentId: number;
  onCreated?: (result: CreateDatabaseResponse) => void;
  className?: string;
};

const DatabaseCreator: React.FC<Props> = ({ deploymentId, onCreated, className }) => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 ${className || ''}`}
      >
        {(t as any)?.databaseCreator?.openButton || 'Create Database'}
      </button>

      <DatabaseCreatorModal
        isOpen={open}
        onClose={handleClose}
        deploymentId={deploymentId}
        onCreated={onCreated}
      />
    </>
  );
};

export default DatabaseCreator;
