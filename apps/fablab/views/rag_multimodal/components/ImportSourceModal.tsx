
import React from 'react';
import { X } from 'lucide-react';
import ObjectsLibrary from '../../home/ObjectsLibrary.tsx';
import { ObjectItem } from '@core/objects';
import { Translations } from '../../../language/locales/types';

interface ImportSourceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: () => Promise<void>;
    selectedObjects: ObjectItem[];
    onSelectionChange: (objects: ObjectItem[]) => void;
    isImporting: boolean;
    tp: Translations['notebook']['sourcePanel'];
    t: Translations;
}

const ImportSourceModal: React.FC<ImportSourceModalProps> = ({
    isOpen,
    onClose,
    onImport,
    selectedObjects,
    onSelectionChange,
    isImporting,
    tp,
    t
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
                    <div className="flex flex-col">
                        <h3 className="font-black text-gray-800 text-lg tracking-tight">{tp.importTitle}</h3>
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{tp.importSubtitle}</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors"
                        aria-label={t.common.cancel}
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-5 no-scrollbar min-h-[240px] bg-white">
                    <ObjectsLibrary
                        selection
                        selectedObjects={selectedObjects}
                        onSelectionChange={onSelectionChange}
                    />
                </div>
                <div className="px-6 py-4 border-t border-gray-100 bg-white shrink-0 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-3 text-[10px] font-black text-gray-500 hover:text-gray-700 uppercase tracking-widest"
                        disabled={isImporting}
                    >
                        {t.common.cancel}
                    </button>
                    <button
                        type="button"
                        onClick={onImport}
                        disabled={isImporting || !selectedObjects.length}
                        className="flex-[2] py-3 min-h-[48px] text-[10px] font-black bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 active:scale-95 transition-all uppercase tracking-widest disabled:bg-indigo-200"
                    >
                        {isImporting ? (
                            <>
                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span className="animate-pulse">{t.common.loading}</span>
                            </>
                        ) : (
                            <>
                                <span>{(t as any)?.home?.objects_library?.import_objects ?? 'Import Objects'}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImportSourceModal;
