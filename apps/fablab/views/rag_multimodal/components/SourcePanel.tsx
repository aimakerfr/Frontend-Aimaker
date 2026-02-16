
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
        <div className="h-full flex flex-col bg-white border-r border-gray-100 relative overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
                <h2 className="font-black text-gray-800 flex items-center gap-2 tracking-tight text-base">
                    <FileType className="w-5 h-5 text-indigo-600" />
                    {tp.title}
                </h2>
                <span className="text-[9px] font-black bg-indigo-50 px-2 py-1 rounded-full text-indigo-600 border border-indigo-100 tracking-widest uppercase">
                    {sources.length} {tp.total}
                </span>
            </div>

            <SourceList
                sources={sources}
                tp={tp}
                t={t}
                onToggleSource={onToggleSource}
                onDeleteSource={onDeleteSource}
                onOpenPreview={handleOpenPreview}
            />

            <div className="p-4 border-t border-gray-100 bg-white/95 backdrop-blur-sm shadow-[0_-12px_30px_-18px_rgba(79,70,229,0.3)] z-10">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full py-3 rounded-xl bg-indigo-600 text-white text-[11px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all"
                >
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
