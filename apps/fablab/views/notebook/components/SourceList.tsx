import React from 'react';
import { CheckSquare, Eye, FileType, Square, Trash2 } from 'lucide-react';

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
    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
            {sources.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center opacity-20">
                    <FileType size={40} className="mb-4 text-gray-400" />
                    <p className="text-xs font-bold uppercase tracking-widest">{tp.empty}</p>
                </div>
            )}
            {sources.map((source) => {
                const displayType = source.backendType || (source.type === 'pdf'
                    ? t.detailsView.readOnlyInfo
                    : source.type === 'url'
                        ? tp.modal.placeholders.webLink
                        : source.type.toUpperCase());

                return (
                    <div
                        key={source.id}
                        className={`group relative flex items-start p-3.5 rounded-2xl border transition-all cursor-pointer ${
                            source.selected ? 'bg-indigo-50/50 border-indigo-200 shadow-sm' : 'bg-white border-gray-100 hover:border-gray-200'
                        }`}
                        onClick={() => onToggleSource(source.id)}
                    >
                        <div className="mt-0.5 mr-3 shrink-0">
                            {source.selected ? <CheckSquare size={18} className="text-indigo-600" /> : <Square size={18} className="text-gray-300" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <h3 className={`font-bold text-xs truncate ${source.selected ? 'text-indigo-900' : 'text-gray-700'}`}>{source.title}</h3>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onOpenPreview(source);
                                    }}
                                    className="p-1.5 rounded-lg bg-gray-50 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all shrink-0"
                                >
                                    <Eye size={14} />
                                </button>
                            </div>
                            <div className="flex items-center gap-2 mt-1.5">
                                <span
                                    className={`text-[8px] uppercase font-black px-1.5 py-0.5 rounded-md ${
                                        source.type === 'pdf'
                                            ? 'bg-red-50 text-red-500'
                                            : source.type === 'url'
                                                ? 'bg-blue-50 text-blue-500'
                                                : source.type === 'html'
                                                    ? 'bg-blue-600 text-white'
                                                    : source.type === 'image'
                                                        ? 'bg-amber-50 text-amber-500'
                                                        : source.type === 'code'
                                                            ? 'bg-teal-50 text-teal-600'
                                                            : source.type === 'video'
                                                                ? 'bg-purple-50 text-purple-500'
                                                                : source.type === 'config'
                                                                    ? 'bg-slate-50 text-slate-600'
                                                                    : 'bg-green-50 text-green-500'
                                    }`}
                                >
                                    {displayType}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteSource(source.id);
                            }}
                            className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 p-1.5 bg-white border border-gray-200 rounded-full text-gray-400 hover:text-red-500 transition-all shadow-md z-10"
                        >
                            <Trash2 size={10} />
                        </button>
                    </div>
                );
            })}
        </div>
    );
};

export default SourceList;