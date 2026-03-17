import React, { useMemo } from 'react';

const EMOJI_OPTIONS = [
  '📁', '🗂️', '🗃️', '📂', '📋', '📌', '📍', '🗑️',
  '📊', '📈', '📉', '📝', '📄', '📃', '📑', '🧾',
  '🎨', '🖌️', '✏️', '📐', '📏', '🖼️', '🎭', '🧵',
  '🛠️', '🔧', '🔩', '⚙️', '💻', '🖥️', '📱', '🧩',
  '💡', '🧠', '🚀', '⭐', '🪄', '🎯', '🔮', '💎',
  '📸', '🎬', '🎵', '🎤', '🎧', '📻', '🎙️', '📡',
];

type FolderModalProps = {
  isOpen: boolean;
  mode: 'create' | 'edit';
  name: string;
  emoji: string | null;
  onChangeName: (value: string) => void;
  onSelectEmoji: (emoji: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  labels?: {
    titleCreate?: string;
    titleEdit?: string;
    nameLabel?: string;
    namePlaceholder?: string;
    chooseIcon?: string;
    cancel?: string;
    save?: string;
    create?: string;
    required?: string;
  };
  error?: string | null;
};

const FolderModal: React.FC<FolderModalProps> = ({
  isOpen,
  mode,
  name,
  emoji,
  onChangeName,
  onSelectEmoji,
  onClose,
  onSubmit,
  labels,
  error,
}) => {
  const title = mode === 'edit'
    ? (labels?.titleEdit || 'Edit folder')
    : (labels?.titleCreate || 'Create folder');
  const submitLabel = mode === 'edit'
    ? (labels?.save || 'Save')
    : (labels?.create || 'Create');

  const selectedEmoji = useMemo(() => emoji || '', [emoji]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-label={labels?.cancel || 'Close'}
      />

      <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              {labels?.nameLabel || 'Folder name'}
            </label>
            <input
              value={name}
              onChange={(ev) => onChangeName(ev.target.value)}
              placeholder={labels?.namePlaceholder || 'Enter a name'}
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:border-gray-400 focus:outline-none"
            />
            {error && (
              <p className="mt-2 text-xs text-red-500">{error}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              {labels?.chooseIcon || 'Choose an icon'}
            </label>
            <div className="mt-3 grid grid-cols-10 gap-2">
              {EMOJI_OPTIONS.map((icon) => {
                const isActive = icon === selectedEmoji;
                return (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => onSelectEmoji(icon)}
                    className={`h-12 w-12 rounded-2xl flex items-center justify-center text-2xl transition-all ${
                      isActive ? 'bg-gray-900 text-white shadow-lg scale-105' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {icon}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-100"
          >
            {labels?.cancel || 'Cancel'}
          </button>
          <button
            type="button"
            onClick={onSubmit}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-gray-900 hover:bg-gray-700"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FolderModal;
