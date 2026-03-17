import React, { useState } from 'react';

type EmojiPickerProps = {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  labels?: {
    title?: string;
    subtitle?: string;
    close?: string;
    hint?: string;
    groups?: {
      folders?: string;
      work?: string;
      design?: string;
      tech?: string;
      ideas?: string;
      media?: string;
    };
  };
};

const EMOJI_GROUPS = [
  { key: 'folders', emojis: ['📁', '🗂️', '🗃️', '📂', '📋', '📌', '📍', '🗑️'] },
  { key: 'work', emojis: ['📊', '📈', '📉', '📝', '📄', '📃', '📑', '🧾'] },
  { key: 'design', emojis: ['🎨', '🖌️', '✏️', '📐', '📏', '🖼️', '🎭', '🧵'] },
  { key: 'tech', emojis: ['🛠️', '🔧', '🔩', '⚙️', '💻', '🖥️', '📱', '🧩'] },
  { key: 'ideas', emojis: ['💡', '🧠', '🚀', '⭐', '🪄', '🎯', '🔮', '💎'] },
  { key: 'media', emojis: ['📸', '🎬', '🎵', '🎤', '🎧', '📻', '🎙️', '📡'] },
];

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect, onClose, labels }) => {
  const [activeGroup, setActiveGroup] = useState(0);
  const [hovered, setHovered] = useState<string | null>(null);
  const groupLabels = labels?.groups || {};

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        aria-label={labels?.close || 'Close'}
      />

      {/* Panel */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <h3 className="text-base font-bold text-gray-900">{labels?.title || 'Choose an icon'}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{labels?.subtitle || 'To identify your folder'}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors text-sm font-bold"
            title={labels?.close || 'Close'}
          >
            X
          </button>
        </div>

        {/* Group tabs */}
        <div className="flex gap-1 px-5 pb-3 overflow-x-auto scrollbar-none">
          {EMOJI_GROUPS.map((group, i) => (
            <button
              key={group.key}
              type="button"
              onClick={() => setActiveGroup(i)}
              className={`
                flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150
                ${activeGroup === i
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }
              `}
            >
              {(groupLabels as any)[group.key] || group.key}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100 mx-5" />

        {/* Emoji grid */}
        <div className="p-4">
          <div className="grid grid-cols-8 gap-1">
            {EMOJI_GROUPS[activeGroup].emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onMouseEnter={() => setHovered(emoji)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onSelect(emoji)}
                className={`
                  h-10 w-10 rounded-2xl flex items-center justify-center text-xl
                  transition-all duration-100
                  ${hovered === emoji
                    ? 'bg-gray-900 scale-110 shadow-lg'
                    : 'hover:bg-gray-100'
                  }
                `}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Footer hint */}
        <div className="px-5 pb-4 text-center">
          <p className="text-xs text-gray-300">
            {labels?.hint || 'You can change it anytime'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmojiPicker;