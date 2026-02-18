import React, { useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
    AlignLeft,
    ClipboardPaste,
    FileText,
    Globe,
    ImageIcon,
    Upload,
    Video,
    X,
} from 'lucide-react';

import { SourceType } from '../types.ts';
import { analyzeImage, extractUrlContent, processPdfVisual, transcribeVideo, transcribeVideoUrl } from '../services/geminiService.ts';
import type { Translations } from '../../../language/locales/types';

interface AddSourceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddSource: (type: SourceType, content: string, title: string, url?: string, previewUrl?: string, file?: File) => void;
    tp: Translations['notebook']['sourcePanel'];
    t: Translations;
    isAdmin: boolean;
}

type PdfJsViewport = { height: number; width: number };
type PdfJsPage = {
    getViewport: (options: { scale: number }) => PdfJsViewport;
    render: (params: { canvasContext: CanvasRenderingContext2D; viewport: PdfJsViewport }) => { promise: Promise<void> };
};
type PdfJsLib = {
    getDocument?: (options: { data: ArrayBuffer }) => { promise: Promise<{ numPages: number; getPage: (pageNumber: number) => Promise<PdfJsPage> }> };
};

const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
    });

const processPdfForAI = async (file: File): Promise<string> => {
    if (
        file.type === 'text/plain' ||
        file.type === 'text/csv' ||
        file.type === 'text/markdown' ||
        file.name.toLowerCase().endsWith('.csv') ||
        file.name.toLowerCase().endsWith('.md')
    ) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsText(file);
        });
    }

    const pdfjsLib = (window as Window & { pdfjsLib?: PdfJsLib }).pdfjsLib;
    if (!pdfjsLib || !pdfjsLib.getDocument) {
        throw new Error('PDF.js no está cargado. Por favor, recarga la página.');
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pagesBase64: { data: string; mimeType: string }[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.0 });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: ctx!, viewport }).promise;
        const base64 = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
        pagesBase64.push({ data: base64, mimeType: 'image/jpeg' });
    }
    return await processPdfVisual(pagesBase64);
};

const AddSourceModal: React.FC<AddSourceModalProps> = ({ isOpen, onClose, onAddSource, tp, t }) => {
    const [activeTab, setActiveTab] = useState<SourceType>('pdf');
    const [content, setContent] = useState<string>('');
    const [url, setUrl] = useState('');
    const [fileName, setFileName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [mimeType, setMimeType] = useState('');
    const [localPreviewUrl, setLocalPreviewUrl] = useState<string>('');
    const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const htmlInputRef = useRef<HTMLInputElement>(null);
    const jsxInputRef = useRef<HTMLInputElement>(null);
    const configInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const resetForm = () => {
        setContent('');
        setUrl('');
        setFileName('');
        setMimeType('');
        setLocalPreviewUrl('');
        setSelectedFile(undefined);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: SourceType) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setFileName(file.name);
        setMimeType(file.type);
        setSelectedFile(file);

        const objectUrl = URL.createObjectURL(file);
        setLocalPreviewUrl(objectUrl);

        try {
            if (type === 'pdf') {
                setContent(await processPdfForAI(file));
            } else if (type === 'html' || type === 'code' || type === 'config') {
                const text = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (event) => resolve(event.target?.result as string);
                    reader.readAsText(file);
                });
                setContent(text);
            } else if (type === 'image' || type === 'video') {
                setContent(await fileToBase64(file));
            }
        } catch (err) {
            console.error(err);
            alert(t.common.error);
        }
        setIsLoading(false);
    };

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setContent(text);
        } catch (err) {
            alert(tp.modal.placeholders.paste);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLoading) return;
        setIsLoading(true);

        try {
            let finalContent = content;
            let finalTitle = fileName.split('.')[0] || tp.modal.placeholders.newSource;
            let finalPreviewUrl = localPreviewUrl;

            if (activeTab === 'url') {
                const result = await extractUrlContent(url);
                finalContent = result.content;
                finalTitle = result.title;
                finalPreviewUrl = url;
            } else if (activeTab === 'video') {
                if (url) {
                    const result = await transcribeVideoUrl(url);
                    finalContent = result.content;
                    finalTitle = result.title;
                    finalPreviewUrl = url;
                } else {
                    finalContent = await transcribeVideo(content, mimeType);
                }
            } else if (activeTab === 'image') {
                const result = await analyzeImage(content, mimeType);
                finalContent = result.content;
                finalTitle = result.title;
            } else if (activeTab === 'text') {
                finalTitle = (content || '').split('\n')[0].substring(0, 30) || tp.modal.placeholders.textLabel;
            }

            onAddSource(activeTab, finalContent, finalTitle, url, finalPreviewUrl, selectedFile);
            onClose();
            resetForm();
        } catch (err) {
            console.error(err);
            alert(t.common.error);
        } finally {
            setIsLoading(false);
        }
    };

    const TAB_CONFIG: ReadonlyArray<{
        id: 'pdf' | 'html' | 'code' | 'image' | 'video' | 'url' | 'text' | 'config';
        icon: LucideIcon;
        color: string;
        bg: string;
    }> = [
        { id: 'pdf', icon: FileText, color: 'text-red-500', bg: 'bg-red-50' },
        { id: 'html', icon: Globe, color: 'text-blue-600', bg: 'bg-blue-50' },
        { id: 'code', icon: FileText, color: 'text-teal-600', bg: 'bg-teal-50' },
        { id: 'image', icon: ImageIcon, color: 'text-amber-500', bg: 'bg-amber-50' },
        { id: 'video', icon: Video, color: 'text-purple-500', bg: 'bg-purple-50' },
        { id: 'url', icon: Globe, color: 'text-blue-500', bg: 'bg-blue-50' },
        { id: 'text', icon: AlignLeft, color: 'text-green-500', bg: 'bg-green-50' },
        { id: 'config', icon: FileText, color: 'text-slate-600', bg: 'bg-slate-50' },
    ];

    const shouldShowTextPreview = (): boolean => {
        if (!content || typeof content !== 'string') return false;
        const isTextMime = mimeType?.startsWith('text/') || fileName.toLowerCase().endsWith('.csv') || fileName.toLowerCase().endsWith('.txt');
        if (activeTab === 'pdf' && isTextMime) return true;
        if (activeTab === 'html' || activeTab === 'code' || activeTab === 'text' || activeTab === 'config') return true;
        return false;
    };

    const renderContentPreview = () => {
        if (!shouldShowTextPreview()) return null;
        return (
            <div className="bg-white border border-gray-100 rounded-[1.5rem] shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-400">
                        <FileText size={16} />
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{tp.modal.placeholders.textLabel}</span>
                    </div>
                </div>
                <div className="p-5 max-h-[320px] overflow-auto">
                    <pre className="whitespace-pre-wrap font-sans text-gray-700 text-xs leading-relaxed">{content}</pre>
                </div>
            </div>
        );
    };

    const renderTabButtons = () => (
        <div className="grid grid-cols-6 gap-2 md:gap-3">
            {TAB_CONFIG
                .map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            setActiveTab(tab.id as SourceType);
                            resetForm();
                        }}
                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all gap-1.5 group ${
                            activeTab === (tab.id as SourceType)
                                ? 'bg-white border-indigo-600 shadow-md ring-2 ring-indigo-50'
                                : 'bg-white/40 border-gray-100 hover:border-gray-200 hover:bg-white'
                        }`}
                    >
                        <div
                            className={`p-1.5 rounded-lg transition-colors ${
                                activeTab === (tab.id as SourceType)
                                    ? tab.bg + ' ' + tab.color
                                    : 'text-gray-300 group-hover:' + tab.color
                            }`}
                        >
                            <tab.icon size={18} />
                        </div>
                        <span
                            className={`text-[8px] font-black uppercase tracking-tight ${
                                activeTab === (tab.id as SourceType) ? 'text-indigo-600' : 'text-gray-400'
                            }`}
                        >
                            {tab.id === 'html'
                                ? 'HTML'
                                : tab.id === 'code'
                                    ? 'JSX/TSX'
                                    : tab.id === 'pdf'
                                        ? 'DOC'
                                        : tab.id === 'image'
                                            ? tp.modal.tabs.image
                                            : tab.id === 'video'
                                                ? tp.modal.tabs.video
                                                : tab.id === 'url'
                                                    ? tp.modal.tabs.url
                                                    : tab.id === 'config'
                                                        ? 'CONFIG'
                                                        : tp.modal.tabs.text}
                        </span>
                    </button>
                ))}
        </div>
    );

    const renderModalFooter = () => (
        <div className="px-6 py-4 border-t border-gray-100 bg-white shrink-0">
            <form onSubmit={handleSubmit} className="flex gap-3">
                <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 text-[10px] font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest"
                    disabled={isLoading}
                >
                    {t.common.cancel}
                </button>
                <button
                    type="submit"
                    disabled={isLoading || (!content && !url)}
                    className="flex-[2] py-3 min-h-[48px] text-[10px] font-black bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 active:scale-95 transition-all uppercase tracking-widest disabled:bg-indigo-200"
                >
                    {isLoading ? (
                        <>
                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span className="animate-pulse">{tp.modal.footer.synthesizing}</span>
                        </>
                    ) : (
                        <>
                            <Upload size={14} /> {t.common.save}
                        </>
                    )}
                </button>
            </form>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[1000] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
                    <div className="flex flex-col">
                        <h3 className="font-black text-gray-800 text-lg tracking-tight">{tp.modal.title}</h3>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{tp.modal.subtitle}</span>
                    </div>
                    <button
                        onClick={() => !isLoading && onClose()}
                        className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors"
                        disabled={isLoading}
                        aria-label={t.common.cancel}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="bg-gray-50/50 p-4 shrink-0">{renderTabButtons()}</div>

                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-5 no-scrollbar min-h-[240px]">
                    {activeTab === 'pdf' && (
                        <div onClick={() => !isLoading && fileInputRef.current?.click()} className="border-2 border-dashed rounded-[1.5rem] p-8 flex flex-col items-center justify-center cursor-pointer bg-gray-50/30 border-gray-200 hover:border-red-300 hover:bg-red-50/10 transition-all group">
                            <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.txt,.md" onChange={(e) => handleFileUpload(e, 'pdf')} disabled={isLoading} />
                            <FileText className="mb-3 text-gray-300 group-hover:text-red-400 transition-all" size={36} />
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">{fileName || tp.modal.placeholders.selectFile}</span>
                            <span className="mt-2 text-[9px] font-bold text-gray-300 uppercase tracking-widest text-center">{tp.modal.placeholders.docAllowedTypes}</span>
                        </div>
                    )}

                    {activeTab === 'html' && (
                        <div onClick={() => !isLoading && htmlInputRef.current?.click()} className="border-2 border-dashed rounded-[1.5rem] p-8 flex flex-col items-center justify-center cursor-pointer bg-blue-50/5 border-blue-50 hover:border-blue-200 hover:bg-blue-50/20 transition-all group">
                            <input type="file" ref={htmlInputRef} className="hidden" accept=".html" onChange={(e) => handleFileUpload(e, 'html')} disabled={isLoading} />
                            <Globe className="mb-3 text-blue-200 group-hover:text-blue-500 transition-all" size={36} />
                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest text-center">{fileName || tp.modal.placeholders.uploadHtml}</span>
                        </div>
                    )}

                    {activeTab === 'code' && (
                        <div onClick={() => !isLoading && jsxInputRef.current?.click()} className="border-2 border-dashed rounded-[1.5rem] p-8 flex flex-col items-center justify-center cursor-pointer bg-teal-50/5 border-teal-50 hover:border-teal-200 hover:bg-teal-50/20 transition-all group">
                            <input type="file" ref={jsxInputRef} className="hidden" accept=".jsx,.tsx,.js,.ts" onChange={(e) => handleFileUpload(e, 'code')} disabled={isLoading} />
                            <FileText className="mb-3 text-teal-200 group-hover:text-teal-500 transition-all" size={36} />
                            <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest text-center">{fileName || "Subir JSX/TSX"}</span>
                        </div>
                    )}

                    {activeTab === 'image' && (
                        <div onClick={() => !isLoading && imageInputRef.current?.click()} className="border-2 border-dashed rounded-[1.5rem] p-8 flex flex-col items-center justify-center cursor-pointer bg-amber-50/5 border-amber-50 hover:border-amber-200 hover:bg-amber-50/20 transition-all group">
                            <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'image')} disabled={isLoading} />
                            <ImageIcon className="mb-3 text-amber-200 group-hover:text-amber-500 transition-all" size={36} />
                            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest text-center">{fileName || tp.modal.placeholders.uploadImage}</span>
                        </div>
                    )}

                    {activeTab === 'video' && (
                        <div className="space-y-4">
                            <div onClick={() => !isLoading && videoInputRef.current?.click()} className="border-2 border-dashed rounded-[1.5rem] p-8 flex flex-col items-center justify-center cursor-pointer bg-purple-50/5 border-purple-50 hover:border-purple-200 hover:bg-purple-50/20 transition-all group">
                                <input type="file" ref={videoInputRef} className="hidden" accept="video/*" onChange={(e) => handleFileUpload(e, 'video')} disabled={isLoading} />
                                <Video className="mb-3 text-purple-200 group-hover:text-purple-500 transition-all" size={36} />
                                <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest text-center">{fileName || tp.modal.placeholders.uploadVideo}</span>
                            </div>
                        </div>
                    )}

                    {activeTab === 'url' && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-blue-500 px-1">
                                <Globe size={16} />
                                <span className="text-[9px] font-black uppercase tracking-widest">{tp.modal.placeholders.webLink}</span>
                            </div>
                            <input type="url" placeholder="https://ejemplo.com/articulo" className="w-full text-xs p-4 bg-gray-50 border border-gray-100 focus:border-blue-300 rounded-xl outline-none font-bold text-gray-700 transition-all" value={url} onChange={e => setUrl(e.target.value)} required disabled={isLoading} />
                            <p className="text-[9px] text-gray-400 px-1 italic">{tp.modal.placeholders.webLinkHint}</p>
                        </div>
                    )}

                    {activeTab === 'text' && (
                        <div className="space-y-3 h-full flex flex-col">
                            <div className="flex justify-between items-center mb-1 shrink-0 px-1">
                                <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">{tp.modal.placeholders.textLabel}</span>
                                <button type="button" onClick={handlePaste} className="flex items-center gap-1.5 text-[8px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg hover:bg-indigo-100 transition-all uppercase tracking-widest border border-indigo-100"><ClipboardPaste size={12} /> {tp.modal.placeholders.paste}</button>
                            </div>
                            <textarea
                                placeholder={tp.modal.placeholders.textPlaceholder}
                                className="flex-1 w-full text-xs p-5 bg-gray-50 border border-gray-100 focus:border-green-200 rounded-[1.5rem] min-h-[160px] resize-none outline-none font-medium text-gray-700 shadow-inner leading-relaxed"
                                value={content || ''}
                                onChange={e => setContent(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                    )}

                    {activeTab === 'config' && (
                        <div className="space-y-3 h-full flex flex-col">
                            <div className="flex items-center gap-2 text-slate-600 px-1">
                                <FileText size={16} />
                                <span className="text-[9px] font-black uppercase tracking-widest">CONFIG</span>
                            </div>
                            <div onClick={() => !isLoading && configInputRef.current?.click()} className="border-2 border-dashed rounded-[1.5rem] p-8 flex flex-col items-center justify-center cursor-pointer bg-slate-50/30 border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 transition-all group">
                                <input type="file" ref={configInputRef} className="hidden" accept=".json,.yaml,.yml,.env,.ini" onChange={(e) => handleFileUpload(e, 'config')} disabled={isLoading} />
                                <FileText className="mb-3 text-slate-300 group-hover:text-slate-500 transition-all" size={36} />
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">{fileName || 'Subir archivo de configuración (.json, .yaml, .yml, .env, .ini)'}</span>
                            </div>
                        </div>
                    )}

                    {renderContentPreview()}
                </div>

                {renderModalFooter()}
            </div>
        </div>
    );
};

export default AddSourceModal;