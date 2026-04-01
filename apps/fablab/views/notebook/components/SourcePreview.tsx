import React, { useEffect, useState } from 'react';
import {
    AlignLeft,
    Download,
    ExternalLink,
    FileText,
    Globe,
    ImageIcon,
    Languages,
    Link2,
    Video,
    X,
} from 'lucide-react';

import { Source } from '../types.ts';
import type { Translations } from '../../../language/locales/types';
import { downloadStreamAsFile } from '../services/windowService';

interface SourcePreviewProps {
    isOpen: boolean;
    source: Source | null;
    onClose: () => void;
    tp: Translations['notebook']['sourcePanel'];
}

const openSourceFilePathUrl = (link?: string) => {
    if (!link) return;
    const base = import.meta.env.VITE_API_URL || window.location.origin;
    const normalized = /^(https?:\/\/|blob:|data:)/i.test(link) ? link : new URL(link, base).toString();
    window.open(normalized, '_blank', 'noopener,noreferrer');
};

const getPreviewLink = (previewSource?: Source | null) => previewSource?.previewUrl || previewSource?.url;
const getUrlLink = (previewSource?: Source | null) => previewSource?.url;
const getContentLink = (previewSource?: Source | null) => {
    const raw = String(previewSource?.content || '').trim();
    if (!raw) return undefined;
    return /^(https?:\/\/|blob:|data:|\/)/i.test(raw) ? raw : undefined;
};

const getConfigFilename = (source: Source) => {
    const baseName = source.title || 'config';
    const link = getPreviewLink(source) || getUrlLink(source);
    const allowedExt = ['json', 'yaml', 'yml', 'env', 'ini'];
    const extMatch = link?.split('?')[0]?.split('/')?.pop()?.match(/\.([^.]+)$/);
    const rawExt = extMatch?.[1]?.toLowerCase();
    const ext = rawExt && allowedExt.includes(rawExt) ? rawExt : 'config';
    return baseName.toLowerCase().endsWith(`.${ext}`) ? baseName : `${baseName}.${ext}`;
};

const extractFilenameFromLink = (link?: string) => {
    const raw = link?.split('?')[0]?.split('/')?.pop();
    return raw ? decodeURIComponent(raw) : undefined;
};

const isBlobLink = (link?: string | null) => Boolean(link?.startsWith('blob:'));

const getCodeFilename = (source: Source) => {
    const linkName = extractFilenameFromLink(getPreviewLink(source) || getUrlLink(source));
    if (linkName && linkName.includes('.')) return linkName;

    if (source.title && source.title.includes('.')) return source.title;

    return `${source.title || 'code'}.txt`;
};

const getDocumentDownloadFilename = (source: Source, link?: string) => {
    const linkName = extractFilenameFromLink(link || getPreviewLink(source) || getUrlLink(source));
    if (linkName && linkName.includes('.')) return linkName;

    if (source.title && source.title.includes('.')) return source.title;

    const defaultExt = source.type === 'html' ? '.html' : '.pdf';
    const baseName = source.title || (source.type === 'html' ? 'page' : 'document');
    return baseName.endsWith(defaultExt) ? baseName : `${baseName}${defaultExt}`;
};

const createObjectUrl = (blob: Blob) => URL.createObjectURL(blob);

const revokeObjectUrlLater = (url: string, delayMs = 30_000) => {
    setTimeout(() => {
        try { URL.revokeObjectURL(url); } catch { /* noop */ }
    }, delayMs);
};

const downloadBlob = (filename: string, blob: Blob) => {
    const url = createObjectUrl(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    revokeObjectUrlLater(url, 500);
};

const openBlobInNewTab = (blob: Blob) => {
    const url = createObjectUrl(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
    revokeObjectUrlLater(url);
};

const downloadTextFile = (filename: string, content: string) => {
    const blob = new Blob([content ?? ''], { type: 'text/plain;charset=utf-8' });
    downloadBlob(filename, blob);
};

const openTextFileInNewTab = (content: string) => {
    const blob = new Blob([content ?? ''], { type: 'text/plain;charset=utf-8' });
    openBlobInNewTab(blob);
};

const downloadFileFromUrl = async (url: string, filename: string) => {
    try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const normalizedUrl = /^(https?:\/\/|blob:|data:)/i.test(url) ? url : new URL(url, apiUrl || window.location.origin).toString();
        const proxyUrl = `${apiUrl}/api/v1/notebook-modules/download-file?url=${encodeURIComponent(normalizedUrl)}&filename=${encodeURIComponent(filename)}`;
        const token = localStorage.getItem('aimaker_jwt_token') || '';
        const response = await fetch(proxyUrl, {
            credentials: 'include',
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error(`Download failed: ${response.status}`);
        await downloadStreamAsFile(response, filename);
    } catch (err) {
        console.error('[SourcePreview] Error downloading file:', err);
        openSourceFilePathUrl(url);
    }
};

const SourcePreview: React.FC<SourcePreviewProps> = ({ isOpen, source, onClose, tp }) => {
    const [videoPreviewError, setVideoPreviewError] = useState(false);

    useEffect(() => {
        setVideoPreviewError(false);
    }, [source]);

    if (!isOpen || !source) return null;

    const previewLink = getPreviewLink(source);
    const urlLink = getUrlLink(source);
    const contentLink = getContentLink(source);
    const htmlContent = source.type === 'html' && /<[^>]+>/.test(String(source.content || ''))
        ? String(source.content)
        : '';
    const primaryLink = previewLink || urlLink || contentLink;
    const documentFilename = getDocumentDownloadFilename(source, primaryLink);
    const hasLink = Boolean(primaryLink);
    const canOpen = hasLink || source.type === 'text' || source.type === 'config' || source.type === 'code' || Boolean(htmlContent);
    const canDownload = hasLink || source.type === 'text' || source.type === 'config' || source.type === 'code' || (source.type === 'html' && Boolean(htmlContent));
    const displayType = source.backendType || source.type;

    const handleOpenPrimary = () => {
        if (primaryLink) return openSourceFilePathUrl(primaryLink);
        if (source.type === 'html' && htmlContent) return openBlobInNewTab(new Blob([htmlContent], { type: 'text/html;charset=utf-8' }));
        if (source.type === 'text') return openTextFileInNewTab(source.content || '');
        if (source.type === 'config') return openTextFileInNewTab(source.content || '');
        if (source.type === 'code') return openTextFileInNewTab(source.content || '');
    };

    const handleDownload = () => {
        if (source.type === 'text') {
            return downloadTextFile(`${source.title || 'text'}.txt`, source.content || '');
        }
        if (source.type === 'config') {
            const filename = getConfigFilename(source);
            if (previewLink) return downloadFileFromUrl(previewLink, filename);
            return downloadTextFile(filename, source.content || '');
        }
        if (source.type === 'code') {
            const filename = getCodeFilename(source);
            if (previewLink && !isBlobLink(previewLink)) return downloadFileFromUrl(previewLink, filename);
            if (urlLink && !isBlobLink(urlLink)) return downloadFileFromUrl(urlLink, filename);
            return downloadTextFile(filename, source.content || '');
        }
        if (source.type === 'pdf' || source.type === 'html' || source.type === 'image' || source.type === 'video' || source.type === 'translation') {
            if (primaryLink) return downloadFileFromUrl(primaryLink, documentFilename);
            if (source.type === 'html' && htmlContent) return downloadTextFile(documentFilename, htmlContent);
        }
        if (source.type === 'url' && primaryLink) {
            return openSourceFilePathUrl(primaryLink);
        }
    };

    return (
        <div className="fixed inset-0 z-[1000] bg-gray-900/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 max-h-[92vh]">
                <div className="px-8 py-6 border-b border-gray-100 flex items-start justify-between bg-white shrink-0 gap-4 flex-wrap md:flex-nowrap">
                    <div className="flex items-center gap-4 min-w-0 flex-wrap">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shrink-0">
                            {source.type === 'image' && <ImageIcon size={22} />}
                            {source.type === 'video' && <Video size={22} />}
                            {source.type === 'pdf' && <FileText size={22} />}
                            {source.type === 'html' && <Globe size={22} />}
                            {source.type === 'url' && <Link2 size={22} />}
                            {source.type === 'text' && <AlignLeft size={22} />}
                            {source.type === 'config' && <FileText size={22} />}
                        </div>
                        <div className="min-w-0 flex flex-col gap-1">
                            <div className="flex items-center gap-3 min-w-0 flex-wrap">
                                <h3 className="font-black text-gray-900 text-lg leading-snug line-clamp-3 break-words whitespace-normal">{source.title}</h3>
                                <span className="text-[10px] font-black px-2 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200 whitespace-nowrap">{displayType}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 bg-gray-50 hover:bg-red-50 hover:text-red-500 rounded-2xl text-gray-400 transition-all border border-gray-100 shrink-0" aria-label={tp.modal.title}>
                        <X size={20} />
                    </button>
                </div>
                <div className="flex-1 bg-gray-50 overflow-y-auto no-scrollbar">
                    <div className="sticky top-0 z-10 border-b border-gray-100 bg-white/95 backdrop-blur px-8 py-4 flex flex-col gap-3">
                        <div className="flex flex-col gap-2 w-full">
                            <button
                                onClick={handleOpenPrimary}
                                disabled={!canOpen}
                                className={`w-full flex flex-wrap items-center gap-2 px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-md transition-all text-left ${
                                    canOpen ? 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700 active:scale-95' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                <ExternalLink size={16} /> {tp.preview.openNewTab}
                            </button>
                            <button
                                onClick={handleDownload}
                                disabled={!canDownload}
                                className={`w-full flex flex-wrap items-center gap-2 px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-all text-left ${
                                    canDownload
                                        ? 'bg-white text-indigo-600 border-indigo-200 hover:border-indigo-400'
                                        : 'bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed'
                                }`}
                            >
                                <Download size={16} /> {tp.preview.downloadFile}
                            </button>
                        </div>
                    </div>
                    <div className="p-8 md:p-12">
                        <div className="w-full h-full flex items-center justify-center">
                            {source.type === 'pdf' && (
                                <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100 w-full max-w-4xl">
                                    {primaryLink ? (
                                        <iframe title="pdf-preview" src={primaryLink} className="w-full h-[60vh] rounded-xl border border-gray-200" />
                                    ) : (
                                        <div className="text-center py-16">
                                            <FileText size={56} className="mx-auto mb-8 text-red-500" />
                                            <h4 className="text-2xl font-black text-gray-900 mb-2">{tp.preview.document}</h4>
                                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">{tp.preview.ragHint}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                            {source.type === 'html' && (
                                <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100 w-full max-w-5xl">
                                    {primaryLink ? (
                                        <iframe title="html-preview" src={primaryLink} className="w-full h-[62vh] rounded-xl border border-gray-200 bg-white" />
                                    ) : htmlContent ? (
                                        <iframe title="html-srcdoc-preview" srcDoc={htmlContent} className="w-full h-[62vh] rounded-xl border border-gray-200 bg-white" />
                                    ) : (
                                        <div className="text-center py-16">
                                            <Globe size={56} className="mx-auto mb-8 text-blue-600" />
                                            <h4 className="text-2xl font-black text-gray-900 mb-2">{tp.preview.htmlDocument}</h4>
                                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">{tp.preview.ragHint}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                            {source.type === 'text' && (
                                <div className="w-full max-w-3xl bg-white p-10 md:p-14 rounded-[2.5rem] shadow-sm border border-gray-100">
                                    <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed text-sm md:text-base mb-6">{source.content}</pre>
                                </div>
                            )}
                            {source.type === 'config' && (
                                <div className="w-full max-w-3xl bg-white p-10 md:p-14 rounded-[2.5rem] shadow-sm border border-gray-100">
                                    <pre className="whitespace-pre-wrap font-mono text-gray-700 leading-relaxed text-xs md:text-sm mb-6">{source.content}</pre>
                                </div>
                            )}
                            {source.type === 'code' && (
                                <div className="w-full max-w-3xl bg-white p-10 md:p-14 rounded-[2.5rem] shadow-sm border border-gray-100">
                                    <pre className="whitespace-pre-wrap font-mono text-gray-800 leading-relaxed text-xs md:text-sm mb-6">{source.content}</pre>
                                </div>
                            )}
                            {source.type === 'image' && primaryLink && (
                                <div className="flex flex-col items-center gap-5">
                                    <img
                                        src={primaryLink}
                                        alt={source.title}
                                        className="max-w-full max-h-[60vh] object-contain rounded-3xl shadow-2xl border-[12px] border-white"
                                    />
                                </div>
                            )}
                            {source.type === 'video' && (
                                <div className="w-full max-w-3xl bg-black rounded-[2.5rem] overflow-hidden shadow-2xl ring-8 ring-white">
                                    {primaryLink && !videoPreviewError ? (
                                        <div className="w-full">
                                            <video
                                                src={primaryLink}
                                                controls
                                                className="w-full aspect-video"
                                                onError={() => setVideoPreviewError(true)}
                                            />
                                        </div>
                                    ) : (
                                        <div className="p-20 text-center bg-white">
                                            <Video size={64} className="text-purple-400 mx-auto mb-8" />
                                        </div>
                                    )}
                                </div>
                            )}
                            {source.type === 'url' && (
                                <div className="bg-white p-14 rounded-[3rem] shadow-xl border border-gray-100 max-w-2xl w-full text-center">
                                    <Globe size={56} className="text-blue-600 mx-auto mb-8" />
                                    <h4 className="text-2xl font-black text-gray-900 mb-2">{tp.preview.htmlDocument}</h4>
                                    <p className="text-gray-400 mb-12 text-[10px] font-bold uppercase tracking-widest">{tp.preview.ragHint}</p>
                                </div>
                            )}
                            {source.type === 'translation' && (
                                <div className="bg-white p-14 rounded-[3rem] shadow-xl border border-gray-100 max-w-2xl w-full text-center">
                                    <Languages size={56} className="text-indigo-600 mx-auto mb-8" />
                                    <h4 className="text-2xl font-black text-gray-900 mb-2">{tp.modal.tabs.translation}</h4>
                                    <p className="text-gray-400 mb-12 text-[10px] font-bold uppercase tracking-widest">{tp.modal.placeholders.translationDesc}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SourcePreview;