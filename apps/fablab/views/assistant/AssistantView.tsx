import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, ArrowLeft, Edit2, Globe, Lock, Calendar, User, MessageSquare, Zap } from 'lucide-react';
import { getTool } from '@core/creation-tools/creation-tools.service';
import type { CreationTool } from '@core/creation-tools/creation-tools.types';

const AssistantView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [assistant, setAssistant] = useState<CreationTool | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAssistant = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await getTool(parseInt(id));
        
        if (data.type !== 'assistant') {
          setError('El recurso solicitado no es un asistente.');
          return;
        }
        
        setAssistant(data);
      } catch (err) {
        console.error('Error cargando asistente:', err);
        setError('No se pudo cargar el asistente.');
      } finally {
        setLoading(false);
      }
    };

    loadAssistant();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-900 dark:to-indigo-900/10 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando asistente...</p>
        </div>
      </div>
    );
  }

  if (error || !assistant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-900 dark:to-indigo-900/10 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen size={32} className="text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Asistente no disponible
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || 'No se encontró el asistente solicitado.'}
          </p>
          <button
            onClick={() => navigate('/library')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all"
          >
            <ArrowLeft size={20} />
            Volver a Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-900 dark:to-indigo-900/10">
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
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <BookOpen size={24} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {assistant.title}
                  </h1>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                    assistant.hasPublicStatus 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    {assistant.hasPublicStatus ? <><Globe size={12} /> Público</> : <><Lock size={12} /> Privado</>}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Vista privada
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/library`)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 border-2 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 rounded-xl font-semibold transition-all"
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
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/10 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <User size={16} />
                <span className="font-semibold">Autor:</span>
                <span>AI Maker</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Calendar size={16} />
                <span className="font-semibold">Idioma:</span>
                <span className="uppercase">{assistant.language}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <BookOpen size={16} />
                <span className="font-semibold">ID:</span>
                <span>#{assistant.id}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <BookOpen size={20} />
                Descripción del Asistente
              </h2>
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {assistant.description || 'Sin descripción disponible.'}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 dark:border-gray-700"></div>

            {/* Capacidades */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Zap size={20} />
                Capacidades
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                  <div className="flex items-start gap-3">
                    <MessageSquare size={20} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm">
                        Conversación Natural
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Interacción fluida y contextual con el usuario
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                  <div className="flex items-start gap-3">
                    <Zap size={20} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm">
                        Respuestas Personalizadas
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Adaptado a tus necesidades específicas
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 dark:border-gray-700"></div>

            {/* Info box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <BookOpen size={20} className="text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">
                    Vista de Asistente
                  </h3>
                  <p className="text-sm text-blue-800 dark:text-blue-400">
                    Este es tu asistente configurado. Puedes editarlo desde la biblioteca o compartirlo si es público.
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

export default AssistantView;
