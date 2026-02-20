import React from 'react';

type AddObjectButtonProps = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

const AddObjectButton: React.FC<AddObjectButtonProps> = ({ label, onClick, disabled }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center px-4 py-2 rounded-md text-sm font-semibold bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-60"
    >
      + {label}
    </button>
  );
};

export default AddObjectButton;
