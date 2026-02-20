import React, { useState, useEffect, useRef } from 'react';
import { Wand2, Loader2, RefreshCw } from 'lucide-react';
import { getMakerPathVariables, postMakerPathVariable } from '@core/maker-path-variables/maker-path-variables.service';
import { generateImageFromPrompt } from '@core/ai/image-generation.service';
import { useLanguage } from '../../../language/useLanguage';

type IaGeneratorStepProps = {
  makerPathId?: number;
  variableIndexNumber?: number;
  stepId?: number;
  onMarkStepComplete?: (stepId: number) => void;
  onGeneratedImage?: (imageUrl: string) => void;
};

const IaGeneratorStep: React.FC<IaGeneratorStepProps> = ({
  makerPathId,
  variableIndexNumber,
  stepId,
  onMarkStepComplete,
  onGeneratedImage,
}) => {
  const { t } = useLanguage();
  const ig = t.projectFlow.imageGenerator;
  const [prompt, setPrompt] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadContextFromPreviousStep();
  }, [makerPathId]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [prompt]);

  const loadContextFromPreviousStep = async () => {
    if (!makerPathId) return;

    try {
      const variables = await getMakerPathVariables(makerPathId);
      console.log('[IaGeneratorStep] Variables:', variables);

      const promptVariable = variables.find(v => 
        v.makerPathId === makerPathId && v.variableName === 'image_prompt'
      );

      if (promptVariable) {
        const value = promptVariable.variableValue as any;
        console.log('[IaGeneratorStep] Found prompt variable:', value);
        
        let promptText = '';
        if (typeof value === 'object' && value?.prompt) {
          promptText = value.prompt;
        } else if (typeof value === 'string') {
          promptText = value;
        }

        if (promptText) {
          setPrompt(promptText);
          console.log('[IaGeneratorStep] Prompt loaded successfully');
        }
      } else {
        console.log('[IaGeneratorStep] No image_prompt variable found');
      }
    } catch (err) {
      console.error('[IaGeneratorStep] Error loading context:', err);
    }
  };

  /**
   * Generate image via the backend proxy endpoint.
   * The backend calls Pollinations.ai server-to-server (no Turnstile).
   */
  const generateImage = async () => {
    if (!prompt.trim()) {
      setError(ig.errorEmpty);
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const finalPrompt = prompt.trim();
      console.log('[IaGeneratorStep] Sending prompt:', finalPrompt);

      const result = await generateImageFromPrompt(finalPrompt);
      console.log('[IaGeneratorStep] Image generated ✓  size:', result.size, 'type:', result.contentType);

      // result.imageUrl is a data:image/...;base64,... URI
      setGeneratedImageUrl(result.imageUrl);
      setIsGenerating(false);
      setError(null);

      // Save as maker path variable
      if (makerPathId && variableIndexNumber) {
        try {
          await postMakerPathVariable({
            makerPathId,
            variableIndexNumber,
            variableName: 'generated_image_url',
            variableValue: { imageUrl: result.imageUrl },
          });
          console.log('[IaGeneratorStep] Image URL saved as variable');
          if (stepId && onMarkStepComplete) onMarkStepComplete(stepId);
        } catch (err) {
          console.error('[IaGeneratorStep] Error saving image URL:', err);
        }
      }

      if (onGeneratedImage) onGeneratedImage(result.imageUrl);

    } catch (err: any) {
      console.error('[IaGeneratorStep] Generation error:', err);
      setError(`${ig.errorFailed} (${err.message || err})`);
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      generateImage();
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-100 dark:border-purple-800/30">
        <Wand2 size={20} className="text-purple-600 dark:text-purple-400" />
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{ig.title}</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">{ig.subtitle}</p>
        </div>
      </div>

      {/* Prompt Input */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">{ig.promptLabel}</label>
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={ig.placeholder}
          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-600 focus:border-transparent resize-none transition-all"
          rows={4}
        />
        <div className="flex items-center justify-between text-xs">
          <span className={prompt.length > 400 ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-gray-500 dark:text-gray-400'}>
            {prompt.length} {prompt.length > 400 && `⚠️ ${ig.charsTruncated}`}
          </span>
          <span className="text-gray-400 dark:text-gray-500">{ig.ctrlEnterHint}</span>
        </div>
        {prompt.length > 400 && (
          <div className="p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded text-xs text-amber-700 dark:text-amber-400">
            {ig.longPromptWarning}
          </div>
        )}
      </div>

      {/* Generate Button */}
      <button
        onClick={generateImage}
        disabled={!prompt.trim() || isGenerating}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
      >
        {isGenerating ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            {ig.generatingBtn}
          </>
        ) : (
          <>
            <Wand2 size={18} />
            {ig.generateBtn}
          </>
        )}
      </button>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Generated Image */}
      {generatedImageUrl && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{ig.imageTitle}</span>
          </div>
          
          {/* Image Display */}
          <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <img src={generatedImageUrl} alt={ig.imageTitle} className="w-full h-auto" />
          </div>

          {/* Regenerate Button Only */}
          <button 
            onClick={generateImage} 
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg"
          >
            <RefreshCw size={18} />
            {ig.regenerate || 'Regenerar Imagen'}
          </button>
        </div>
      )}
    </div>
  );
};

export default IaGeneratorStep;
