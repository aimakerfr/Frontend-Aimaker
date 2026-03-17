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
  color: string | null;
  onChangeName: (value: string) => void;
  onSelectEmoji: (emoji: string) => void;
  onSelectColor: (color: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  labels?: {
    titleCreate?: string;
    titleEdit?: string;
    nameLabel?: string;
    namePlaceholder?: string;
    chooseIcon?: string;
    chooseColor?: string;
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
  color,
  onChangeName,
  onSelectEmoji,
  onSelectColor,
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
  const selectedColor = useMemo(() => color || '#2563eb', [color]);
  const colorOptions = useMemo(() => [
    '#2563eb', '#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6',
    '#14b8a6', '#e11d48', '#a3e635', '#f97316', '#6366f1', '#64748b',
  ], []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-label={labels?.cancel || 'Close'}
      />

      <div className="relative w-full max-w-3xl rounded-3xl bg-white shadow-2xl overflow-hidden">
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
            <div className="mt-3 grid grid-cols-10 gap-3">
              {EMOJI_OPTIONS.map((icon) => {
                const isActive = icon === selectedEmoji;
                return (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => onSelectEmoji(icon)}
                    className={`h-14 w-14 rounded-2xl flex items-center justify-center text-3xl transition-all ${
                      isActive ? 'bg-gray-900 text-white shadow-lg scale-105' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {icon}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              {labels?.chooseColor || 'Choose a color'}
            </label>
            <div className="mt-3 flex flex-wrap gap-2">
              {colorOptions.map((value) => {
                const isActive = value.toLowerCase() === selectedColor.toLowerCase();
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onSelectColor(value)}
                    className={`h-9 w-9 rounded-full border-2 transition-all ${
                      isActive ? 'border-gray-900 scale-110' : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: value }}
                    aria-label={value}
                  />
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
