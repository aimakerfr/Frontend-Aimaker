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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header with clean design */}
      <div className="bg-white dark:bg-gray-800 border-b-2 border-blue-200 dark:border-blue-900 shadow-sm">
        <div className="max-w-6xl mx-auto px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-600 dark:bg-blue-700 rounded-lg flex items-center justify-center shadow-md border-2 border-blue-700 dark:border-blue-600">
              <FileText size={28} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {prompt.title}
                </h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-md text-xs font-semibold border-2 border-green-700">
                  <Globe size={12} />
                  {tp.publicView}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {tp.readOnly}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-8 py-10">
        {/* Meta Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 border-blue-200 dark:border-blue-900 overflow-hidden mb-8">
          <div className="bg-blue-50 dark:bg-blue-950 border-b-2 border-blue-200 dark:border-blue-900 px-8 py-5">
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2.5 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600">
                <User size={18} className="text-blue-600 dark:text-blue-400" />
                <span className="font-semibold">{tp.author}:</span>
                <span className="font-medium">{prompt.authorName || 'Usuario'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600">
                <Calendar size={18} className="text-blue-600 dark:text-blue-400" />
                <span className="font-semibold">{tp.language}:</span>
                <span className="font-medium uppercase">{prompt.language}</span>
              </div>
              <div className="flex items-center gap-2.5 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600">
                <FileText size={18} className="text-blue-600 dark:text-blue-400" />
                <span className="font-semibold">{tp.type}:</span>
                <span className="font-medium">Prompt</span>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* Description */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {tp.descriptionTitle}
                </h2>
              </div>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base bg-blue-50 dark:bg-blue-950 p-6 rounded-lg border-l-4 border-blue-500 dark:border-blue-600">
                {prompt.description || tp.noDescription}
              </p>
            </div>

            {/* Divider with gradient */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white dark:bg-gray-800 px-4 text-xs text-gray-500 uppercase tracking-wider">Content</span>
              </div>
            </div>

            {/* Prompt Content */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {tp.contentTitle}
                </h2>
                {promptContent && (
                  <button
                    onClick={() => copyToClipboard(promptContent, 'prompt')}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all"
                  >
                    {copiedField === 'prompt' ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>¡Copiado!</span>
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
                <div className="bg-blue-50 dark:bg-blue-950 border-2 border-blue-200 dark:border-blue-900 rounded-lg p-8">
                  <pre className="whitespace-pre-wrap break-words text-gray-800 dark:text-gray-200 leading-relaxed font-mono text-sm overflow-x-auto">
{promptContent}
                  </pre>
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
                  <FileText size={48} className="mx-auto text-gray-400 dark:text-gray-600 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 italic text-sm">
                    {tp.noContent}
                  </p>
                </div>
              )}
            </div>

            {/* Optional Context Field */}
            {promptContext && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Contexto Adicional
                  </h2>
                  <button
                    onClick={() => copyToClipboard(promptContext, 'context')}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all"
                  >
                    {copiedField === 'context' ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-green-50 dark:bg-green-950 border-2 border-green-200 dark:border-green-900 rounded-lg p-8">
                  <pre className="whitespace-pre-wrap break-words text-gray-800 dark:text-gray-200 leading-relaxed font-mono text-sm overflow-x-auto">
{promptContext}
                  </pre>
                </div>
              </div>
            )}

            {/* Optional Output Format Field */}
            {promptOutputFormat && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Formato de Salida
                  </h2>
                  <button
                    onClick={() => copyToClipboard(promptOutputFormat, 'outputFormat')}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all"
                  >
                    {copiedField === 'outputFormat' ? (
                      <>
                        <Check className="w-4 h-4" />
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
                <div className="bg-purple-50 dark:bg-purple-950 border-2 border-purple-200 dark:border-purple-900 rounded-lg p-8">
                  <pre className="whitespace-pre-wrap break-words text-gray-800 dark:text-gray-200 leading-relaxed font-mono text-sm overflow-x-auto">
{promptOutputFormat}
                  </pre>
                </div>
              </div>
            )}

            {/* Enhanced Info Box */}
            <div className="relative mt-10">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur-2xl"></div>
              <div className="relative bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 border-2 border-blue-200/50 dark:border-blue-800/50 rounded-2xl p-6 shadow-lg backdrop-blur-sm">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                      <FileText size={24} className="text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 mb-2">
                      {tp.infoTitle}
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {tp.infoDesc}
                    </p>
                  </div>
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
