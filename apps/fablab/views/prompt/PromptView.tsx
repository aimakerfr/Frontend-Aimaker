import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, ArrowLeft, Edit2, Globe, Lock, Calendar, User } from 'lucide-react';
import { getTool } from '@core/creation-tools/creation-tools.service';
import type { CreationTool } from '@core/creation-tools/creation-tools.types';

const PromptView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState<CreationTool | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPrompt = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await getTool(parseInt(id));
        
        if (data.type !== 'prompt') {
          setError('El recurso solicitado no es un prompt.');
          return;
        }
        
        setPrompt(data);
      } catch (err) {
        console.error('Error cargando prompt:', err);
        setError('No se pudo cargar el prompt.');
      } finally {
        setLoading(false);
      }
    };

    loadPrompt();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-purple-900/10 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando prompt...</p>
        </div>
      </div>
    );
  }

  if (error || !prompt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-purple-900/10 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText size={32} className="text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Prompt no disponible
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || 'No se encontró el prompt solicitado.'}
          </p>
          <button
            onClick={() => navigate('/library')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-all"
          >
            <ArrowLeft size={20} />
            Volver a Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-purple-900/10">
      {/* Header con navegación */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/library')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
              </button>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                <FileText size={24} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {prompt.title}
                  </h1>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                    prompt.hasPublicStatus 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    {prompt.hasPublicStatus ? <><Globe size={12} /> Público</> : <><Lock size={12} /> Privado</>}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Vista privada
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/library`)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 border-2 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400 rounded-xl font-semibold transition-all"
            >
              <Edit2 size={18} />
              Editar
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Meta información */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/10 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <User size={16} />
                <span className="font-semibold">Autor:</span>
                <span>AI Maker</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Calendar size={16} />
                <span className="font-semibold">Idioma:</span>
                <span className="uppercase">{prompt.language}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <FileText size={16} />
                <span className="font-semibold">ID:</span>
                <span>#{prompt.id}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <FileText size={20} />
                Descripción del Prompt
              </h2>
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {prompt.description || 'Sin descripción disponible.'}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 dark:border-gray-700"></div>

            {/* Info box */}
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <FileText size={20} className="text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-purple-900 dark:text-purple-300 mb-1">
                    Vista de Prompt
                  </h3>
                  <p className="text-sm text-purple-800 dark:text-purple-400">
                    Este es tu prompt configurado. Puedes editarlo desde la biblioteca o compartirlo si es público.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptView;
