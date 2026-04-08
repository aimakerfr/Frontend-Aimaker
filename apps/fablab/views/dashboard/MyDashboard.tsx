import React, { useEffect, useMemo, useState } from 'react';
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

const toTimestamp = (value: string | null | undefined): number => {
  if (!value) return 0;
  const parsed = new Date(value.replace(' ', 'T')).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

const formatDay = (timestamp: number, locale: string): string => {
  return new Date(timestamp).toLocaleDateString(locale, { month: 'short', day: '2-digit' });
};

const buildDailySeries = <T,>(
  items: T[],
  getDate: (item: T) => string | null | undefined,
  startTimestamp: number
): Array<{ dayStart: number; count: number }> => {
  const dayMs = 24 * 60 * 60 * 1000;
  const now = new Date();
  const endDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startDay = new Date(new Date(startTimestamp).getFullYear(), new Date(startTimestamp).getMonth(), new Date(startTimestamp).getDate()).getTime();

  const counters = new Map<number, number>();
  for (let day = startDay; day <= endDay; day += dayMs) {
    counters.set(day, 0);
  }

  items.forEach((item) => {
    const ts = toTimestamp(getDate(item));
    if (!ts || ts < startDay || ts > endDay + dayMs) return;
    const day = new Date(new Date(ts).getFullYear(), new Date(ts).getMonth(), new Date(ts).getDate()).getTime();
    if (!counters.has(day)) return;
    counters.set(day, (counters.get(day) || 0) + 1);
  });

  return Array.from(counters.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([dayStart, count]) => ({ dayStart, count }));
};

const LineTrendChart: React.FC<{
  title: string;
  subtitle: string;
  series: Array<{ dayStart: number; count: number }>;
  lineColor: string;
  fillColor: string;
  locale: string;
  metricLabel: string;
}> = ({ title, subtitle, series, lineColor, fillColor, locale, metricLabel }) => {
  const width = 640;
  const height = 220;
  const padding = 28;
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxCount = Math.max(1, ...series.map((point) => point.count));
  const points = series.map((point, index) => {
    const x = padding + (index * (width - padding * 2)) / Math.max(1, series.length - 1);
    const y = height - padding - (point.count / maxCount) * (height - padding * 2);
    return { ...point, x, y };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
    : '';

  const sampleLabels = points.filter((_, index) => index === 0 || index === points.length - 1 || index % Math.ceil(points.length / 4 || 1) === 0);
  const totalInRange = series.reduce((acc, point) => acc + point.count, 0);
  const peakPoint = series.reduce((best, point) => (point.count > best.count ? point : best), series[0] || { dayStart: 0, count: 0 });
  const activeIndex = hoveredIndex !== null ? hoveredIndex : Math.max(0, points.length - 1);
  const activePoint = points[activeIndex];

  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!points.length) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const relativeX = ((event.clientX - rect.left) / rect.width) * width;

    let nearestIndex = 0;
    let nearestDistance = Math.abs(points[0].x - relativeX);
    for (let i = 1; i < points.length; i += 1) {
      const distance = Math.abs(points[i].x - relativeX);
      if (distance < nearestDistance) {
        nearestIndex = i;
        nearestDistance = distance;
      }
    }

    setHoveredIndex(nearestIndex);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
        </div>
        <div className="text-right">
          <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Total en rango</div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">{totalInRange}</div>
        </div>
      </div>
      {points.length === 0 ? (
        <div className="text-xs text-gray-500 dark:text-gray-400">No data</div>
      ) : (
        <div className="relative">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full"
            role="img"
            aria-label={title}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#cbd5e1" strokeWidth="1" />
            <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#cbd5e1" strokeWidth="1" />
            <text x={padding - 6} y={padding + 4} textAnchor="end" fontSize="9" fill="#64748b">{maxCount}</text>
            <text x={padding - 6} y={height - padding + 4} textAnchor="end" fontSize="9" fill="#64748b">0</text>

            {areaPath && <path d={areaPath} fill={fillColor} opacity="0.35" />}
            <path d={linePath} fill="none" stroke={lineColor} strokeWidth="2.5" />

            {activePoint && (
              <line
                x1={activePoint.x}
                x2={activePoint.x}
                y1={padding}
                y2={height - padding}
                stroke={lineColor}
                strokeOpacity="0.35"
                strokeDasharray="4 4"
              />
            )}

            {points.map((point, index) => (
              <g key={point.dayStart}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={activeIndex === index ? 5 : 3}
                  fill={lineColor}
                  fillOpacity={activeIndex === index ? 1 : 0.75}
                />
              </g>
            ))}

            {sampleLabels.map((point) => (
              <text
                key={`label-${point.dayStart}`}
                x={point.x}
                y={height - 8}
                textAnchor="middle"
                fontSize="9"
                fill="#64748b"
              >
                {formatDay(point.dayStart, locale)}
              </text>
            ))}
          </svg>

          {activePoint && (
            <div
              className="pointer-events-none absolute -translate-x-1/2 rounded-lg border border-gray-200 bg-white/95 px-3 py-2 text-xs shadow-lg dark:border-gray-700 dark:bg-gray-900/95"
              style={{
                left: `${(activePoint.x / width) * 100}%`,
                top: `${Math.max(4, (activePoint.y / height) * 100 - 18)}%`,
              }}
            >
              <div className="font-semibold text-gray-900 dark:text-white">{formatDay(activePoint.dayStart, locale)}</div>
              <div className="text-gray-600 dark:text-gray-300">{metricLabel}: <span className="font-semibold">{activePoint.count}</span></div>
            </div>
          )}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[11px] text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: lineColor }} />
          <span>La línea sube o baja según la cantidad diaria de {metricLabel.toLowerCase()}.</span>
        </div>
        <div>
          Pico: <span className="font-semibold text-gray-700 dark:text-gray-200">{peakPoint.count}</span> ({formatDay(peakPoint.dayStart, locale)})
        </div>
      </div>
    </div>
  );
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
