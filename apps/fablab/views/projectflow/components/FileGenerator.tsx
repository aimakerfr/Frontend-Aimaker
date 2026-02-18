import React, { useEffect, useState } from 'react';
import { getMakerPathVariables, MakerPathVariableResponse } from '@core/maker-path-variables/maker-path-variables.service';
import { getRagMultimodalSourceContent } from '@core/rag_multimodal';
import { Download, FileCode, ArrowUp, ArrowDown } from 'lucide-react';

type ModuleType = 'HEADER' | 'BODY' | 'FOOTER';

interface ModuleAssignment {
  type: ModuleType;
  variable: MakerPathVariableResponse;
  order?: number;
}

interface FileGeneratorProps {
  makerPathId?: number;
  onMarkComplete?: () => void;
}

const MODULE_TYPES: Array<{ type: ModuleType; label: string; color: string; bg: string; icon: string; multi: boolean }> = [
  { type: 'HEADER', label: 'Header', color: 'text-purple-600', bg: 'bg-purple-50', icon: '🟣', multi: false },
  { type: 'BODY', label: 'Body', color: 'text-blue-600', bg: 'bg-blue-50', icon: '🔵', multi: true },
  { type: 'FOOTER', label: 'Footer', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: '🟢', multi: false },
];

const FileGenerator: React.FC<FileGeneratorProps> = ({ makerPathId, onMarkComplete }) => {
  const [variables, setVariables] = useState<MakerPathVariableResponse[]>([]);
  const [assignments, setAssignments] = useState<ModuleAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  // Read-only visualization: no reassign/delete selector

  useEffect(() => {
    if (makerPathId) {
      loadVariablesAndAutoAssign();
    }
  }, [makerPathId]);

  const loadVariablesAndAutoAssign = async () => {
    if (!makerPathId) return;
    
    setIsLoading(true);
    try {
      const vars = await getMakerPathVariables(makerPathId);
      setVariables(vars);
      
      // Auto-assign modules based on their source name or index
      if (vars.length > 0) {
        const newAssignments: ModuleAssignment[] = [];
        
        // Sort by index to maintain order
        const sortedVars = [...vars].sort((a, b) => a.variableIndexNumber - b.variableIndexNumber);
        
        // Detect module type from variable name or use smart detection
        sortedVars.forEach((variable, index) => {
          const varName = variable.variableName.toLowerCase();
          const sourceName = ((variable.variableValue as any)?.sourceName || '').toLowerCase();
          
          // Detect type from name
          if (varName.includes('header') || sourceName.includes('header')) {
            newAssignments.push({ type: 'HEADER', variable });
          } else if (varName.includes('footer') || sourceName.includes('footer')) {
            newAssignments.push({ type: 'FOOTER', variable });
          } else if (varName.includes('body') || sourceName.includes('body') || sourceName.includes('landing')) {
            // Body modules get order
            const bodyOrder = newAssignments.filter(a => a.type === 'BODY').length;
            newAssignments.push({ type: 'BODY', variable, order: bodyOrder });
          } else {
            // Fallback: if no type detected, use position-based logic
            if (index === 0 && !newAssignments.some(a => a.type === 'HEADER')) {
              // First one without assigned header → HEADER
              newAssignments.push({ type: 'HEADER', variable });
            } else if (index === sortedVars.length - 1 && !newAssignments.some(a => a.type === 'FOOTER')) {
              // Last one without assigned footer → FOOTER
              newAssignments.push({ type: 'FOOTER', variable });
            } else {
              // Middle ones → BODY
              const bodyOrder = newAssignments.filter(a => a.type === 'BODY').length;
              newAssignments.push({ type: 'BODY', variable, order: bodyOrder });
            }
          }
        });
        
        setAssignments(newAssignments);
      }
    } catch (error) {
      console.error('Error loading variables:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Reassign/Delete disabled per requirement – only display selected variables from API

  const handleMoveUp = (type: ModuleType, variableIndexNumber: number) => {
    if (type !== 'BODY') return;
    
    setAssignments(prev => {
      const bodyAssignments = prev.filter(a => a.type === 'BODY').sort((a, b) => (a.order || 0) - (b.order || 0));
      const index = bodyAssignments.findIndex(a => a.variable.variableIndexNumber === variableIndexNumber);
      
      if (index <= 0) return prev;
      
      // Swap orders
      const temp = bodyAssignments[index].order;
      bodyAssignments[index].order = bodyAssignments[index - 1].order;
      bodyAssignments[index - 1].order = temp;
      
      return [
        ...prev.filter(a => a.type !== 'BODY'),
        ...bodyAssignments
      ];
    });
  };

  const handleMoveDown = (type: ModuleType, variableIndexNumber: number) => {
    if (type !== 'BODY') return;
    
    setAssignments(prev => {
      const bodyAssignments = prev.filter(a => a.type === 'BODY').sort((a, b) => (a.order || 0) - (b.order || 0));
      const index = bodyAssignments.findIndex(a => a.variable.variableIndexNumber === variableIndexNumber);
      
      if (index < 0 || index >= bodyAssignments.length - 1) return prev;
      
      // Swap orders
      const temp = bodyAssignments[index].order;
      bodyAssignments[index].order = bodyAssignments[index + 1].order;
      bodyAssignments[index + 1].order = temp;
      
      return [
        ...prev.filter(a => a.type !== 'BODY'),
        ...bodyAssignments
      ];
    });
  };

  const getAssignmentsByType = (type: ModuleType): ModuleAssignment[] => {
    const filtered = assignments.filter(a => a.type === type);
    if (type === 'BODY') {
      return filtered.sort((a, b) => (a.order || 0) - (b.order || 0));
    }
    return filtered;
  };

  // getAvailableVariables removed – not needed without reassignment UI

  const handleGenerateIndex = async () => {
    if (!makerPathId) return;
    
    setIsGenerating(true);
    try {
      const headerAssignment = assignments.find(a => a.type === 'HEADER');
      const bodyAssignments = assignments.filter(a => a.type === 'BODY').sort((a, b) => (a.order || 0) - (b.order || 0));
      const footerAssignment = assignments.find(a => a.type === 'FOOTER');

      // Fetch content for all modules
      const headerContent = headerAssignment 
        ? await fetchModuleContent(headerAssignment.variable.ragMultimodalSourceId)
        : null;
      
      const bodyContents = await Promise.all(
        bodyAssignments.map(b => 
          b.variable.ragMultimodalSourceId 
            ? fetchModuleContent(b.variable.ragMultimodalSourceId)
            : Promise.resolve(null)
        )
      );
      
      const footerContent = footerAssignment
        ? await fetchModuleContent(footerAssignment.variable.ragMultimodalSourceId)
        : null;

      // Generate HTML with embedded content
      const indexHtml = generateIndexHtml(
        makerPathId,
        headerContent,
        bodyContents.filter((c): c is { html: string; css: string } => c !== null),
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

      onMarkComplete?.();
    } catch (error) {
      console.error('Error generating index:', error);
      alert('Error generating index.html. Please check the console for details.');
    } finally {
      setIsGenerating(false);
    }
  };

  const fetchModuleContent = async (sourceId: number | null): Promise<{ html: string; css: string } | null> => {
    if (!sourceId) return null;
    
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

  const canGenerate = assignments.length > 0;

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
        No maker path ID available
      </div>
    );
  }

  if (variables.length === 0 && !isLoading) {
    return (
      <div className="text-center py-8 space-y-3">
        <FileCode size={48} className="mx-auto text-gray-300 dark:text-gray-600" />
        <div>
          <p className="text-gray-700 dark:text-gray-300 font-semibold text-sm">No modules found</p>
          <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
            Please complete the previous steps to select modules
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
        <span className="text-xs font-medium">Modules from Previous Steps</span>
      </div>

      {/* Info message */}
      {variables.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            Modules have been automatically organized. You can reorganize them before generating the index.html
          </p>
        </div>
      )}

      {/* Module Types */}
      <div className="space-y-3">
        {MODULE_TYPES.map(({ type, label, color, icon, multi }) => {
          const assigned = getAssignmentsByType(type);
          const hasAssigned = assigned.length > 0;

          return (
            <div key={type} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Header */}
              <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{icon}</span>
                  <div>
                    <h3 className={`font-bold text-sm ${color}`}>
                      {label}
                      {multi && hasAssigned && (
                        <span className="ml-2 text-xs text-gray-400">({assigned.length})</span>
                      )}
                    </h3>
                  </div>
                </div>
                {/* Reassign removed per requirement */}
              </div>

              {/* Assigned */}
              {hasAssigned && (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {assigned.map((assignment, idx) => (
                    <div key={assignment.variable.variableIndexNumber} className="px-4 py-3 flex items-center gap-2">
                      {multi && (
                        <span className="text-xs font-black text-gray-400 w-5 shrink-0">
                          {idx + 1}.
                        </span>
                      )}
                      <FileCode size={14} className={color} />
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300 flex-1">
                        {(assignment.variable.variableValue as any)?.sourceName || assignment.variable.variableName}
                      </span>
                      {multi && (
                        <>
                          <button
                            onClick={() => handleMoveUp(type, assignment.variable.variableIndexNumber)}
                            disabled={idx === 0}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-gray-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            onClick={() => handleMoveDown(type, assignment.variable.variableIndexNumber)}
                            disabled={idx === assigned.length - 1}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-gray-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ArrowDown size={14} />
                          </button>
                        </>
                      )}
                      {/* Delete removed per requirement */}
                    </div>
                  ))}
                </div>
              )}
              {/* Selector removed per requirement */}
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
              Generating...
            </>
          ) : (
            <>
              <Download size={16} />
              Generate Index.html
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default FileGenerator;
