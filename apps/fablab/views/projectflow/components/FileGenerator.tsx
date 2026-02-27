import React, { useEffect, useState } from 'react';
import { httpClient } from '@core/api/http.client';
import { getRagMultimodalSourceContent } from '@core/rag_multimodal';
import { postMakerPathVariable, getMakerPathVariables } from '@core/maker-path-variables/maker-path-variables.service';
import { saveMakerPathStepProgress } from '@core/maker-path-step-progress/maker-path-step-progress.service';
import { Download, FileCode, ChevronDown } from 'lucide-react';

type ModuleType = 'HEADER' | 'BODY' | 'FOOTER';

interface HTMLSource {
  id: number;
  name: string;
  type: string;
}

interface FileGeneratorProps {
  makerPathId?: number;
  stepId?: number;
  onMarkStepComplete?: (stepId: number) => void;
  onMarkComplete?: () => void;
}

const MODULE_TYPES: Array<{ type: ModuleType; label: string; color: string; icon: string }> = [
  { type: 'HEADER', label: 'Header', color: 'text-purple-600', icon: '🟣' },
  { type: 'BODY', label: 'Body', color: 'text-blue-600', icon: '🔵' },
  { type: 'FOOTER', label: 'Footer', color: 'text-emerald-600', icon: '🟢' },
];

const FileGenerator: React.FC<FileGeneratorProps> = ({ 
  makerPathId, 
  stepId, 
  onMarkStepComplete,
  onMarkComplete 
}) => {
  const [sources, setSources] = useState<HTMLSource[]>([]);
  const [selectedHeader, setSelectedHeader] = useState<number | null>(null);
  const [selectedBody, setSelectedBody] = useState<number | null>(null);
  const [selectedFooter, setSelectedFooter] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (makerPathId) {
      loadHTMLSources();
      loadPreviousSelections();
    }
  }, [makerPathId]);

  const loadHTMLSources = async () => {
    if (!makerPathId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      // Load maker_path to get its rag_id
      const makerPath = await httpClient.get<any>(`/api/v1/maker-paths/${makerPathId}`);
      
      if (!makerPath?.rag?.id) {
        setError('No se encontró biblioteca RAG. Complete el paso anterior.');
        setIsLoading(false);
        return;
      }
      
      // Load RAG with sources
      const ragData = await httpClient.get<any>(`/api/v1/rag-multimodal/${makerPath.rag.id}`);
      const allSources = ragData.sources || [];
      
      // Filter only HTML sources
      const htmlSources = allSources
        .filter((s: any) => s.type === 'HTML' || s.name.endsWith('.html'))
        .map((s: any) => ({
          id: s.id,
          name: s.name,
          type: s.type
        }));
      
      setSources(htmlSources);
      
      if (htmlSources.length === 0) {
        setError('No hay fuentes HTML en el RAG. Agregue fuentes HTML en el paso anterior.');
      }
    } catch (err) {
      console.error('Error loading HTML sources:', err);
      setError('Error al cargar fuentes HTML.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPreviousSelections = async () => {
    if (!makerPathId) return;
    
    try {
      const variables = await getMakerPathVariables(makerPathId);
      
      // Look for saved selections (variable_index_number 2 for this step)
      const savedSelections = variables.find(v => v.variableIndexNumber === 2);
      
      if (savedSelections?.variableValue) {
        const value = savedSelections.variableValue as any;
        if (value.headerSourceId) setSelectedHeader(value.headerSourceId);
        if (value.bodySourceId) setSelectedBody(value.bodySourceId);
        if (value.footerSourceId) setSelectedFooter(value.footerSourceId);
      }
    } catch (err) {
      console.error('Error loading previous selections:', err);
    }
  };

  const saveSelections = async () => {
    if (!makerPathId) return;
    
    try {
      await postMakerPathVariable({
        makerPathId,
        variableIndexNumber: 2,
        variableName: 'html_module_selections',
        variableValue: {
          headerSourceId: selectedHeader,
          bodySourceId: selectedBody,
          footerSourceId: selectedFooter
        }
      });
    } catch (err) {
      console.error('Error saving selections:', err);
    }
  };

  const handleGenerateIndex = async () => {
    if (!makerPathId || !selectedHeader || !selectedBody || !selectedFooter) {
      alert('Por favor selecciona Header, Body y Footer');
      return;
    }
    
    setIsGenerating(true);
    try {
      // Save selections to variables
      await saveSelections();
      
      // Fetch content for selected modules
      const [headerContent, bodyContent, footerContent] = await Promise.all([
        fetchModuleContent(selectedHeader),
        fetchModuleContent(selectedBody),
        fetchModuleContent(selectedFooter)
      ]);

      // Generate HTML
      const indexHtml = generateIndexHtml(
        makerPathId,
        headerContent,
        bodyContent ? [bodyContent] : [],
        footerContent
      );

      // Download
      const blob = new Blob([indexHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `maker-path-${makerPathId}-index.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Save progress
      if (stepId) {
        await saveMakerPathStepProgress({
          makerPathId,
          stepId,
          status: 'success',
          resultText: {
            fileName: `maker-path-${makerPathId}-index.html`,
            headerSourceId: selectedHeader,
            bodySourceId: selectedBody,
            footerSourceId: selectedFooter
          }
        });
      }

      // Mark complete
      if (stepId && onMarkStepComplete) {
        onMarkStepComplete(stepId);
      }
      onMarkComplete?.();
    } catch (error) {
      console.error('Error generating index:', error);
      alert('Error al generar index.html');
    } finally {
      setIsGenerating(false);
    }
  };

  const fetchModuleContent = async (sourceId: number): Promise<{ html: string; css: string } | null> => {
    try {
      const response = await getRagMultimodalSourceContent(sourceId);
      
      if (response.isUrl) {
        // If it's a URL, return a reference
        return { html: `<p>External content: <a href="${response.content}" target="_blank">${response.name}</a></p>`, css: '' };
      }
      
      // Parse HTML content
      const parser = new DOMParser();
      const doc = parser.parseFromString(response.content, 'text/html');
      
      // Extract styles
      let css = '';
      doc.querySelectorAll('style').forEach(styleEl => {
        css += styleEl.textContent + '\n';
      });
      
      // Extract body content
      const html = doc.body.innerHTML;
      
      return { html, css };
    } catch (error) {
      console.error(`Error fetching module ${sourceId}:`, error);
      return null;
    }
  };

  const generateIndexHtml = (
    pathId: number,
    header: { html: string; css: string } | null,
    body: Array<{ html: string; css: string }>,
    footer: { html: string; css: string } | null
  ): string => {
    // Combine all CSS
    const allCss = [
      header?.css || '',
      ...body.map(b => b.css),
      footer?.css || ''
    ].filter(c => c.trim()).join('\n');

    // Combine all HTML
    const headerHtml = header?.html || '';
    const bodyHtml = body.map(b => b.html).join('\n');
    const footerHtml = footer?.html || '';

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Maker Path ${pathId} - Generated Page</title>
    <style>
        /* Base Reset - same pattern as path-creation-modules */
        body { margin: 0; padding: 0; min-height: 100vh; display: flex; flex-direction: column; }
        
        /* Module Styles */
        ${allCss}
    </style>
</head>
<body>

    <!-- HEADER MODULE -->
    <header id="module-header">
        ${headerHtml}
    </header>

    <!-- BODY MODULE -->
    <main id="module-body" style="flex: 1;">
        ${bodyHtml}
    </main>

    <!-- FOOTER MODULE -->
    <footer id="module-footer">
        ${footerHtml}
    </footer>

</body>
</html>`;
  };

  const canGenerate = selectedHeader && selectedBody && selectedFooter;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!makerPathId) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
        No maker path ID disponible
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 space-y-3">
        <FileCode size={48} className="mx-auto text-red-300 dark:text-red-600" />
        <div>
          <p className="text-red-600 dark:text-red-400 font-semibold text-sm">{error}</p>
          <button
            onClick={loadHTMLSources}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (sources.length === 0 && !isLoading) {
    return (
      <div className="text-center py-8 space-y-3">
        <FileCode size={48} className="mx-auto text-gray-300 dark:text-gray-600" />
        <div>
          <p className="text-gray-700 dark:text-gray-300 font-semibold text-sm">No hay fuentes HTML</p>
          <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
            Agregue fuentes HTML en el paso anterior
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
        <FileCode size={16} />
        <span className="text-xs font-medium">Selecciona fuentes HTML del RAG</span>
      </div>

      {/* Info message */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          Selecciona una fuente HTML para cada sección de tu página.
        </p>
      </div>

      {/* Module Selectors */}
      <div className="space-y-3">
        {MODULE_TYPES.map(({ type, label, color, icon }) => {
          const selectedId = type === 'HEADER' ? selectedHeader : type === 'BODY' ? selectedBody : selectedFooter;
          const setSelected = type === 'HEADER' ? setSelectedHeader : type === 'BODY' ? setSelectedBody : setSelectedFooter;
          
          return (
            <div key={type} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Header */}
              <div className="px-4 py-3 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-lg">{icon}</span>
                <h3 className={`font-bold text-sm ${color}`}>{label}</h3>
              </div>

              {/* Selector */}
              <div className="p-4">
                <div className="relative">
                  <select
                    value={selectedId || ''}
                    onChange={(e) => setSelected(e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-3 py-2 pr-10 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                  >
                    <option value="">Seleccionar fuente...</option>
                    {sources.map(source => (
                      <option key={source.id} value={source.id}>
                        {source.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Generate Button */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleGenerateIndex}
          disabled={!canGenerate || isGenerating}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              Generando...
            </>
          ) : (
            <>
              <Download size={16} />
              Generar Index.html
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default FileGenerator;
