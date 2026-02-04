import { useState, useEffect } from 'react';
import { X, Copy, Check, Sparkles, Search } from 'lucide-react';
import { getTools } from '@core/creation-tools/creation-tools.service';
import { getPromptByToolId } from '@core/prompts/prompts.service';
import type { Tool } from '@core/creation-tools/creation-tools.types';
import { useLanguage } from '../../../language/useLanguage';
import { translations } from '../../../language/translations';

interface PromptLibraryProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PromptItem {
  id: number;
  title: string;
  promptBody: string;
}

export function PromptLibrary({ isOpen, onClose }: PromptLibraryProps) {
  const { language } = useLanguage();
  const t = translations[language].moduleCreator.promptLibrary;
  
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadPrompts();
    }
  }, [isOpen]);

  const loadPrompts = async () => {
    setIsLoading(true);
    try {
      // Get all tools from the API
      const tools = await getTools();
      
      // Filter only prompts
      const promptTools = tools.filter((tool: Tool) => tool.type === 'prompt');
      
      // Get prompt details for each prompt tool
      const promptsWithDetails = await Promise.all(
        promptTools.map(async (tool: Tool) => {
          try {
            const details = await getPromptByToolId(tool.id);
            return {
              id: tool.id,
              title: tool.title,
              promptBody: details.promptBody || ''
            };
          } catch (error) {
            console.error(`Error loading prompt ${tool.id}:`, error);
            return {
              id: tool.id,
              title: tool.title,
              promptBody: ''
            };
          }
        })
      );
      
      setPrompts(promptsWithDetails);
    } catch (error) {
      console.error('Error loading prompts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (prompt: PromptItem) => {
    try {
      await navigator.clipboard.writeText(prompt.promptBody);
      setCopiedId(prompt.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const filteredPrompts = prompts.filter(prompt =>
    prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prompt.promptBody.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{t.title}</h2>
              <p className="text-sm text-slate-400">{t.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            </div>
          ) : filteredPrompts.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">
                {searchQuery ? t.noResults : t.noPrompts}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPrompts.map((prompt) => (
                <div
                  key={prompt.id}
                  className="bg-slate-800 border border-slate-700 rounded-xl p-4 hover:border-purple-500/50 transition-all"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h3 className="font-semibold text-white text-lg">{prompt.title}</h3>
                    <button
                      onClick={() => handleCopy(prompt)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                        copiedId === prompt.id
                          ? 'bg-green-600 text-white'
                          : 'bg-purple-600 hover:bg-purple-700 text-white'
                      }`}
                    >
                      {copiedId === prompt.id ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span className="text-sm font-medium">{t.copiedButton}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span className="text-sm font-medium">{t.copyButton}</span>
                        </>
                      )}
                    </button>
                  </div>
                  
                  <div className="bg-slate-900 border border-slate-600 rounded-lg p-4 max-h-40 overflow-y-auto">
                    <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono">
                      {prompt.promptBody || t.noContent}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 bg-slate-800/50">
          <p className="text-sm text-slate-400 text-center">
            {t.tip}
          </p>
        </div>
      </div>
    </div>
  );
}
