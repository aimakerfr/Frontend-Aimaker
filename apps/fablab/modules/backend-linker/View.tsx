import React, { useCallback, useState } from 'react';
import BackendLinkerModal from './components/BackendLinkerModal';
import { useLanguage } from '@apps/fablab/language/useLanguage';

type Props = {
  makerPathId: number;
  deploymentId: number;
  currentAppName?: string | null;
  className?: string;
  onLinked?: () => void; // optional refresh callback
};

const BackendLinker: React.FC<Props> = ({ makerPathId, deploymentId, currentAppName, className, onLinked }) => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => {
    setOpen(false);
    onLinked?.();
  }, [onLinked]);

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 ${className || ''}`}
      >
        {(t as any)?.backendLinker?.openButton || 'Config app'}
      </button>

      <BackendLinkerModal
        isOpen={open}
        onClose={handleClose}
        makerPathId={makerPathId}
        currentDeploymentId={deploymentId}
        currentAppName={currentAppName}
      />
    </>
  );
};

export default BackendLinker;
