
import React, { useState } from 'react';

import { FileType } from 'lucide-react';

import { Source, SourceType } from '../types.ts';

import { useAuth } from '@core/auth/useAuth';
import { useLanguage } from '../../../language/useLanguage';
import AddSourceModal from './AddSourceModal';
import SourceList from './SourceList';
import SourcePreview from './SourcePreview';

// ========= Types =========
interface SourcePanelProps {
    sources: Source[];
    onAddSource: (type: SourceType, content: string, title: string, url?: string, previewUrl?: string, file?: File) => void;
    onToggleSource: (id: string) => void;
    onDeleteSource: (id: string) => void;
}

// ========= Stateless helpers (no React state) =========
const SourcePanel: React.FC<SourcePanelProps> = ({ sources, onAddSource, onToggleSource, onDeleteSource }) => {
    const { t } = useLanguage();
    const tp = t.notebook.sourcePanel;
    const { user } = useAuth();
    const isAdmin = user?.roles?.includes('ROLE_ADMIN') || false;

    const [isModalOpen, setIsModalOpen] = useState(false);
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
        <div className="h-full flex flex-col bg-gradient-to-b from-gray-50/50 to-white border-r border-gray-200/70 relative overflow-hidden">
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
                            <p className="text-[10px] text-gray-500 font-bold mt-0.5">Gestiona tus fuentes de datos</p>
                        </div>
                    </div>
                </div>
                <div className="mt-4 flex items-center justify-between p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                    <span className="text-xs font-bold text-gray-700">Fuentes activas</span>
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
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-black uppercase tracking-wider shadow-xl shadow-indigo-200/50 hover:from-indigo-700 hover:to-purple-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                    </svg>
                    {tp.add}
                </button>
            </div>

            <AddSourceModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAddSource={onAddSource}
                tp={tp}
                t={t}
                isAdmin={isAdmin}
            />

            <SourcePreview isOpen={isPreviewOpen} source={previewSource} onClose={handleClosePreview} tp={tp} />
        </div>
    );
};

export default SourcePanel;
