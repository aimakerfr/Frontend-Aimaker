
import React, { useRef, useState } from 'react';

import { FileType } from 'lucide-react';

import { Source } from '../types.ts';
import { useLanguage } from '../../../language/useLanguage';
import SourceList from './SourceList';
import SourcePreview from './SourcePreview';

// ========= Types =========
interface SourcePanelProps {
    sources: Source[];
    onToggleSource: (id: string) => void;
    onDeleteSource: (id: string) => void;
    onOpenImportModal: () => void;
    onOpenUploadModal: () => void;
}

// ========= Stateless helpers (no React state) =========
const SourcePanel: React.FC<SourcePanelProps> = ({ sources, onToggleSource, onDeleteSource, onOpenImportModal, onOpenUploadModal }) => {
    const { t } = useLanguage();
    const tp = t.notebook.sourcePanel;
    const panelRef = useRef<HTMLDivElement>(null);

    // Upload modal is now controlled from parent (RagMultimodal)
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewSource, setPreviewSource] = useState<Source | null>(null);

    const handleOpenPreview = (source: Source) => {
        setPreviewSource(source);
        setIsPreviewOpen(true);
    };

    const handleClosePreview = () => {
        setIsPreviewOpen(false);
        setPreviewSource(null);
    };

    return (
        <div ref={panelRef} className="h-full flex flex-col bg-gradient-to-b from-gray-50/50 to-white border-r border-gray-200/70 relative overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200/70 bg-white/80 backdrop-blur-sm shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-200/50">
                            <FileType className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h2 className="font-black text-gray-900 tracking-tight text-base">
                                {tp.title}
                            </h2>
                            <p className="text-[10px] text-gray-600 font-bold mt-0.5">{tp.subtitle}</p>
                        </div>
                    </div>
                </div>
                <div className="mt-4 flex items-center justify-between p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                    <span className="text-xs font-bold text-gray-700">{tp.activeLabel}</span>
                    <span className="text-sm font-black bg-white px-3 py-1 rounded-lg text-indigo-600 shadow-sm">
                        {sources.filter(s => s.selected).length} / {sources.length}
                    </span>
                </div>
            </div>

            <SourceList
                sources={sources}
                tp={tp}
                t={t}
                onToggleSource={onToggleSource}
                onDeleteSource={onDeleteSource}
                onOpenPreview={handleOpenPreview}
            />

            <div className="p-5 border-t border-gray-200/70 bg-white/95 backdrop-blur-sm shadow-[0_-12px_40px_-20px_rgba(79,70,229,0.4)] z-10">
                <div className="flex flex-col gap-3">
                    <button
                        onClick={onOpenImportModal}
                        className="w-full py-3.5 rounded-xl border-2 border-dashed border-indigo-200 text-indigo-700 bg-white text-xs font-black uppercase tracking-wider hover:border-indigo-400 hover:bg-indigo-50 active:scale-95 transition-all"
                    >
                        {tp.importButton}
                    </button>
                    <button
                        onClick={onOpenUploadModal}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-black uppercase tracking-wider shadow-xl shadow-indigo-200/50 hover:from-indigo-700 hover:to-purple-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                        </svg>
                        {tp.add}
                    </button>
                </div>
            </div>

            <SourcePreview isOpen={isPreviewOpen} source={previewSource} onClose={handleClosePreview} tp={tp} />
        </div>
    );
};

export default SourcePanel;
