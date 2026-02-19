import React, { useEffect, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Code2, Cog, FileText, Globe, ImageIcon, Upload, Video, X } from 'lucide-react';
import type { Translations } from '../../../language/locales/types';

export type ObjectType = 'doc' | 'html' | 'code' | 'image' | 'video' | 'config';

type AddObjectModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; type: ObjectType; file: File }) => Promise<void> | void;
  t: Translations;
};

const AddObjectModal: React.FC<AddObjectModalProps> = ({ isOpen, onClose, onSubmit, t }) => {
  const [title, setTitle] = useState('');
  const [activeType, setActiveType] = useState<ObjectType>('doc');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const OBJECT_TABS: ReadonlyArray<{
    id: ObjectType;
    label: string;
    description: string;
    color: string;
    bg: string;
    icon: LucideIcon;
    accept: string;
  }> = [
    {
      id: 'doc',
      label: (t as any).home?.objects_library?.tabs?.document ?? 'DOC',
      description: (t as any).home?.objects_library?.tabs?.document_desc ?? 'DOC, TXT, MD',
      color: 'text-red-500',
      bg: 'bg-red-50',
      icon: FileText,
      accept: '.doc,.docx,.txt,.md',
    },
    {
      id: 'html',
      label: (t as any).home?.objects_library?.tabs?.html ?? 'HTML',
      description: (t as any).home?.objects_library?.tabs?.html_desc ?? 'HTML',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      icon: Globe,
      accept: '.html',
    },
    {
      id: 'code',
      label: (t as any).home?.objects_library?.tabs?.code ?? 'Code',
      description: (t as any).home?.objects_library?.tabs?.code_desc ?? 'JSX, TSX',
      color: 'text-teal-600',
      bg: 'bg-teal-50',
      icon: Code2,
      accept: '.jsx,.tsx,.js,.ts',
    },
    {
      id: 'image',
      label: (t as any).home?.objects_library?.tabs?.image ?? 'Image',
      description: (t as any).home?.objects_library?.tabs?.image_desc ?? 'PNG, JPG, SVG',
      color: 'text-amber-500',
      bg: 'bg-amber-50',
      icon: ImageIcon,
      accept: 'image/*',
    },
    {
      id: 'video',
      label: (t as any).home?.objects_library?.tabs?.video ?? 'Video',
      description: (t as any).home?.objects_library?.tabs?.video_desc ?? 'MP4, MOV',
      color: 'text-purple-500',
      bg: 'bg-purple-50',
      icon: Video,
      accept: 'video/*',
    },
    {
      id: 'config',
      label: (t as any).home?.objects_library?.tabs?.config ?? 'Config',
      description: (t as any).home?.objects_library?.tabs?.config_desc ?? 'JSON, YAML, ENV',
      color: 'text-slate-600',
      bg: 'bg-slate-50',
      icon: Cog,
      accept: '.json,.yaml,.yml,.env,.ini',
    },
  ];

  const resetState = () => {
    setTitle('');
    setActiveType('doc');
    setSelectedFile(null);
    setFileName('');
    setError(null);
    setIsSubmitting(false);
  };

  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen]);

  const getAcceptForType = (type: ObjectType) => OBJECT_TABS.find((tab) => tab.id === type)?.accept ?? '*/*';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setFileName(file.name);
    if (!title.trim()) {
      const baseName = file.name.includes('.') ? file.name.substring(0, file.name.lastIndexOf('.')) : file.name;
      setTitle(baseName);
    }
    setError(null);
  };

  const handleDropzoneClick = () => {
    if (isSubmitting) return;
    const input = fileInputRef.current;
    if (!input) return;
    input.value = '';
    input.accept = getAcceptForType(activeType);
    input.click();
  };

  const handleSubmit = async (e?: React.FormEvent | React.KeyboardEvent) => {
    e?.preventDefault();
    if (isSubmitting) return;
    if (!selectedFile) {
      setError((t as any).home?.objects_library?.file_required ?? 'Please upload a file.');
      return;
    }
    const finalTitle = (title || fileName || selectedFile.name).trim();
    if (!finalTitle) {
      setError((t as any).home?.objects_library?.name_required ?? 'Please provide a title.');
      return;
    }

    setError(null);
    try {
      setIsSubmitting(true);
      await onSubmit({ title: finalTitle, type: activeType, file: selectedFile });
      resetState();
      onClose();
    } catch (e: any) {
      setError(e?.message || (t as any).common?.error || 'Failed to create');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const activeTab = OBJECT_TABS.find((tab) => tab.id === activeType);
  const canSubmit = Boolean((title || fileName).trim() && selectedFile && !isSubmitting);

  return (
    <div className="fixed inset-0 z-[1000] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900 shrink-0">
          <div className="flex flex-col">
            <h3 className="font-black text-gray-800 dark:text-gray-100 text-lg tracking-tight">
              {(t as any).home?.objects_library?.add_title ?? 'Add Object'}
            </h3>
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
              {(t as any).home?.objects_library?.add_subtitle ?? 'Create a new object entry'}
            </span>
          </div>
          <button
            onClick={() => {
              if (isSubmitting) return;
              resetState();
              onClose();
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-400 transition-colors"
            disabled={isSubmitting}
            aria-label={(t as any).common?.cancel ?? 'Close'}
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-5 no-scrollbar min-h-[240px] bg-gray-50/50 dark:bg-gray-900/40">
          {error && (
            <div className="rounded-xl border border-red-100 dark:border-red-900/60 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[1.5rem] shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-300">
                  {(t as any).home?.objects_library?.type_label ?? 'Object type'}
                </label>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                  {(t as any).home?.objects_library?.type_help ?? 'Choose the format you want to upload'}
                </p>
              </div>
              <span className="text-[9px] font-bold text-gray-300 dark:text-gray-600 uppercase tracking-widest">
                {(t as any).home?.objects_library?.required ?? 'Required'}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {OBJECT_TABS.map((tab) => {
                const isActive = tab.id === activeType;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => {
                      setActiveType(tab.id);
                      setSelectedFile(null);
                      setFileName('');
                    }}
                    className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${
                      isActive
                        ? 'bg-white dark:bg-gray-900 border-brand-300 dark:border-brand-500 shadow-md ring-2 ring-brand-50'
                        : 'bg-white/60 dark:bg-gray-800/60 border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 hover:bg-white'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg ${
                        isActive ? `${tab.bg} ${tab.color}` : 'text-gray-300 dark:text-gray-600'
                      }`}
                    >
                      <tab.icon size={18} />
                    </div>
                    <div className="flex flex-col">
                      <span
                        className={`text-[10px] font-black uppercase tracking-widest ${
                          isActive ? 'text-gray-800 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'
                        }`}
                      >
                        {tab.label}
                      </span>
                      <span className="text-[9px] text-gray-400 dark:text-gray-500">{tab.description}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[1.5rem] shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-300">
                  {(t as any).home?.objects_library?.upload_label ?? 'Upload object'}
                </label>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                  {activeTab?.description ?? (t as any).home?.objects_library?.upload_help ?? 'Select or drop your file'}
                </p>
              </div>
              <span className="text-[9px] font-bold text-gray-300 dark:text-gray-600 uppercase tracking-widest">
                {activeTab?.accept ?? '*/*'}
              </span>
            </div>

            <div
              onClick={handleDropzoneClick}
              className="border-2 border-dashed rounded-[1.5rem] p-8 flex flex-col items-center justify-center cursor-pointer bg-gray-50/50 dark:bg-gray-900/60 border-gray-200 dark:border-gray-800 hover:border-brand-300 hover:bg-brand-50/20 transition-all group"
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
                disabled={isSubmitting}
              />
              <div className="flex flex-col items-center gap-2 text-center">
                {activeTab ? (
                  <activeTab.icon
                    className="mb-1 text-gray-300 group-hover:text-brand-400 transition-all"
                    size={36}
                  />
                ) : (
                  <Upload className="mb-1 text-gray-300" size={36} />
                )}
                <span className="text-[10px] font-black text-gray-500 dark:text-gray-200 uppercase tracking-widest">
                  {fileName ? fileName : (t as any).home?.objects_library?.upload_cta ?? 'Click to upload your object'}
                </span>
                <span className="text-[9px] font-semibold text-gray-300 dark:text-gray-600 uppercase tracking-widest">
                  {(t as any).home?.objects_library?.upload_hint ?? 'or drop it here'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[1.5rem] shadow-sm p-5 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-300">
                {(t as any).home?.objects_library?.name_label ?? 'Name'}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSubmit(e);
                  }
                }}
                className="w-full text-sm p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:focus:border-brand-400 rounded-xl outline-none font-medium text-gray-700 dark:text-gray-100 transition-all"
                placeholder={(t as any).home?.objects_library?.name_placeholder ?? 'Enter object title'}
                autoFocus
                disabled={isSubmitting}
              />
              <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                {(t as any).home?.objects_library?.name_help ?? 'Give your object a clear, unique title.'}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                if (isSubmitting) return;
                resetState();
                onClose();
              }}
              className="flex-1 py-4 text-[10px] font-black text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 uppercase tracking-widest rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              {(t as any).common?.cancel ?? 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex-[2] py-4 min-h-[48px] text-[10px] font-black bg-brand-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors uppercase tracking-widest disabled:bg-brand-200 hover:bg-brand-700"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span className="animate-pulse">{(t as any).common?.loading ?? 'Saving...'}</span>
                </>
              ) : (
                <>
                  <Upload size={16} />
                  {(t as any).common?.save ?? 'Save'}
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddObjectModal;
