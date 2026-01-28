import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BookOpen, Globe, Calendar, User, ChevronLeft, MessageSquare } from 'lucide-react';
import { getPublicCreationTool } from '@core/creation-tools/creation-tools.service';
import type { CreationTool } from '@core/creation-tools/creation-tools.types';

const PublicAssistant: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [assistant, setAssistant] = useState<CreationTool | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAssistant = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await getPublicCreationTool(parseInt(id));
        
        // Verificar que sea público
        if (!data.hasPublicStatus) {
          setError('Este asistente es privado y no está disponible públicamente.');
          return;
        }
        
        // Verificar que sea tipo assistant
        if (data.type !== 'assistant') {
          setError('El recurso solicitado no es un asistente.');
          return;
        }
        
        setAssistant(data);
      } catch (err) {
        console.error('Error cargando asistente:', err);
        setError('No se pudo cargar el asistente. Puede que no exista o no sea público.');
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
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all"
          >
            <ChevronLeft size={20} />
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-900 dark:to-indigo-900/10">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <BookOpen size={24} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {assistant.title}
                </h1>
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-semibold">
                  <Globe size={12} />
                  Público
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Vista pública - Solo lectura
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Meta información */}
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/10 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <User size={16} />
                <span className="font-semibold">Autor:</span>
                <span>{assistant.authorName || 'Usuario'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Calendar size={16} />
                <span className="font-semibold">Idioma:</span>
                <span className="uppercase">{assistant.language}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <BookOpen size={16} />
                <span className="font-semibold">Tipo:</span>
                <span>Asistente</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                Descripción
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {assistant.description || 'Sin descripción disponible.'}
              </p>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 dark:border-gray-700"></div>

            {/* Capacidades del asistente */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <MessageSquare size={20} />
                Capacidades
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-4 bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm">
                    Conversación Natural
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Interacción fluida y contextual
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm">
                    Respuestas Personalizadas
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Adaptado a tus necesidades
                  </p>
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
                    Vista pública de asistente
                  </h3>
                  <p className="text-sm text-blue-800 dark:text-blue-400">
                    Esta es una vista de solo lectura del asistente. Para interactuar con él o modificarlo, inicia sesión en la plataforma.
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

export default PublicAssistant;
