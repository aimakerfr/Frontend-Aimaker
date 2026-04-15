import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Clock3, Package } from 'lucide-react';
import { getProducts, type Product } from '@core/products';
import { useLanguage } from '../../language/useLanguage';

const NOTEBOOK_TYPE = 'rag_chat_maker';

const FIXED_PRODUCT_TYPES = new Set([
  'landing_page_maker',
  'image_generator_rag',
  'translation_maker',
  'style_transfer_maker',
  'api_key_maker',
  'api_key_html_injector',
  'profile_b2b_maker',
  'suivi_demandes_maker',
]);

const getProductTimestamp = (product: Product): number => {
  const candidate = product.updatedAt || product.createdAt;
  if (!candidate) return 0;
  return new Date(candidate.replace(' ', 'T')).getTime();
};

const formatDateTime = (value: string | null | undefined, locale: string): string => {
  if (!value) return '-';
  const date = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

type MyDashboardProps = {
  hideHeader?: boolean;
  compact?: boolean;
};

const MyDashboard: React.FC<MyDashboardProps> = ({ hideHeader = false, compact = false }) => {
  const navigate = useNavigate();
  const { t, language } = useLanguage() as any;
  const locale = typeof language === 'string' ? language.substring(0, 2) : 'en';
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const productData = await getProducts();
        if (active) {
          setProducts(Array.isArray(productData) ? productData : []);
        }
      } catch (e) {
        if (active) {
          setError((t as any).common?.error || 'Error');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [t]);

  const favoriteProducts = useMemo(() => {
    return products.filter((p) => p.isFavorite);
  }, [products]);

  const notebookProducts = useMemo(() => {
    return products.filter((p) => p.type === NOTEBOOK_TYPE);
  }, [products]);

  const latestProduct = useMemo(() => {
    if (notebookProducts.length === 0) return null;
    const sorted = [...notebookProducts].sort((a, b) => getProductTimestamp(b) - getProductTimestamp(a));
    return sorted[0] || null;
  }, [notebookProducts]);

  const getProductRoute = (type: string, id: number): string => {
    const routeMap: Record<string, string> = {
      rag_chat_maker: 'notebook',
      landing_page_maker: 'landing-page',
      image_generator_rag: 'image-generator',
      translation_maker: 'translation',
      style_transfer_maker: 'style-transfer',
      api_key_maker: 'api-key',
      api_key_html_injector: 'api-key-html',
      profile_b2b_maker: 'profile-b2b',
      suivi_demandes_maker: 'suivi-demandes',
      architect_ai: 'notebook',
      module_connector: 'notebook',
      custom: 'notebook',
    };
    const route = routeMap[type] || 'notebook';

    if (FIXED_PRODUCT_TYPES.has(type)) {
      return `/product/${route}`;
    }

    return `/product/${route}/${id}`;
  };

  return (
    <div className={compact ? 'space-y-4' : 'space-y-6'}>
      {!hideHeader && (
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {(t as any).dashboard?.myDashboardTitle || 'My Dashboard'}
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {(t as any).dashboard?.myDashboardSubtitle || 'Quick indicator panel for favorite and latest products.'}
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {(t as any).dashboard?.favoriteProductsTitle || 'Favorite Products'}
            </h2>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
              {favoriteProducts.length}
            </span>
          </div>

          {isLoading ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">{(t as any).common?.loading || 'Loading...'}</div>
          ) : favoriteProducts.length === 0 ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {(t as any).dashboard?.noFavoriteProducts || 'No favorite products yet.'}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {favoriteProducts.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => navigate(getProductRoute(product.type, product.id))}
                  className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4 text-left transition-all hover:scale-[1.01] hover:shadow-sm dark:border-amber-900/40 dark:from-gray-900 dark:to-gray-800"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <Star size={16} className="fill-amber-400 text-amber-500" />
                    <span className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                      {(t as any).dashboard?.favoriteBadge || 'Favorite'}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{product.title || '-'}</h3>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{product.type}</p>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {(t as any).dashboard?.updatedAtLabel || 'Updated'}: {formatDateTime(product.updatedAt || product.createdAt, locale)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            {(t as any).dashboard?.latestProductTitle || 'Latest Product Activity'}
          </h2>

          {isLoading ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">{(t as any).common?.loading || 'Loading...'}</div>
          ) : !latestProduct ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {(t as any).dashboard?.noProductsYet || 'No products created yet.'}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                <Package size={16} className="text-blue-500" />
                {latestProduct.title || '-'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{latestProduct.type}</div>
              <div className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                {(t as any).dashboard?.latestCreatedLabel || 'Last created/updated at'}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <Clock3 size={14} className="text-gray-500" />
                {formatDateTime(latestProduct.updatedAt || latestProduct.createdAt, locale)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyDashboard;
