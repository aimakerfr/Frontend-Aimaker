import React from 'react';
import AddSourceModal from './AddSourceModal';
import { useAuth } from '@core/auth/useAuth';
import type { Translations } from '../../../language/locales/types';
import type { SourceType } from '../types';

type UploadSourceModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAddSource: (
    type: SourceType,
    content: string,
    title: string,
    url?: string,
    previewUrl?: string,
    file?: File
  ) => void;
  tp: Translations['notebook']['sourcePanel'];
  t: Translations;
};

const UploadSourceModal: React.FC<UploadSourceModalProps> = ({ isOpen, onClose, onAddSource, tp, t }) => {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('ROLE_ADMIN') || false;

  return (
    <AddSourceModal
      isOpen={isOpen}
      onClose={onClose}
      onAddSource={onAddSource}
      tp={tp}
      t={t}
      isAdmin={isAdmin}
    />
  );
};

export default UploadSourceModal;
