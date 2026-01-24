
import React, { useState, useRef } from 'react';
import { Plus, Trash2, CheckSquare, Square, FileType, Upload, X, Video, Link2, ImageIcon, Eye, FileText, AlignLeft, ClipboardPaste, Globe, ExternalLink, Download } from 'lucide-react';
import { Source, SourceType, Language } from '../types';
import { extractUrlContent, transcribeVideo, transcribeVideoUrl, analyzeImage, processPdfVisual } from '../services/geminiService';
import { UI_TRANSLATIONS } from '../constants/translations';

interface SourcePanelProps {
    sources: Source[];
    onAddSource: (type: SourceType, content: string, title: string, url?: string, previewUrl?: string, file?: File) => void;
    onToggleSource: (id: string) => void;
    onDeleteSource: (id: string) => void;
    lang: Language;
}

const SourcePanel: React.FC<SourcePanelProps> = ({ sources, onAddSource, onToggleSource, onDeleteSource, lang }) => {
    const t = UI_TRANSLATIONS[lang].sourcePanel;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewSource, setPreviewSource] = useState<Source | null>(null);
    const [activeTab, setActiveTab] = useState<SourceType>('pdf');
    const [content, setContent] = useState<any>(null);
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

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
        });
    };

    const processPdfForAI = async (file: File): Promise<string> => {
        // Tratamos .txt y .csv como texto plano
        if (file.type === 'text/plain' || file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')) {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target?.result as string);
                reader.readAsText(file);
            });
        }

        const pdfjsLib = (window as any).pdfjsLib;
        
        // Verificar que PDF.js esté cargado
        if (!pdfjsLib || !pdfjsLib.getDocument) {
            throw new Error('PDF.js no está cargado. Por favor, recarga la página.');
        }
        
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const pagesBase64: { data: string, mimeType: string }[] = [];

        const numPages = pdf.numPages;
        for (let i = 1; i <= numPages; i++) {
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

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: SourceType) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsLoading(true);
            setFileName(file.name);
            setMimeType(file.type);
            setSelectedFile(file);

            const objectUrl = URL.createObjectURL(file);
            setLocalPreviewUrl(objectUrl);

            try {
                if (type === 'pdf') {
                    setContent(await processPdfForAI(file));
                } else if (type === 'html') {
                    const text = await new Promise<string>((resolve) => {
                        const reader = new FileReader();
                        reader.onload = (e) => resolve(e.target?.result as string);
                        reader.readAsText(file);
                    });
                    setContent(text);
                } else if (type === 'image' || type === 'video') {
                    setContent(await fileToBase64(file));
                }
            } catch (err) {
                console.error(err);
                alert("Error al procesar el archivo.");
            }
            setIsLoading(false);
        }
    };

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setContent(text);
        } catch (err) {
            alert("Por favor, pega el texto manualmente en el recuadro.");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLoading) return;
        setIsLoading(true);
        try {
            let finalContent = content;
            let finalTitle = fileName.split('.')[0] || "Nueva Fuente";
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
                finalTitle = (content || "").split('\n')[0].substring(0, 30) || "Texto Libre";
            }

            onAddSource(activeTab, finalContent, finalTitle, url, finalPreviewUrl, selectedFile);
            setIsModalOpen(false);
            resetForm();
        } catch (err) {
            console.error(err);
            alert("Error en el análisis de IA. Intenta con un archivo más ligero o revisa la URL.");
        }
        finally { setIsLoading(false); }
    };

    const resetForm = () => { setContent(null); setUrl(''); setFileName(''); setMimeType(''); setLocalPreviewUrl(''); setSelectedFile(undefined); };

    const handleOpenPreview = (source: Source) => {
        setPreviewSource(source);
        setIsPreviewOpen(true);
    };

    return (
        <div className="h-full flex flex-col bg-white border-r border-gray-100 relative overflow-hidden">
            {/* Cabecera Lateral */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
                <h2 className="font-black text-gray-800 flex items-center gap-2 tracking-tight text-base">
                    <FileType className="w-5 h-5 text-indigo-600" />
                    {t.title}
                </h2>
                <span className="text-[9px] font-black bg-indigo-50 px-2 py-1 rounded-full text-indigo-600 border border-indigo-100 tracking-widest uppercase">
                    {sources.length} {t.total}
                </span>
            </div>

            {/* Lista de Fuentes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                {sources.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-20">
                        <FileType size={40} className="mb-4 text-gray-400" />
                        <p className="text-xs font-bold uppercase tracking-widest">{t.empty}</p>
                    </div>
                )}
                {sources.map(source => (
                    <div key={source.id} className={`group relative flex items-start p-3.5 rounded-2xl border transition-all cursor-pointer ${source.selected ? 'bg-indigo-50/50 border-indigo-200 shadow-sm' : 'bg-white border-gray-100 hover:border-gray-200'}`} onClick={() => onToggleSource(source.id)}>
                        <div className="mt-0.5 mr-3 shrink-0">
                            {source.selected ? <CheckSquare size={18} className="text-indigo-600" /> : <Square size={18} className="text-gray-300" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <h3 className={`font-bold text-xs truncate ${source.selected ? 'text-indigo-900' : 'text-gray-700'}`}>{source.title}</h3>
                                <button onClick={(e) => { e.stopPropagation(); handleOpenPreview(source); }} className="p-1.5 rounded-lg bg-gray-50 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all shrink-0">
                                    <Eye size={14} />
                                </button>
                            </div>
                            <div className="flex items-center gap-2 mt-1.5">
                                <span className={`text-[8px] uppercase font-black px-1.5 py-0.5 rounded-md ${source.type === 'pdf' ? 'bg-red-50 text-red-500' :
                                    source.type === 'url' ? 'bg-blue-50 text-blue-500' :
                                        source.type === 'html' ? 'bg-blue-600 text-white' :
                                            source.type === 'image' ? 'bg-amber-50 text-amber-500' :
                                                source.type === 'video' ? 'bg-purple-50 text-purple-500' :
                                                    'bg-green-50 text-green-500'}`}>{source.type === 'pdf' ? 'DOCUMENTO' : source.type === 'url' ? 'WEBSITE' : source.type.toUpperCase()}</span>
                            </div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); onDeleteSource(source.id); }} className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 p-1.5 bg-white border border-gray-200 rounded-full text-gray-400 hover:text-red-500 transition-all shadow-md z-10"><Trash2 size={10} /></button>
                    </div>
                ))}
            </div>

            {/* Botón Añadir Fuente */}
            <div className="p-5 border-t border-gray-100 bg-white shrink-0">
                <button onClick={() => setIsModalOpen(true)} className="w-full py-4 px-4 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-100 text-[11px] font-black hover:bg-indigo-700 active:scale-95 flex items-center justify-center gap-3 transition-all tracking-widest uppercase">
                    <Plus size={18} /> {t.add}
                </button>
            </div>

            {/* Modal Añadir Fuente */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[1000] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
                            <div className="flex flex-col">
                                <h3 className="font-black text-gray-800 text-lg tracking-tight">Nueva Fuente</h3>
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Contenido para el motor RAG</span>
                            </div>
                            <button onClick={() => !isLoading && setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors" disabled={isLoading}><X size={20} /></button>
                        </div>

                        <div className="bg-gray-50/50 p-4 shrink-0">
                            <div className="grid grid-cols-5 gap-2 md:gap-3">
                                {[
                                    { id: 'pdf', icon: FileText, color: 'text-red-500', bg: 'bg-red-50' },
                                    { id: 'html', icon: Globe, color: 'text-blue-600', bg: 'bg-blue-50' },
                                    { id: 'image', icon: ImageIcon, color: 'text-amber-500', bg: 'bg-amber-50' },
                                    { id: 'video', icon: Video, color: 'text-purple-500', bg: 'bg-purple-50' },
                                    { id: 'url', icon: Globe, color: 'text-blue-500', bg: 'bg-blue-50' },
                                    { id: 'text', icon: AlignLeft, color: 'text-green-500', bg: 'bg-green-50' }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => { setActiveTab(tab.id as SourceType); resetForm(); }}
                                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all gap-1.5 group ${activeTab === tab.id ? 'bg-white border-indigo-600 shadow-md ring-2 ring-indigo-50' : 'bg-white/40 border-gray-100 hover:border-gray-200 hover:bg-white'}`}
                                    >
                                        <div className={`p-1.5 rounded-lg transition-colors ${activeTab === tab.id ? tab.bg + ' ' + tab.color : 'text-gray-300 group-hover:' + tab.color}`}>
                                            <tab.icon size={18} />
                                        </div>
                                        <span className={`text-[8px] font-black uppercase tracking-tight ${activeTab === tab.id ? 'text-indigo-600' : 'text-gray-400'}`}>
                                            {tab.id === 'html' ? 'HTML' : tab.id === 'pdf' ? 'PDF/DOC' : tab.id === 'image' ? 'IMAGEN' : tab.id === 'video' ? 'VIDEO' : tab.id === 'url' ? 'WEBSITE' : 'TEXTO'}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-5 no-scrollbar min-h-[240px]">
                            {activeTab === 'pdf' && (
                                <div onClick={() => !isLoading && fileInputRef.current?.click()} className="border-2 border-dashed rounded-[1.5rem] p-8 flex flex-col items-center justify-center cursor-pointer bg-gray-50/30 border-gray-200 hover:border-red-300 hover:bg-red-50/10 transition-all group">
                                    <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.txt,.csv" onChange={(e) => handleFileUpload(e, 'pdf')} disabled={isLoading} />
                                    <FileText className="mb-3 text-gray-300 group-hover:text-red-400 transition-all" size={36} />
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">{fileName || "Seleccionar archivo"}</span>
                                </div>
                            )}

                            {activeTab === 'html' && (
                                <div onClick={() => !isLoading && htmlInputRef.current?.click()} className="border-2 border-dashed rounded-[1.5rem] p-8 flex flex-col items-center justify-center cursor-pointer bg-blue-50/5 border-blue-50 hover:border-blue-200 hover:bg-blue-50/20 transition-all group">
                                    <input type="file" ref={htmlInputRef} className="hidden" accept=".html" onChange={(e) => handleFileUpload(e, 'html')} disabled={isLoading} />
                                    <Globe className="mb-3 text-blue-200 group-hover:text-blue-500 transition-all" size={36} />
                                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest text-center">{fileName || "Subir Archivo HTML"}</span>
                                </div>
                            )}

                            {activeTab === 'image' && (
                                <div onClick={() => !isLoading && imageInputRef.current?.click()} className="border-2 border-dashed rounded-[1.5rem] p-8 flex flex-col items-center justify-center cursor-pointer bg-amber-50/5 border-amber-50 hover:border-amber-200 hover:bg-amber-50/20 transition-all group">
                                    <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'image')} disabled={isLoading} />
                                    <ImageIcon className="mb-3 text-amber-200 group-hover:text-amber-500 transition-all" size={36} />
                                    <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest text-center">{fileName || "Subir Imagen"}</span>
                                </div>
                            )}

                            {activeTab === 'video' && (
                                <div className="space-y-4">
                                    <div onClick={() => !isLoading && videoInputRef.current?.click()} className="border-2 border-dashed rounded-[1.5rem] p-8 flex flex-col items-center justify-center cursor-pointer bg-purple-50/5 border-purple-50 hover:border-purple-200 hover:bg-purple-50/20 transition-all group">
                                        <input type="file" ref={videoInputRef} className="hidden" accept="video/*" onChange={(e) => handleFileUpload(e, 'video')} disabled={isLoading} />
                                        <Video className="mb-3 text-purple-200 group-hover:text-purple-500 transition-all" size={36} />
                                        <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest text-center">{fileName || "Subir Video Local"}</span>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-3 flex items-center text-gray-300"><Link2 size={16} /></div>
                                        <input type="url" placeholder="URL de YouTube" className="w-full text-xs pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold text-gray-700" value={url} onChange={e => setUrl(e.target.value)} disabled={isLoading} />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'url' && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-blue-500 px-1">
                                        <Globe size={16} />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Enlace Web</span>
                                    </div>
                                    <input type="url" placeholder="https://ejemplo.com/articulo" className="w-full text-xs p-4 bg-gray-50 border border-gray-100 focus:border-blue-300 rounded-xl outline-none font-bold text-gray-700 transition-all" value={url} onChange={e => setUrl(e.target.value)} required disabled={isLoading} />
                                    <p className="text-[9px] text-gray-400 px-1 italic">La IA navegará y extraerá el contenido relevante de forma automática.</p>
                                </div>
                            )}

                            {activeTab === 'text' && (
                                <div className="space-y-3 h-full flex flex-col">
                                    <div className="flex justify-between items-center mb-1 shrink-0 px-1">
                                        <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">Texto Libre</span>
                                        <button type="button" onClick={handlePaste} className="flex items-center gap-1.5 text-[8px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg hover:bg-indigo-100 transition-all uppercase tracking-widest border border-indigo-100"><ClipboardPaste size={12} /> Pegar</button>
                                    </div>
                                    <textarea
                                        placeholder="Pega el contenido para análisis RAG..."
                                        className="flex-1 w-full text-xs p-5 bg-gray-50 border border-gray-100 focus:border-green-200 rounded-[1.5rem] min-h-[160px] resize-none outline-none font-medium text-gray-700 shadow-inner leading-relaxed"
                                        value={content || ''}
                                        onChange={e => setContent(e.target.value)}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 border-t border-gray-100 bg-white shrink-0">
                            <form onSubmit={handleSubmit} className="flex gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-[10px] font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest" disabled={isLoading}>{t.cancel}</button>
                                <button type="submit" disabled={isLoading || (!content && !url)} className="flex-[2] py-3 min-h-[48px] text-[10px] font-black bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 active:scale-95 transition-all uppercase tracking-widest disabled:bg-indigo-200">
                                    {isLoading ? (
                                        <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div><span className="animate-pulse">SINTETIZANDO...</span></>
                                    ) : (
                                        <><Upload size={14} /> {t.save}</>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Vista Previa */}
            {isPreviewOpen && previewSource && (
                <div className="fixed inset-0 z-[1000] bg-gray-900/90 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 max-h-[92vh]">
                        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shrink-0">
                                    {previewSource.type === 'image' && <ImageIcon size={22} />}
                                    {previewSource.type === 'video' && <Video size={22} />}
                                    {previewSource.type === 'pdf' && <FileText size={22} />}
                                    {previewSource.type === 'url' && <Link2 size={22} />}
                                    {previewSource.type === 'text' && <AlignLeft size={22} />}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-black text-gray-900 text-lg leading-none mb-1 truncate">{previewSource.title}</h3>
                                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Fuente de Conocimiento</span>
                                </div>
                            </div>
                            <button onClick={() => setIsPreviewOpen(false)} className="p-3 bg-gray-50 hover:bg-red-50 hover:text-red-500 rounded-2xl text-gray-400 transition-all border border-gray-100 shrink-0">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto bg-gray-50 p-8 md:p-12 no-scrollbar">
                            <div className="w-full h-full flex items-center justify-center">
                                {previewSource.type === 'pdf' && (
                                    <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 max-w-md w-full text-center">
                                        <FileText size={56} className="text-red-500 mx-auto mb-8" />
                                        <h4 className="text-2xl font-black text-gray-900 mb-2">Documento</h4>
                                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-10">El contenido ha sido inyectado al motor RAG</p>
                                        <div className="flex flex-col gap-4">
                                            {previewSource.previewUrl && (
                                                <>
                                                    <a href={previewSource.previewUrl} target="_blank" rel="noopener noreferrer" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors">
                                                        <ExternalLink size={16} /> Abrir en pestaña nueva
                                                    </a>
                                                    <a href={previewSource.previewUrl} download={previewSource.title + (previewSource.previewUrl.includes('.pdf') ? ".pdf" : ".txt")} className="w-full py-4 bg-white text-indigo-600 border-2 border-indigo-600 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-indigo-50 transition-colors">
                                                        <Download size={16} /> Descargar Archivo
                                                    </a>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {previewSource.type === 'text' && (
                                    <div className="w-full max-w-3xl bg-white p-10 md:p-14 rounded-[2.5rem] shadow-sm border border-gray-100">
                                        <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed text-sm md:text-base">{previewSource.content}</pre>
                                    </div>
                                )}
                                {previewSource.type === 'image' && previewSource.previewUrl && <img src={previewSource.previewUrl} alt={previewSource.title} className="max-w-full max-h-[60vh] object-contain rounded-3xl shadow-2xl border-[12px] border-white" />}
                                {previewSource.type === 'video' && <div className="w-full max-w-3xl bg-black rounded-[2.5rem] overflow-hidden shadow-2xl ring-8 ring-white">{previewSource.previewUrl?.includes('blob:') ? <video src={previewSource.previewUrl} controls className="w-full aspect-video" /> : <div className="p-20 text-center"><Video size={64} className="text-purple-400 mx-auto mb-8" /><a href={previewSource.url} target="_blank" className="px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider">Ver Video en YouTube</a></div>}</div>}
                                {previewSource.type === 'url' && <div className="bg-white p-14 rounded-[3rem] shadow-xl border border-gray-100 max-w-2xl w-full text-center"><Globe size={56} className="text-blue-600 mx-auto mb-8" /><h4 className="text-2xl font-black text-gray-900 mb-2">Contenido Web</h4><p className="text-gray-400 mb-12 text-sm font-bold break-all px-6">{previewSource.url}</p><a href={previewSource.url} target="_blank" className="w-full max-w-xs mx-auto py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg">Visitar enlace original</a></div>}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SourcePanel;
