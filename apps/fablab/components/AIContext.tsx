import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Workflow, Settings, ExternalLink, Sparkles, Package, Eye, Globe, Lock, Star } from 'lucide-react';
import { useLanguage } from '../language/useLanguage';
import {
  getProducts,
  getOrCreateProductByType,
  updateProduct,
  type Product,
  type ProductType,
} from '@core/products';

interface ServerTool {
  id: string;
  section: 'llms' | 'automation' | 'administration';
  nameKey: 'llm' | 'n8n' | 'perplexity' | 'promptOptimize' | 'imageGen' | 'admin';
  icon: any;
  color: string;
  url: string;
  isExternal: boolean;
  internalRoute?: string;
}

const FIXED_TYPES: ProductType[] = [
  'landing_page_maker',
  'image_generator_rag',
  'translation_maker',
  'style_transfer_maker',
  'api_key_maker',
  'api_key_html_injector',
  'profile_b2b_maker',
  'api_cost_manager',
  'perplexity_search',
  'prompt_optimizer',
  'creation_path',
  'suivi_demandes_maker',
];

const SERVER_TOOLS: ServerTool[] = [
  {
    id: 'llm',
    section: 'llms',
    nameKey: 'llm',
    icon: Bot,
    color: 'from-indigo-50 to-violet-50 dark:from-indigo-900/30 dark:to-violet-900/20',
    url: 'https://ollama.aimaker.fr/auth?redirect=%2F',
    isExternal: true,
  },
  {
    id: 'n8n_workflow',
    section: 'automation',
    nameKey: 'n8n',
    icon: Workflow,
    color: 'from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/20',
    url: 'https://n8n.utopiamaker.com/',
    isExternal: true,
  },
  {
    id: 'administration',
    section: 'administration',
    nameKey: 'admin',
    icon: Settings,
    color: 'from-slate-50 to-gray-100 dark:from-slate-900/40 dark:to-gray-800/30',
    url: '',
    isExternal: false,
    internalRoute: '/dashboard/administration',
  },
];

const getProductRoute = (type: ProductType, id: number): string => {
  const routeMap: Record<string, string> = {
    rag_chat_maker: 'notebook',
    landing_page_maker: 'landing-page',
    image_generator_rag: 'image-generator',
    translation_maker: 'translation',
    style_transfer_maker: 'style-transfer',
    api_key_maker: 'api-key',
    api_key_html_injector: 'api-key-html',
    profile_b2b_maker: 'profile-b2b',
    api_cost_manager: 'api-cost',
    perplexity_search: 'perplexity-search',
    prompt_optimizer: 'prompt-optimizer',
    creation_path: 'creation-path',
    suivi_demandes_maker: 'suivi-demandes',
    app: 'app',
    architect_ai: 'notebook',
    module_connector: 'notebook',
    custom: 'notebook',
  };

  const route = routeMap[type] || 'notebook';
  if (FIXED_TYPES.includes(type)) {
    return `/product/${route}`;
  }

  return `/product/${route}/${id}`;
};

const getTypeColor = (type: ProductType): string => {
  const colorMap: Record<ProductType, string> = {
    rag_chat_maker: 'bg-gradient-to-br from-teal-500 to-cyan-600',
    architect_ai: 'bg-gradient-to-br from-blue-500 to-indigo-600',
    module_connector: 'bg-gradient-to-br from-emerald-500 to-green-600',
    landing_page_maker: 'bg-gradient-to-br from-purple-500 to-violet-600',
    image_generator_rag: 'bg-gradient-to-br from-pink-500 to-rose-600',
    translation_maker: 'bg-gradient-to-br from-amber-500 to-orange-600',
    style_transfer_maker: 'bg-gradient-to-br from-indigo-500 to-sky-500',
    api_key_maker: 'bg-gradient-to-br from-cyan-500 to-blue-600',
    api_key_html_injector: 'bg-gradient-to-br from-violet-500 to-fuchsia-600',
    profile_b2b_maker: 'bg-gradient-to-br from-teal-500 to-cyan-600',
    api_cost_manager: 'bg-gradient-to-br from-teal-600 to-emerald-600',
    app: 'bg-gradient-to-br from-emerald-500 to-teal-600',
    custom: 'bg-gradient-to-br from-gray-500 to-gray-600',
    perplexity_search: 'bg-gradient-to-br from-blue-500 to-sky-600',
    prompt_optimizer: 'bg-gradient-to-br from-indigo-500 to-purple-600',
    creation_path: 'bg-gradient-to-br from-emerald-500 to-green-600',
    suivi_demandes_maker: 'bg-gradient-to-br from-cyan-600 to-blue-700',
  };

  return colorMap[type] || 'bg-gradient-to-br from-gray-500 to-gray-600';
};

const AIContext: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [fixedProducts, setFixedProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  const tools = useMemo(() => SERVER_TOOLS, []);

  const toolSections = useMemo(
    () => [
      {
        key: 'llms' as const,
        title: t.serverTools.sections?.llms || 'Language Models (LLMs)',
      },
      {
        key: 'automation' as const,
        title: t.serverTools.sections?.automation || 'Automation',
      },
      {
        key: 'administration' as const,
        title: t.serverTools.sections?.administration || 'Administration',
      },
    ],
    [t.serverTools.sections],
  );

  useEffect(() => {
    loadFixedProducts();
  }, []);

  const loadFixedProducts = async () => {
    try {
      setIsLoadingProducts(true);

      const fixedDefinitions: Array<{ type: ProductType; title: string; description: string }> = [
        { type: 'landing_page_maker', title: t.products.fixed.landingTitle, description: t.products.fixed.landingDesc },
        { type: 'image_generator_rag', title: t.products.fixed.imageTitle, description: t.products.fixed.imageDesc },
        { type: 'translation_maker', title: t.products.fixed.translationTitle, description: t.products.fixed.translationDesc },
        { type: 'style_transfer_maker', title: t.products.fixed.styleTransferTitle, description: t.products.fixed.styleTransferDesc },
        { type: 'api_key_maker', title: t.products.fixed.apiKeyTitle, description: t.products.fixed.apiKeyDesc },
        {
          type: 'api_key_html_injector',
          title: t.products.fixed.apiKeyHtmlTitle || 'API Key Injection to HTML',
          description: t.products.fixed.apiKeyHtmlDesc || 'Store API keys per product and deploy your HTML through the AI proxy.',
        },
        {
          type: 'profile_b2b_maker',
          title: t.products.fixed.profileB2BTitle || 'B2B Profile',
          description: t.products.fixed.profileB2BDesc || 'B2B pipeline with OSINT, persona, matching, and personalized landing generated by AI.',
        },
        {
          type: 'perplexity_search',
          title: (t.products.fixed as any).perplexitySearchTitle || 'Búsqueda Perplexity',
          description: (t.products.fixed as any).perplexitySearchDesc || 'Búsqueda inteligente potenciada con Perplexity AI.',
        },
        {
          type: 'api_cost_manager',
          title: (t.products.fixed as any).apiCostManagerTitle || 'Gestor de costos API',
          description: (t.products.fixed as any).apiCostManagerDesc || 'Analiza costos, modelos disponibles e historial de reportes de una API key.',
        },
        {
          type: 'prompt_optimizer',
          title: (t.products.fixed as any).promptOptimizerTitle || 'Optimizador de Prompt',
          description: (t.products.fixed as any).promptOptimizerDesc || 'Optimiza tus prompts con IA para mejorar su estructura, objetivo y detalle.',
        },
        {
          type: 'creation_path',
          title: (t.products.fixed as any).creationPathTitle || 'Creation-Path',
          description: (t.products.fixed as any).creationPathDesc || 'Ruta de creación guiada paso a paso con asistencia de IA.',
        },
        {
          type: 'suivi_demandes_maker',
          title: (t.products.fixed as any).suiviDemandesTitle || 'Suivi des Demandes',
          description: (t.products.fixed as any).suiviDemandesDesc || 'Seguimiento de demandas con gestion de personas, tareas y estados.',
        },
      ];

      const ensured = await Promise.all(
        fixedDefinitions.map((productDef) =>
          getOrCreateProductByType(productDef.type, {
            title: productDef.title,
            description: productDef.description,
          }),
        ),
      );

      const productByType = new Map(ensured.map((product) => [product.type, product]));
      const orderedProducts = fixedDefinitions
        .map((productDef) => productByType.get(productDef.type))
        .filter(Boolean) as Product[];

      setFixedProducts(orderedProducts);
    } catch (error) {
      console.error('Error loading fixed products in server context:', error);

      try {
        const allProducts = await getProducts();
        const fallbackProducts = allProducts.filter((product) => FIXED_TYPES.includes(product.type));
        setFixedProducts(fallbackProducts);
      } catch (fallbackError) {
        console.error('Error loading fallback products in server context:', fallbackError);
      }
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const handleToolClick = (tool: ServerTool) => {
    if (tool.isExternal) {
      window.open(tool.url, '_blank');
    } else if (tool.internalRoute) {
      navigate(tool.internalRoute);
    }
  };

  const normalizeExternalUrl = (value?: string | null): string | null => {
    const raw = (value || '').trim();
    if (!raw) return null;
    if (/^https?:\/\//i.test(raw)) return raw;
    return `https://${raw}`;
  };

  const openProduct = (item: Product) => {
    if (item.type === 'app') {
      const externalUrl = normalizeExternalUrl(item.productLink);
      if (externalUrl) {
        window.open(externalUrl, '_blank', 'noopener,noreferrer');
        return;
      }
    }

    navigate(getProductRoute(item.type, item.id));
  };

  const handleTogglePublic = async (item: Product) => {
    try {
      const updated = await updateProduct(item.id, { isPublic: !item.isPublic });
      setFixedProducts((prev) => prev.map((product) => (product.id === item.id ? updated : product)));
    } catch (error) {
      console.error('Error toggling fixed product visibility:', error);
    }
  };

  const handleToggleFavorite = async (item: Product) => {
    try {
      const updated = await updateProduct(item.id, { isFavorite: !item.isFavorite });
      setFixedProducts((prev) => prev.map((product) => (product.id === item.id ? updated : product)));
    } catch (error) {
      console.error('Error toggling fixed product favorite state:', error);
    }
  };

  const getFixedTitle = (item: Product): string => {
    if (item.type === 'landing_page_maker') return t.products.fixed.landingTitle;
    if (item.type === 'image_generator_rag') return t.products.fixed.imageTitle;
    if (item.type === 'api_key_maker') return t.products.fixed.apiKeyTitle;
    if (item.type === 'profile_b2b_maker') return t.products.fixed.profileB2BTitle || 'B2B Profile';
    if (item.type === 'api_key_html_injector') return t.products.fixed.apiKeyHtmlTitle || 'API Key Injection';
    if (item.type === 'style_transfer_maker') return t.products.fixed.styleTransferTitle;
    if (item.type === 'translation_maker') return t.products.fixed.translationTitle;
    if (item.type === 'perplexity_search') return (t.products.fixed as any).perplexitySearchTitle || 'Búsqueda Perplexity';
    if (item.type === 'api_cost_manager') return (t.products.fixed as any).apiCostManagerTitle || 'Gestor de costos API';
    if (item.type === 'prompt_optimizer') return (t.products.fixed as any).promptOptimizerTitle || 'Optimizador de Prompt';
    if (item.type === 'creation_path') return (t.products.fixed as any).creationPathTitle || 'Creation-Path';
    if (item.type === 'suivi_demandes_maker') return (t.products.fixed as any).suiviDemandesTitle || 'Suivi des Demandes';
    return item.title || item.type;
  };

  const getFixedDescription = (item: Product): string => {
    if (item.type === 'landing_page_maker') return t.products.fixed.landingDesc;
    if (item.type === 'image_generator_rag') return t.products.fixed.imageDesc;
    if (item.type === 'api_key_maker') return t.products.fixed.apiKeyDesc;
    if (item.type === 'profile_b2b_maker') return t.products.fixed.profileB2BDesc || 'B2B pipeline with OSINT, persona, matching and personalized landing.';
    if (item.type === 'api_key_html_injector') return t.products.fixed.apiKeyHtmlDesc || 'Store API keys per product and deploy your HTML through the AI proxy.';
    if (item.type === 'style_transfer_maker') return t.products.fixed.styleTransferDesc;
    if (item.type === 'translation_maker') return t.products.fixed.translationDesc;
    if (item.type === 'perplexity_search') return (t.products.fixed as any).perplexitySearchDesc || 'Búsqueda inteligente con Perplexity AI.';
    if (item.type === 'api_cost_manager') return (t.products.fixed as any).apiCostManagerDesc || 'Analiza costos, modelos disponibles e historial de reportes de una API key.';
    if (item.type === 'prompt_optimizer') return (t.products.fixed as any).promptOptimizerDesc || 'Optimiza tus prompts con IA.';
    if (item.type === 'creation_path') return (t.products.fixed as any).creationPathDesc || 'Ruta de creación guiada paso a paso.';
    if (item.type === 'suivi_demandes_maker') return (t.products.fixed as any).suiviDemandesDesc || 'Seguimiento de demandas con gestion de personas, tareas y estados.';
    return item.description || '';
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-4xl font-extrabold text-blue-600 tracking-tight">{t.sidebar.context}</h2>
        <p className="text-gray-600 dark:text-gray-300 mt-2">{t.serverTools.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {toolSections.map((section) => {
          const sectionTools = tools.filter((tool) => tool.section === section.key);
          return (
            <section key={section.key} className="space-y-3">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-semibold text-lg">
                <span>{section.title}</span>
              </div>
              <div className="h-px bg-blue-100 dark:bg-blue-900/40" />

              {sectionTools.map((tool) => {
                const Icon = tool.icon;
                const toolTranslation = t.serverTools.tools[tool.nameKey];

                return (
                  <article
                    key={tool.id}
                    className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 flex flex-col gap-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${tool.color} flex items-center justify-center`}>
                        <Icon size={20} className="text-gray-700 dark:text-gray-200" />
                      </div>
                      {tool.isExternal && <ExternalLink size={16} className="text-gray-400" />}
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">{toolTranslation.name}</h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{toolTranslation.description}</p>
                    </div>

                    {tool.url && <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{tool.url}</p>}

                    <button
                      onClick={() => handleToolClick(tool)}
                      className="mt-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow"
                    >
                      {tool.isExternal ? t.serverTools.open : t.serverTools.access}
                      <ExternalLink size={14} />
                    </button>
                  </article>
                );
              })}
            </section>
          );
        })}
      </div>

      <section className="space-y-3">
        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-semibold text-lg">
          <Sparkles size={16} />
          <span>{t.products.fixed.sectionTitle}</span>
        </div>
        <div className="h-px bg-blue-100 dark:bg-blue-900/40" />

        {isLoadingProducts ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">{t.common.loading}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {fixedProducts.map((item) => (
              <article
                key={`server-fixed-${item.type}`}
                className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-4 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between">
                  <div className={`w-11 h-11 rounded-xl ${getTypeColor(item.type)} flex items-center justify-center shadow-md`}>
                    <Package size={20} className="text-white" />
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold">
                    {t.products.fixed.badge}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">{getFixedTitle(item)}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-3">{getFixedDescription(item)}</p>
                </div>

                <div className="mt-auto flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openProduct(item)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                    >
                      <Eye size={14} />
                      {t.products.fixed.open}
                    </button>
                    <button
                      onClick={() => handleTogglePublic(item)}
                      className={`inline-flex items-center justify-center h-9 w-9 rounded-lg border transition-all ${
                        item.isPublic
                          ? 'bg-blue-50 border-blue-200 text-blue-600'
                          : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-400 hover:text-gray-600'
                      }`}
                      title={item.isPublic ? t.products.buttons.makePrivate : t.products.buttons.makePublic}
                    >
                      {item.isPublic ? <Globe size={14} /> : <Lock size={14} />}
                    </button>
                  </div>
                  <button
                    onClick={() => handleToggleFavorite(item)}
                    className={`inline-flex items-center justify-center h-9 w-9 rounded-lg border transition-all ${
                      item.isFavorite
                        ? 'bg-amber-50 border-amber-200 text-amber-600'
                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-400 hover:text-amber-500'
                    }`}
                    title={item.isFavorite ? t.products.tooltips.removeFavorite : t.products.tooltips.addFavorite}
                  >
                    <Star size={14} className={item.isFavorite ? 'fill-amber-400' : ''} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default AIContext;
