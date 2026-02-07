import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FileText, Globe, Calendar, User, ChevronLeft, Copy, Check } from 'lucide-react';
import { getPublicCreationTool } from '@core/creation-tools/creation-tools.service';
import type { CreationTool } from '@core/creation-tools/creation-tools.types';
import { httpClient } from '@core/api/http.client';
import { useLanguage } from '../../language/useLanguage';

const PublicPrompt: React.FC = () => {
  const { t } = useLanguage();
  const tp = t.publicPrompt;
  const { id } = useParams<{ id: string }>();
  const [prompt, setPrompt] = useState<CreationTool | null>(null);
  const [promptContent, setPromptContent] = useState<string>('');
  const [promptContext, setPromptContext] = useState<string>('');
  const [promptOutputFormat, setPromptOutputFormat] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  useEffect(() => {
    const loadPrompt = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await getPublicCreationTool(parseInt(id));
        
        // Verificar que sea público
        if (!data.hasPublicStatus) {
          setError(tp.errorPrivate);
          return;
        }
        
        // Verificar que sea tipo prompt
        if (data.type !== 'prompt') {
          setError(tp.errorNotPrompt);
          return;
        }
        
        setPrompt(data);
        
        // Cargar el contenido del prompt desde la tabla prompts
        try {
          const promptData = await httpClient.get<{ prompt: string; context?: string; outputFormat?: string }>(
            `/api/v1/tools/${id}/prompt`,
            { requiresAuth: false }
          );
          setPromptContent(promptData.prompt || '');
          setPromptContext(promptData.context || '');
          setPromptOutputFormat(promptData.outputFormat || '');
        } catch (promptErr) {
          console.error('Error cargando contenido del prompt:', promptErr);
          // No es error crítico, puede no tener contenido aún
        }
      } catch (err) {
        console.error('Error cargando prompt:', err);
        setError(tp.errorLoading);
      } finally {
        setLoading(false);
      }
    };

    loadPrompt();
  }, [id, tp.errorPrivate, tp.errorNotPrompt, tp.errorLoading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-purple-900/10 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">{tp.loading}</p>
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
            {tp.infoTitle}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || tp.errorNotFound}
          </p>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-all"
          >
            <ChevronLeft size={20} />
            {tp.back}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-purple-900/10">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
              <FileText size={24} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {prompt.title}
                </h1>
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-semibold">
                  <Globe size={12} />
                  {tp.publicView}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {tp.publicView} - {tp.readOnly}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Meta información */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/10 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <User size={16} />
                <span className="font-semibold">{tp.author}:</span>
                <span>{prompt.authorName || 'Usuario'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Calendar size={16} />
                <span className="font-semibold">{tp.language}:</span>
                <span className="uppercase">{prompt.language}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <FileText size={16} />
                <span className="font-semibold">{tp.type}:</span>
                <span>Prompt</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Description */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                {tp.descriptionTitle}
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {prompt.description || tp.noDescription}
              </p>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 dark:border-gray-700"></div>

            {/* Prompt Content */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {tp.contentTitle}
                </h2>
                {promptContent && (
                  <button
                    onClick={() => copyToClipboard(promptContent, 'prompt')}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {copiedField === 'prompt' ? (
                      <>
                        <Check className="w-4 h-4 text-green-600" />
                        <span>Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              {promptContent ? (
                <div className="bg-slate-50 dark:bg-gray-900/50 border border-slate-200 dark:border-gray-700 rounded-xl p-6">
                  <pre className="whitespace-pre-wrap break-words text-gray-700 dark:text-gray-300 leading-relaxed font-mono text-sm overflow-x-auto">
{promptContent}
                  </pre>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 italic">
                  {tp.noContent}
                </p>
              )}
            </div>

            {/* Optional Context Field */}
            {promptContext && (
              <>
                <div className="border-t border-gray-200 dark:border-gray-700"></div>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                      Contexto Adicional
                    </h2>
                    <button
                      onClick={() => copyToClipboard(promptContext, 'context')}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      {copiedField === 'context' ? (
                        <>
                          <Check className="w-4 h-4 text-green-600" />
                          <span>Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="bg-slate-50 dark:bg-gray-900/50 border border-slate-200 dark:border-gray-700 rounded-xl p-6">
                    <pre className="whitespace-pre-wrap break-words text-gray-700 dark:text-gray-300 leading-relaxed font-mono text-sm overflow-x-auto">
{promptContext}
                    </pre>
                  </div>
                </div>
              </>
            )}

            {/* Optional Output Format Field */}
            {promptOutputFormat && (
              <>
                <div className="border-t border-gray-200 dark:border-gray-700"></div>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                      Formato de Salida
                    </h2>
                    <button
                      onClick={() => copyToClipboard(promptOutputFormat, 'outputFormat')}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      {copiedField === 'outputFormat' ? (
                        <>
                          <Check className="w-4 h-4 text-green-600" />
                          <span>Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="bg-slate-50 dark:bg-gray-900/50 border border-slate-200 dark:border-gray-700 rounded-xl p-6">
                    <pre className="whitespace-pre-wrap break-words text-gray-700 dark:text-gray-300 leading-relaxed font-mono text-sm overflow-x-auto">
{promptOutputFormat}
                    </pre>
                  </div>
                </div>
              </>
            )}

            {/* Divider */}
            <div className="border-t border-gray-200 dark:border-gray-700"></div>

            {/* Info box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <FileText size={20} className="text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">
                    {tp.infoTitle}
                  </h3>
                  <p className="text-sm text-blue-800 dark:text-blue-400">
                    {tp.infoDesc}
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

export default PublicPrompt;
