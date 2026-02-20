import React from 'react';
import { CheckCircle2, Eye, FileText, Globe, ImageIcon, Video, Code, FileType, Circle, Trash2, FileCode } from 'lucide-react';

import { Source } from '../types.ts';
import type { Translations } from '../../../language/locales/types';

interface SourceListProps {
    sources: Source[];
    tp: Translations['notebook']['sourcePanel'];
    t: Translations;
    onToggleSource: (id: string) => void;
    onDeleteSource: (id: string) => void;
    onOpenPreview: (source: Source) => void;
}

const SourceList: React.FC<SourceListProps> = ({ sources, tp, t, onToggleSource, onDeleteSource, onOpenPreview }) => {
    const getSourceIcon = (type: string) => {
        switch (type) {
            case 'pdf': return <FileText size={16} />;
            case 'url': return <Globe size={16} />;
            case 'html': return <Globe size={16} />;
            case 'image': return <ImageIcon size={16} />;
            case 'video': return <Video size={16} />;
            case 'code': return <Code size={16} />;
            case 'config': return <FileCode size={16} />;
            default: return <FileType size={16} />;
        }
    };

    return (
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2.5 no-scrollbar">
            {sources.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="p-6 bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl mb-4 shadow-inner">
                        <FileType size={48} className="text-gray-300" />
                    </div>
                    <p className="text-xs font-black text-gray-500 uppercase tracking-widest">{tp.empty}</p>
                    <p className="text-[10px] text-gray-500 mt-2 max-w-[180px]">Agrega tu primera fuente para comenzar</p>
                </div>
            )}
            {sources.map((source) => {
                const displayType = source.backendType || (source.type === 'pdf'
                    ? t.detailsView.readOnlyInfo
                    : source.type === 'url'
                        ? tp.modal.placeholders.webLink
                        : source.type.toUpperCase());

                const typeColor = source.type === 'pdf'
                    ? { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: 'text-red-600' }
                    : source.type === 'url'
                        ? { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: 'text-blue-600' }
                        : source.type === 'html'
                            ? { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', icon: 'text-sky-600' }
                            : source.type === 'image'
                                ? { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: 'text-amber-600' }
                                : source.type === 'code'
                                    ? { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', icon: 'text-teal-600' }
                                    : source.type === 'video'
                                        ? { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: 'text-purple-600' }
                                        : source.type === 'config'
                                            ? { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', icon: 'text-slate-600' }
                                            : { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: 'text-green-600' };

                return (
                    <div
                        key={source.id}
                        className={`group relative flex items-start p-4 rounded-xl border-2 transition-all cursor-pointer ${
                            source.selected 
                                ? 'bg-gradient-to-br from-indigo-50 to-purple-50/30 border-indigo-300 shadow-lg shadow-indigo-100/50' 
                                : 'bg-white border-gray-200/60 hover:border-gray-300 hover:shadow-md'
                        }`}
                        onClick={() => onToggleSource(source.id)}
                    >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className={`p-2 rounded-lg shrink-0 ${typeColor.bg} ${typeColor.icon}`}>
                                {getSourceIcon(source.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <h3 className={`font-bold text-sm leading-tight ${
                                        source.selected ? 'text-indigo-900' : 'text-gray-800'
                                    }`}>
                                        {source.title}
                                    </h3>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onOpenPreview(source);
                                            }}
                                            className="p-1.5 rounded-lg bg-white/80 text-gray-400 hover:text-indigo-600 hover:bg-white hover:shadow-sm transition-all shrink-0"
                                            title="Vista previa"
                                        >
                                            <Eye size={14} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteSource(source.id);
                                            }}
                                            className="p-1.5 rounded-lg bg-white/80 text-gray-400 hover:text-red-600 hover:bg-white hover:shadow-sm transition-all shrink-0"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[9px] uppercase font-black px-2 py-1 rounded-lg ${typeColor.bg} ${typeColor.text} border ${typeColor.border}`}>
                                        {displayType}
                                    </span>
                                    <div className={`ml-auto flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all ${
                                        source.selected 
                                            ? 'bg-indigo-100 text-indigo-800' 
                                            : 'bg-gray-100 text-gray-600'
                                    }`}>
                                        {source.selected ? (
                                            <>
                                                <CheckCircle2 size={12} />
                                                <span className="text-[9px] font-black">ACTIVA</span>
                                            </>
                                        ) : (
                                            <>
                                                <Circle size={12} />
                                                <span className="text-[9px] font-black">INACTIVA</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default SourceList;