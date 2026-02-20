import React, { useState, useEffect } from 'react';
import { Download, FileImage, Check, ExternalLink, Save } from 'lucide-react';
import { getMakerPathVariables } from '@core/maker-path-variables/maker-path-variables.service';
import { useLanguage } from '../../../language/useLanguage';

type OutputResultSaverProps = {
  makerPathId?: number;
  stepId?: number;
  onMarkStepComplete?: (stepId: number) => void;
};

const OutputResultSaver: React.FC<OutputResultSaverProps> = ({
  makerPathId,
  stepId,
  onMarkStepComplete,
}) => {
  const { t } = useLanguage();
  const os = t.projectFlow.outputSaver;
  const [resultData, setResultData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDownloaded, setIsDownloaded] = useState(false);

  useEffect(() => {
    loadResultFromPreviousStep();
  }, [makerPathId]);

  const loadResultFromPreviousStep = async () => {
    if (!makerPathId) return;

    try {
      const variables = await getMakerPathVariables(makerPathId);
      console.log('[OutputResultSaver] All variables:', variables);

      // Look for the generated_image_url variable from the previous step
      const imageVariable = variables.find(v => 
        v.makerPathId === makerPathId && v.variableName === 'generated_image_url'
      );

      if (imageVariable) {
        const value = imageVariable.variableValue as any;
        console.log('[OutputResultSaver] Found image variable:', value);
        
        // Extract image URL from object or use directly
        let imageUrl = '';
        if (typeof value === 'object' && value?.imageUrl) {
          imageUrl = value.imageUrl;
        } else if (typeof value === 'string') {
          imageUrl = value;
        }

        if (imageUrl) {
          setResultData(imageUrl);
          console.log('[OutputResultSaver] Image URL loaded successfully');
        }
      } else {
        console.log('[OutputResultSaver] No generated_image_url variable found');
        setError('No image found from previous step');
      }
    } catch (err) {
      console.error('[OutputResultSaver] Error loading result:', err);
      setError(os.noImageSubtitle);
    }
  };

  const downloadImage = async () => {
    if (!resultData) return;

    try {
      // Create a temporary link to download the image
      const link = document.createElement('a');
      link.href = resultData;
      link.download = `ai-generated-image-${Date.now()}.png`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setIsDownloaded(true);
      
      // Auto-complete the step after download
      setTimeout(() => {
        if (stepId && onMarkStepComplete) {
          onMarkStepComplete(stepId);
        }
      }, 1000);
    } catch (err) {
      console.error('[OutputResultSaver] Download error:', err);
      setError(os.errorDownload);
    }
  };

  const openInNewWindow = () => {
    if (!resultData) return;
    const win = window.open();
    if (win) {
      win.document.write(`<img src="${resultData}" alt="Generated Image" style="max-width: 100%; height: auto;" />`);
      win.document.title = 'Generated Image';
    }
  };

  const saveToObjects = () => {
    // TODO: Implementar lógica para guardar en objetos
    console.log('[OutputResultSaver] Guardar en Objetos - pendiente de implementación');
    alert('Funcionalidad pendiente: Guardar en Objetos');
  };

  const isImageResult = typeof resultData === 'string' && (resultData.startsWith('data:image/') || resultData.includes('http'));

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800/30">
        <FileImage size={20} className="text-emerald-600 dark:text-emerald-400" />
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{os.title}</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">{os.subtitle}</p>
        </div>
      </div>

      {/* Result Preview */}
      {resultData ? (
        <div className="space-y-4">
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
            {os.imageLabel}
          </label>
          
          {isImageResult ? (
            <>
              <div className="relative rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 shadow-lg">
                <img
                  src={resultData}
                  alt="Generated Result"
                  className="w-full h-auto"
                />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={openInNewWindow}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-sm font-semibold shadow-sm hover:shadow-md"
                >
                  <ExternalLink size={18} />
                  Abrir en Nueva Ventana
                </button>

                <button
                  onClick={downloadImage}
                  disabled={isDownloaded}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-semibold shadow-sm hover:shadow-md"
                >
                  {isDownloaded ? (
                    <>
                      <Check size={18} />
                      {os.downloadedBtn}
                    </>
                  ) : (
                    <>
                      <Download size={18} />
                      Télécharger
                    </>
                  )}
                </button>

                <button
                  onClick={saveToObjects}
                  className="col-span-2 flex items-center justify-center gap-2 px-4 py-3 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors text-sm font-semibold shadow-sm hover:shadow-md"
                >
                  <Save size={18} />
                  Guardar en Objetos
                </button>
              </div>

              {/* Info Text */}
              <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                {os.downloadHint}
              </p>
            </>
          ) : (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
                {typeof resultData === 'string' 
                  ? resultData 
                  : JSON.stringify(resultData, null, 2)}
              </pre>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 space-y-3 text-center">
          <FileImage size={64} className="text-gray-300 dark:text-gray-600" />
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{os.noImageTitle}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{os.noImageSubtitle}</p>
          </div>
          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg max-w-md">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OutputResultSaver;
