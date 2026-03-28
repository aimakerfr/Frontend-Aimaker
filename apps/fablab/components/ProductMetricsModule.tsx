import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { getProducts, type Product } from '@core/products';
import { getAllObjects, type ObjectItem } from '@core/objects';
import { useLanguage } from '../language/useLanguage';

type TimeRange = '7d' | '30d' | '90d';

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
            onMouseLeave={() => setHoveredIndex(null)}
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
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: lineColor }} />
          <span>La linea sube o baja segun la cantidad diaria de {metricLabel.toLowerCase()}.</span>
        </div>
        <div>Pico: {peakPoint.count} ({formatDay(peakPoint.dayStart, locale)})</div>
      </div>
    </div>
  );
};

const ProductMetricsModule: React.FC = () => {
  const { t, language } = useLanguage() as any;
  const [products, setProducts] = useState<Product[]>([]);
  const [objects, setObjects] = useState<ObjectItem[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const [productsData, objectsData] = await Promise.all([getProducts(), getAllObjects()]);
        if (!isMounted) return;
        setProducts(Array.isArray(productsData) ? productsData : []);
        setObjects(Array.isArray(objectsData) ? objectsData : []);
      } catch (error) {
        console.error('[ProductMetricsModule] Error loading metrics data:', error);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const now = Date.now();
  const rangeDays = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  const rangeStartTimestamp = now - (rangeDays - 1) * 24 * 60 * 60 * 1000;

  const favoriteProducts = useMemo(() => products.filter((item) => item.isFavorite), [products]);
  const notebookProducts = useMemo(() => products.filter((item) => item.type === NOTEBOOK_TYPE), [products]);
  const replicatedProducts = useMemo(() => products.filter((item) => !FIXED_PRODUCT_TYPES.has(item.type)), [products]);

  const productsCreatedInRange = useMemo(() => {
    return products.filter((item) => toTimestamp(item.createdAt) >= rangeStartTimestamp);
  }, [products, rangeStartTimestamp]);

  const notebookCreatedInRange = useMemo(() => {
    return notebookProducts.filter((item) => toTimestamp(item.createdAt) >= rangeStartTimestamp);
  }, [notebookProducts, rangeStartTimestamp]);

  const objectsCreatedInRange = useMemo(() => {
    return objects.filter((item) => toTimestamp(item.createdAt) >= rangeStartTimestamp);
  }, [objects, rangeStartTimestamp]);

  const productTrendSeries = useMemo(() => {
    return buildDailySeries(productsCreatedInRange, (item) => item.createdAt, rangeStartTimestamp);
  }, [productsCreatedInRange, rangeStartTimestamp]);

  const objectsTrendSeries = useMemo(() => {
    return buildDailySeries(objectsCreatedInRange, (item) => item.createdAt, rangeStartTimestamp);
  }, [objectsCreatedInRange, rangeStartTimestamp]);

  const locale = typeof language === 'string' ? language : 'en';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
          <BarChart3 size={20} className="text-blue-500" />
          {(t as any).dashboard?.metricsTitle || 'Product Metrics'}
        </h2>
        <div className="flex items-center gap-2">
          {(['7d', '30d', '90d'] as TimeRange[]).map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setTimeRange(range)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400">{(t as any).dashboard?.totalProductsLabel || 'Total products'}</div>
          <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{products.length}</div>
        </div>
        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400">{(t as any).dashboard?.totalFavoritesLabel || 'Total favorites'}</div>
          <div className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">{favoriteProducts.length}</div>
        </div>
        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400">{(t as any).dashboard?.totalNotebooksLabel || 'Total notebook products'}</div>
          <div className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">{notebookProducts.length}</div>
        </div>
        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400">{(t as any).dashboard?.createdInRangeLabel || 'Created in selected range'}</div>
          <div className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{productsCreatedInRange.length}</div>
        </div>
        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400">{(t as any).dashboard?.notebooksInRangeLabel || 'Notebooks created in range'}</div>
          <div className="mt-1 text-2xl font-bold text-indigo-600 dark:text-indigo-400">{notebookCreatedInRange.length}</div>
        </div>
      </div>

      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        {(t as any).dashboard?.replicatedProductsLabel || 'Replicable products (excluding fixed types)'}: {replicatedProducts.length}
      </p>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <LineTrendChart
          title={(t as any).dashboard?.productsTrendTitle || 'Products creation trend'}
          subtitle={(t as any).dashboard?.productsTrendSubtitle || 'Daily created products in selected range'}
          series={productTrendSeries}
          lineColor="#2563eb"
          fillColor="#93c5fd"
          locale={locale}
          metricLabel={(t as any).dashboard?.productsMetricLabel || 'Products'}
        />
        <LineTrendChart
          title={(t as any).dashboard?.objectsTrendTitle || 'Objects upload trend'}
          subtitle={(t as any).dashboard?.objectsTrendSubtitle || 'Daily new objects in table objects'}
          series={objectsTrendSeries}
          lineColor="#0f766e"
          fillColor="#99f6e4"
          locale={locale}
          metricLabel={(t as any).dashboard?.objectsMetricLabel || 'Objects'}
        />
      </div>
    </div>
  );
};

export default ProductMetricsModule;
