import React from 'react';
import { Check, Copy, Loader2, XCircle } from 'lucide-react';
import { useLanguage } from '../../language/useLanguage';

type Props = {
  // Initial value for the textarea. Component holds its own state to avoid re-rendering the parent on each keystroke
  initialValue: string;
  // Called when user clicks save, current body will be provided
  onSave?: (body: string) => void | Promise<void>;
  // Optional change callback to let parent keep a ref in sync without re-rendering
  onBodyChange?: (body: string) => void;
  saving?: boolean;
  disabled?: boolean;
  status?: 'idle' | 'saving' | 'success' | 'error';
};

const PromptBodySectionComponent: React.FC<Props> = ({ initialValue, onSave, onBodyChange, saving = false, disabled = false, status = 'idle' }) => {
  const { t } = useLanguage();
  const tp = t.promptEditor;
  const [bodyValue, setBodyValue] = React.useState<string>(initialValue ?? '');

  // Keep internal value in sync if initialValue changes from outside (e.g., after load)
  React.useEffect(() => {
    setBodyValue(initialValue ?? '');
  }, [initialValue]);

  const isWorking = saving || status === 'saving';

  const getIcon = () => {
    if (status === 'saving') return <Loader2 size={18} className="animate-spin" />;
    if (status === 'success') return <Check size={18} />;
    if (status === 'error') return <XCircle size={18} />;
    return <Check size={18} />;
  };

  const getButtonClasses = () => {
    if (status === 'success') return 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100';
    if (status === 'error') return 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100';
    return 'bg-white border-blue-200 text-blue-600 hover:bg-blue-50';
  };

  return (
    <div className="relative group w-full flex flex-col">
      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{tp.bodyLabel}</label>
      <div className="relative w-full">
        <textarea
          value={bodyValue}
          onChange={(e) => {
            setBodyValue(e.target.value);
            onBodyChange?.(e.target.value);
          }}
          disabled={disabled || saving}
          className="w-full h-80 px-6 py-6 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-mono text-sm leading-relaxed text-slate-700 bg-slate-50/30 disabled:opacity-60"
          placeholder={tp.bodyPlaceholder}
        ></textarea>
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={() => navigator.clipboard.writeText(bodyValue)}
            className="p-2 text-slate-400 hover:text-blue-600 bg-white border border-slate-200 rounded-lg shadow-sm transition-all"
            title={tp.copy}
            type="button"
          >
            <Copy size={16} />
          </button>
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={() => onSave?.(bodyValue)}
          disabled={isWorking || disabled}
          className={`w-11 h-11 rounded-full border-2 flex items-center justify-center font-semibold shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed ${getButtonClasses()}`}
        >
          {getIcon()}
        </button>
      </div>
    </div>
  );
};

// Memoize to avoid re-render if parent re-renders without changing props
const PromptBodySection = React.memo(PromptBodySectionComponent);
PromptBodySection.displayName = 'PromptBodySection';

export default PromptBodySection;
