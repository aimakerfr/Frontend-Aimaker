import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertTriangle } from 'lucide-react';
import { getOrCreateProductByType, type ProductType } from '@core/products';

interface FixedProductEntryProps {
  type: ProductType;
  route: string;
  title: string;
  description: string;
}

const FixedProductEntry: React.FC<FixedProductEntryProps> = ({ type, route, title, description }) => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ensureProduct = async () => {
      try {
        const product = await getOrCreateProductByType(type, { title, description });
        navigate(`/product/${route}/${product.id}`, { replace: true });
      } catch (err: any) {
        setError(err?.message || 'No se pudo abrir el producto fijo.');
      }
    };

    ensureProduct();
  }, [type, route, title, description, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-6 text-center">
        <AlertTriangle className="text-red-500 mb-3" size={32} />
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{title}</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="animate-spin text-indigo-600" size={36} />
        <p className="text-sm text-gray-600 dark:text-gray-400">Abriendo {title}...</p>
      </div>
    </div>
  );
};

export const LandingPageEntry = () => (
  <FixedProductEntry
    type="landing_page_maker"
    route="landing-page"
    title="Landing Page"
    description="Landing page fija para ensamblar módulos HTML y descargar."
  />
);

export const ImageGeneratorEntry = () => (
  <FixedProductEntry
    type="image_generator_rag"
    route="image-generator"
    title="Generador de Imágenes"
    description="Generador fijo para prompts y descargas de imágenes."
  />
);

export const TranslationEntry = () => (
  <FixedProductEntry
    type="translation_maker"
    route="translation"
    title="Traducciones"
    description="Traducción fija de archivos con i18n."
  />
);

export const StyleTransferEntry = () => (
  <FixedProductEntry
    type="style_transfer_maker"
    route="style-transfer"
    title="Style Transfer"
    description="Extrae selectores de HTML y aplica CSS generado por IA."
  />
);

export const ApiKeyEntry = () => (
  <FixedProductEntry
    type="api_key_maker"
    route="api-key"
    title="Inspector de API Keys"
    description="Valida formato y conectividad de API keys por proveedor."
  />
);

export const ApiKeyHtmlInjectionEntry = () => (
  <FixedProductEntry
    type="api_key_html_injector"
    route="api-key-html"
    title="Inyección de API key a HTML"
    description="Carga HTML y lo adapta automáticamente para consumir IA vía proxy seguro."
  />
);

export const ProfileB2BEntry = () => (
  <FixedProductEntry
    type="profile_b2b_maker"
    route="profile-b2b"
    title="Profile B2B"
    description="Perfila prospectos B2B con IA, genera una landing personalizada y guarda el resultado en notebook."
  />
);

export const PerplexitySearchEntry = () => (
  <FixedProductEntry
    type="perplexity_search"
    route="perplexity-search"
    title="Búsqueda Perplexity"
    description="Búsqueda inteligente potenciada con Perplexity AI."
  />
);

export const PromptOptimizerEntry = () => (
  <FixedProductEntry
    type="prompt_optimizer"
    route="prompt-optimizer"
    title="Optimizador de Prompt"
    description="Optimiza tus prompts con IA para mejorar su estructura, objetivo y detalle."
  />
);

export const CreationPathEntry = () => (
  <FixedProductEntry
    type="creation_path"
    route="creation-path"
    title="Creation-Path"
    description="Ruta de creación guiada paso a paso con asistencia de IA."
  />
);

export default FixedProductEntry;
