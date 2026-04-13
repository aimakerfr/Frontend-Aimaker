import React, { useEffect } from 'react';

type Props = {
  isOpen: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
};

const AssemblerModal: React.FC<Props> = ({ isOpen, title, onClose, children }) => {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) {
      document.addEventListener('keydown', onKey);
      // Optional: prevent background scroll
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="assembler-modal">
      <div
        onClick={onClose}
        aria-hidden="true"
        className="assembler-modal-backdrop"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="assembler-modal-content"
      >
        <div className="assembler-modal-header">
          <h3 className="assembler-modal-title">{title ?? 'Select object'}</h3>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="assembler-modal-close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div className="assembler-modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AssemblerModal;
