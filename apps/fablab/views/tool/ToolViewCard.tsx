import React, { useEffect, useState } from 'react';
import { CheckCircle, Copy, ExternalLink, Globe, Lock, Heart, FileText, ArrowLeft } from 'lucide-react';
import { getTool, toggleToolFavorite, toggleToolVisibility } from '@core/creation-tools/creation-tools.service';
import type { CreationTool } from '@core/creation-tools/creation-tools.types';
import { copyToClipboard } from '@core/ui_utils/navigator_utilies';
import { useNavigate } from 'react-router-dom';

type ToolViewCardProps = {
  headerLeft?: React.ReactNode;
  headerRight?: React.ReactNode;
  headerBelow?: React.ReactNode;
  blurred?: boolean;
  className?: string;
  children?: React.ReactNode;
  // New consolidated props to render common sections so views stay focused on logic
  saveProps?: {
    onSave: () => void;
    isSaving?: boolean;
    label?: string;
  };
  urlsProps?: {
    privateUrl: string;
    publicUrl?: string;
    isPublic: boolean;
    copiedPrivate?: boolean;
    copiedPublic?: boolean;
    onCopyPrivate: () => void;
    onCopyPublic: () => void;
    onOpenPrivate: () => void;
    onOpenPublic: () => void;
  };
  // Optional: make the card self-sufficient for URL section if a tool id is provided
  toolId?: number | null;
};

/**
 * Generic card layout for Tool views.
 * - Places a header with left/right areas (flex on large screens).
 * - Renders children inside the card body (simpler than passing a component).
 */
const ToolViewCard: React.FC<ToolViewCardProps> = ({
  headerLeft,
  headerRight,
  headerBelow,
  blurred = false,
  className = '',
  children,
  saveProps,
  urlsProps,
  toolId,
}) => {
  const navigate = useNavigate();
  // If toolId is provided, fetch tool data to build URLs section internally
  const [tool, setTool] = useState<CreationTool | null>(null);
  const [copiedPrivate, setCopiedPrivate] = useState(false);
  const [copiedPublic, setCopiedPublic] = useState(false);
  const [togglingVisibility, setTogglingVisibility] = useState(false);
  const [togglingFavorite, setTogglingFavorite] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!toolId && toolId !== 0) return;
      try {
        const data = await getTool(Number(toolId));
        if (!cancelled) setTool(data);
      } catch (e) {
        // ignore; parent screens may handle errors separately
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [toolId]);

  const isPublic = tool?.hasPublicStatus ?? false;
  const privateUrl = tool?.url || '';
  const publicUrl = tool?.publicUrl || '';
  const isFavorite = tool?.isFavorite ?? false;

  const handleCopy = async (text: string, type: 'private' | 'public') => {
    const ok = await copyToClipboard(text);
    if (!ok) return;
    if (type === 'private') {
      setCopiedPrivate(true);
      setTimeout(() => setCopiedPrivate(false), 2000);
    } else {
      setCopiedPublic(true);
      setTimeout(() => setCopiedPublic(false), 2000);
    }
  };

  // Build save section if props provided
  const internalSaveSection = saveProps ? (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-slate-100">
      <div className="flex items-center gap-3">
        {/* PUBLICAR */}

        {/* FAV */}
        {tool && (
          <button
            type="button"
            onClick={async () => {
              if (!toolId || togglingFavorite) return;
              try {
                setTogglingFavorite(true);
                const res = await toggleToolFavorite(Number(toolId));
                setTool(prev => (prev ? { ...prev, isFavorite: res.isFavorite } as CreationTool : prev));
              } finally {
                setTogglingFavorite(false);
              }
            }}
            disabled={togglingFavorite}
            className={`flex items-center justify-center w-[46px] h-[42px] border rounded-xl transition-all shadow-sm ${
              isFavorite ? 'bg-red-50 border-red-200 text-red-500' : 'bg-white border-slate-200 text-slate-300 hover:text-slate-400'
            } disabled:opacity-50`}
            title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
        )}
        {tool && (
            <button
                type="button"
                onClick={async () => {
                  if (!toolId || togglingVisibility) return;
                  try {
                    setTogglingVisibility(true);
                    const updated = await toggleToolVisibility(Number(toolId), !isPublic);
                    setTool(updated);
                  } finally {
                    setTogglingVisibility(false);
                  }
                }}
                disabled={togglingVisibility}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl hover:border-blue-300 transition-all shadow-sm h-[42px] text-slate-600 disabled:opacity-50"
                title={isPublic ? 'Publié' : 'Publier'}
            >
              {isPublic ? <Globe size={16} className="text-blue-500" /> : <Lock size={16} className="text-slate-400" />}
              <span className="text-sm font-semibold">{isPublic ? 'Publié' : 'Publier'}</span>
            </button>
        )}
        {/* GUARDAR CAMBIOS */}
        <button
          onClick={saveProps.onSave}
          disabled={!!saveProps.isSaving}
          className="bg-[#3b82f6] hover:bg-blue-600 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          type="button"
        >
          {saveProps.isSaving ? 'Enregistrement...' : (saveProps.label || 'Enregistrer les modifications')}
        </button>
      </div>
    </div>
  ) : null;

  // Internal default title section (moved from PromptView)
  const internalTitleSection = (
    <div className="flex items-center gap-4 mb-8">
      <button
        onClick={() => navigate('/dashboard/library')}
        className="text-slate-400 hover:text-slate-600 transition-colors"
        type="button"
      >
        <ArrowLeft size={20} />
      </button>
      <div className="bg-[#3b82f6] w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
        <FileText size={20} />
      </div>
      <div>
        <h1 className="text-xl font-bold text-slate-900 leading-tight">Configuration du prompt</h1>
        <p className="text-sm text-slate-500">Gérez les détails de votre prompt</p>
      </div>
    </div>
  );

  // Build urls section if props provided
  const internalUrlsSection = urlsProps ? (
    <div className="space-y-4 bg-gray-50 p-6 rounded-xl border border-gray-200 overflow-hidden">
      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">URLs de la ressource</h3>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-2">URL PRIVÉE (Connexion requise)</label>
        <div className="flex flex-wrap items-stretch gap-2 min-w-0">
          <input
            type="text"
            value={urlsProps.privateUrl}
            readOnly
            className="flex-1 min-w-0 w-0 px-4 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 text-sm truncate"
          />
          <button
            type="button"
            onClick={urlsProps.onCopyPrivate}
            disabled={!urlsProps.privateUrl}
            className="shrink-0 px-4 py-2 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 text-blue-700 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {urlsProps.copiedPrivate ? <CheckCircle size={18} /> : <Copy size={18} />}
          </button>
          <button
            type="button"
            onClick={urlsProps.onOpenPrivate}
            disabled={!urlsProps.privateUrl}
            className="shrink-0 px-4 py-2 bg-purple-50 hover:bg-purple-100 border-2 border-purple-200 text-purple-700 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ExternalLink size={18} />
          </button>
        </div>
      </div>

      {urlsProps.isPublic && (
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-2">URL PUBLIQUE (Sans connexion)</label>
          <div className="flex flex-wrap items-stretch gap-2 min-w-0">
            <input
              type="text"
              value={urlsProps.publicUrl || ''}
              readOnly
              className="flex-1 min-w-0 w-0 px-4 py-2 rounded-lg bg-green-50 text-gray-900 border border-green-300 text-sm truncate"
            />
            <button
              type="button"
              onClick={urlsProps.onCopyPublic}
              disabled={!urlsProps.publicUrl}
              className="shrink-0 px-4 py-2 bg-green-100 hover:bg-green-200 border-2 border-green-300 text-green-700 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {urlsProps.copiedPublic ? <CheckCircle size={18} /> : <Copy size={18} />}
            </button>
            <button
              type="button"
              onClick={urlsProps.onOpenPublic}
              disabled={!urlsProps.publicUrl}
              className="shrink-0 px-4 py-2 bg-green-100 hover:bg-green-200 border-2 border-green-300 text-green-700 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ExternalLink size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  ) : tool ? (
    <div className="space-y-4 bg-gray-50 p-6 rounded-xl border border-gray-200 overflow-hidden">
      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">URLs de la ressource</h3>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-2">URL PRIVÉE (Connexion requise)</label>
        <div className="flex flex-wrap items-stretch gap-2 min-w-0">
          <input
            type="text"
            value={privateUrl}
            readOnly
            className="flex-1 min-w-0 w-0 px-4 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 text-sm truncate"
          />
          <button
            type="button"
            onClick={() => handleCopy(privateUrl, 'private')}
            disabled={!privateUrl}
            className="shrink-0 px-4 py-2 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 text-blue-700 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {copiedPrivate ? <CheckCircle size={18} /> : <Copy size={18} />}
          </button>
          <button
            type="button"
            onClick={() => privateUrl && window.open(privateUrl, '_blank')}
            disabled={!privateUrl}
            className="shrink-0 px-4 py-2 bg-purple-50 hover:bg-purple-100 border-2 border-purple-200 text-purple-700 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ExternalLink size={18} />
          </button>
        </div>
      </div>

      {isPublic && (
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-2">URL PUBLIQUE (Sans connexion)</label>
          <div className="flex flex-wrap items-stretch gap-2 min-w-0">
            <input
              type="text"
              value={publicUrl}
              readOnly
              className="flex-1 min-w-0 w-0 px-4 py-2 rounded-lg bg-green-50 text-gray-900 border border-green-300 text-sm truncate"
            />
            <button
              type="button"
              onClick={() => handleCopy(publicUrl, 'public')}
              disabled={!publicUrl}
              className="shrink-0 px-4 py-2 bg-green-100 hover:bg-green-200 border-2 border-green-300 text-green-700 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {copiedPublic ? <CheckCircle size={18} /> : <Copy size={18} />}
            </button>
            <button
              type="button"
              onClick={() => publicUrl && window.open(publicUrl, '_blank')}
              disabled={!publicUrl}
              className="shrink-0 px-4 py-2 bg-green-100 hover:bg-green-200 border-2 border-green-300 text-green-700 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ExternalLink size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  ) : null;
  return (
    <div className={`w-full max-w-[90vw] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all ${blurred ? 'blur-sm pointer-events-none' : ''} ${className}`}>
      <div className="p-6 md:p-10 space-y-8">
        {/* Header: title on the left, actions on the right. Stack on small screens. */}
        <div className="flex flex-row gap-6 lg:flex-row lg:items-start lg:justify-between">
          {/* Left (Title/Info) */}
          <div className="flex-1 min-w-0 space-y-6 overflow-hidden">
            {headerLeft ?? internalTitleSection}
            {headerBelow}
          </div>
          {headerRight}
          {internalSaveSection}
        </div>

        {/* Optional area directly under the header row (e.g., urlsSection) */}
        {(internalUrlsSection) && (
          <div className="-mt-4 lg:mt-0">
            {internalUrlsSection}
          </div>
        )}

        {/* Divider between header/wrapper and the content */}
        <div className="border-t border-slate-200" />

        {/* Content area */}
        <div className="pt-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ToolViewCard;
