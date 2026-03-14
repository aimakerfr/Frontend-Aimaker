import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Eye, Search, Trash2, Globe, Lock } from 'lucide-react';
import { useLanguage } from '../../language/useLanguage';
import { 
  getProducts, 
  deleteProduct,
  updateProduct,
  getOrCreateProductByType,
  type Product,
  type ProductType
} from '@core/products';

type FilterType = 'all' | 'favorites';

interface ProductsViewProps {
  items?: Product[];
  onDelete?: (itemId: number) => void;
  onTogglePublic?: (itemId: number, isPublic: boolean) => Promise<void>;
  isLoading?: boolean;
  activeFilter?: FilterType;
  setActiveFilter?: (filter: FilterType) => void;
  fixedItems?: Product[];
}

const ProductsView: React.FC<ProductsViewProps> = ({
  items = [],
  onDelete,
  onTogglePublic,
  isLoading = false,
  activeFilter: activeFilterProp,
  setActiveFilter: setActiveFilterProp,
  fixedItems = [],
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [localActiveFilter, setLocalActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const FIXED_TYPES: ProductType[] = ['landing_page_maker', 'image_generator_rag', 'translation_maker', 'style_transfer_maker'];
  
  // Function to get the correct route based on product type
  const getProductRoute = (type: string, id: number): string => {
    const routeMap: Record<string, string> = {
      'rag_chat_maker': 'notebook',
      'landing_page_maker': 'landing-page',
      'image_generator_rag': 'image-generator',
      'translation_maker': 'translation',
      'style_transfer_maker': 'style-transfer',
      'architect_ai': 'notebook', // Default to notebook until specific route is created
      'module_connector': 'notebook', // Default to notebook until specific route is created
      'custom': 'notebook' // Default
    };
    const route = routeMap[type] || 'notebook';

    // Productos fijos no dependen de un id (evita colisiones con notebooks u otros)
    if (['landing_page_maker', 'image_generator_rag', 'translation_maker', 'style_transfer_maker'].includes(type)) {
      return `/product/${route}`;
    }

    return `/product/${route}/${id}`;
  };
  
  const activeFilter = activeFilterProp ?? localActiveFilter;
  const setActiveFilter = setActiveFilterProp ?? setLocalActiveFilter;

  const getFilteredProducts = () => {
    let filtered = items.filter((product) => !FIXED_TYPES.includes(product.type));

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((product: Product) => 
        product.title?.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        product.type?.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const filteredItems = getFilteredProducts();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const getTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      'rag_chat_maker': 'RAG Chat Maker',
      'architect_ai': 'Architect AI',
      'module_connector': 'Module Connector',
      'landing_page_maker': 'Landing Page Maker',
      'image_generator_rag': 'Image Generator RAG',
      'translation_maker': 'Translation Maker',
      'style_transfer_maker': 'Style Transfer Maker',
      'custom': 'Custom'
    };
    return typeMap[type] || type;
  };

  const getTypeColor = (type: string): string => {
    const colorMap: Record<string, string> = {
      'rag_chat_maker': 'bg-gradient-to-br from-teal-500 to-cyan-600',
      'architect_ai': 'bg-gradient-to-br from-blue-500 to-indigo-600',
      'module_connector': 'bg-gradient-to-br from-emerald-500 to-green-600',
      'landing_page_maker': 'bg-gradient-to-br from-purple-500 to-violet-600',
      'image_generator_rag': 'bg-gradient-to-br from-pink-500 to-rose-600',
      'translation_maker': 'bg-gradient-to-br from-amber-500 to-orange-600',
      'style_transfer_maker': 'bg-gradient-to-br from-indigo-500 to-sky-500',
      'custom': 'bg-gradient-to-br from-gray-500 to-gray-600'
    };
    return colorMap[type] || 'bg-gradient-to-br from-gray-500 to-gray-600';
  };

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/10 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {t.products.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{t.products.subtitle}</p>
          </div>
        </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder={t.products.searchPlaceholder}
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none w-full shadow-sm"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-5 py-2.5 font-medium transition-all rounded-xl ${
                  activeFilter === 'all'
                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-md border border-blue-200 dark:border-blue-800'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700'
                }`}
              >
                {t.products.filters.all}
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-blue-50/50 dark:from-gray-900 dark:to-blue-900/20 border-b border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-12 gap-4 px-6 py-4">
                <div className="col-span-1 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{t.products.tableHeaders.type}</div>
                <div className="col-span-4 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{t.products.tableHeaders.nameDescription}</div>
                <div className="col-span-2 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{t.products.tableHeaders.template}</div>
                <div className="col-span-2 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{t.products.tableHeaders.action}</div>
                <div className="col-span-2 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{t.products.tableHeaders.status}</div>
                <div className="col-span-1 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{t.products.tableHeaders.createdAt}</div>
              </div>
            </div>

            {isLoading ? (
              <div className="px-6 py-16 text-center text-gray-500">
                <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4">{t.common.loading}</p>
              </div>
            ) : (
              <div>
                {/* Fijos */}
                {fixedItems.length > 0 && (
                  <div className="border-b border-gray-100 dark:border-gray-700 bg-blue-50/30 dark:bg-blue-900/10">
                    {fixedItems.map((item: Product) => {
                      const fixedTitle = item.type === 'landing_page_maker'
                        ? t.products.fixed.landingTitle
                        : item.type === 'image_generator_rag'
                          ? t.products.fixed.imageTitle
                          : item.type === 'style_transfer_maker'
                            ? t.products.fixed.styleTransferTitle
                            : t.products.fixed.translationTitle;
                      const fixedDesc = item.type === 'landing_page_maker'
                        ? t.products.fixed.landingDesc
                        : item.type === 'image_generator_rag'
                          ? t.products.fixed.imageDesc
                          : item.type === 'style_transfer_maker'
                            ? t.products.fixed.styleTransferDesc
                            : t.products.fixed.translationDesc;
                      return (
                      <div 
                        key={`fixed-${item.type}`}
                        className="grid grid-cols-12 gap-4 px-6 py-6 items-center"
                      >
                        <div className="col-span-1">
                          <div className="flex flex-col items-center gap-1">
                            <div className={`w-12 h-12 rounded-xl ${getTypeColor(item.type)} flex items-center justify-center shadow-lg`}>
                              <Package size={24} className="text-white" />
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold">{t.products.fixed.badge}</span>
                          </div>
                        </div>

                        <div className="col-span-4">
                          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                            {fixedTitle}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {fixedDesc}
                          </p>
                        </div>

                        <div className="col-span-2">
                          <div className="text-sm text-gray-700 dark:text-gray-300">
                            <span className="font-semibold">{getTypeLabel(item.type)}</span>
                            <div className="text-xs text-gray-500">{t.products.fixed.productLabel}</div>
                          </div>
                        </div>

                        <div className="col-span-2">
                          <button
                            onClick={() => navigate(getProductRoute(item.type, item.id))}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold transition-all text-sm hover:scale-105"
                          >
                            <Eye size={16} />
                            {t.products.fixed.open}
                          </button>
                        </div>

                        <div className="col-span-2">
                          <div className="flex flex-col gap-2">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">{t.products.fixed.alwaysActive}</span>
                            {onTogglePublic && (
                              <button
                                onClick={() => onTogglePublic(item.id, !item.isPublic)}
                                className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                                  item.isPublic
                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/40'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                                title={item.isPublic ? t.products.buttons.makePrivate : t.products.buttons.makePublic}
                              >
                                {item.isPublic ? (
                                  <>
                                    <Globe size={12} />
                                    {t.products.status.public}
                                  </>
                                ) : (
                                  <>
                                    <Lock size={12} />
                                    {t.products.status.private}
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="col-span-1">
                          <div className="text-xs text-gray-500 dark:text-gray-400">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}</div>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                )}

                {fixedItems.length > 0 && filteredItems.length > 0 && (
                  <div className="px-6 py-2 text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-700">{t.products.fixed.divider}</div>
                )}

                {/* Normales */}
                {filteredItems.length === 0 ? (
                  <div className="px-6 py-16 text-center text-gray-500">{t.products.noResults}</div>
                ) : (
                  filteredItems.map((item: Product, index: number) => (
                    <div 
                      key={item.id} 
                      className={`grid grid-cols-12 gap-4 px-6 py-6 items-center hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all ${
                        index !== filteredItems.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
                      }`}
                    >
                      <div className="col-span-1">
                        <div className="flex flex-col items-center gap-2">
                          <div className={`w-12 h-12 rounded-xl ${getTypeColor(item.type)} flex items-center justify-center shadow-lg`}>
                            <Package size={24} className="text-white" />
                          </div>
                          <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide text-center">
                            {getTypeLabel(item.type)}
                          </div>
                        </div>
                      </div>

                      <div className="col-span-4">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                          {item.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {item.description}
                        </p>
                      </div>

                      <div className="col-span-2">
                        {item.template ? (
                          <div className="text-sm text-gray-700 dark:text-gray-300">
                            <span className="font-semibold">{item.template.title}</span>
                            <div className="text-xs text-gray-500">{getTypeLabel(item.template.type)}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </div>

                      <div className="col-span-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(getProductRoute(item.type, item.id))}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold transition-all text-sm hover:scale-105"
                            title={`${t.products.buttons.view} - ${getTypeLabel(item.type)}`}
                          >
                            <Eye size={16} />
                            {t.products.buttons.view}
                          </button>
                          <button
                            onClick={() => onDelete?.(item.id)}
                            className="inline-flex items-center gap-2 px-3 py-2.5 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 border-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl font-semibold transition-all text-sm hover:scale-105"
                            title={t.products.buttons.delete}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="col-span-2">
                        <div className="flex flex-col gap-2">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            item.status === 'active' 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                          }`}>
                            {item.status}
                          </span>
                          
                          {/* Toggle Public/Private Button */}
                          {onTogglePublic && (
                            <button
                              onClick={() => onTogglePublic(item.id, !item.isPublic)}
                              className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                                item.isPublic
                                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/40'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                              }`}
                              title={item.isPublic ? t.products.buttons.makePrivate : t.products.buttons.makePublic}
                            >
                              {item.isPublic ? (
                                <>
                                  <Globe size={12} />
                                  {t.products.status.public}
                                </>
                              ) : (
                                <>
                                  <Lock size={12} />
                                  {t.products.status.private}
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="col-span-1">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

// Componente contenedor que maneja la carga de datos desde la API
const Products = () => {
  const [items, setItems] = useState<Product[]>([]);
  const [fixedItems, setFixedItems] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const { t } = useLanguage();

  const loadFixedProducts = async () => {
    try {
      const fixedTypes: Array<{ type: ProductType; title: string; description: string }> = [
        { type: 'landing_page_maker', title: t.products.fixed.landingTitle, description: t.products.fixed.landingDesc },
        { type: 'image_generator_rag', title: t.products.fixed.imageTitle, description: t.products.fixed.imageDesc },
        { type: 'translation_maker', title: t.products.fixed.translationTitle, description: t.products.fixed.translationDesc },
        { type: 'style_transfer_maker', title: t.products.fixed.styleTransferTitle, description: t.products.fixed.styleTransferDesc },
      ];

      const resolved = await Promise.all(
        fixedTypes.map((f) => getOrCreateProductByType(f.type, { title: f.title, description: f.description }))
      );
      setFixedItems(resolved);
    } catch (err) {
      console.error('[Products] Error loading fixed products:', err);
    }
  };

  const loadProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const products = await getProducts();
      setItems(products);
    } catch (err) {
      console.error('Error cargando productos:', err);
      setError(t.common.error);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    loadFixedProducts();
  }, []);

  const handleDelete = async (itemId: number) => {
    if (!confirm(t.products.confirmDelete)) return;
    
    try {
      setIsLoading(true);
      await deleteProduct(itemId);
      setItems(prev => prev.filter((item: Product) => item.id !== itemId));
    } catch (err) {
      console.error('Error eliminando producto:', err);
      setError(t.common.errorDeleting);
      await loadProducts();
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePublic = async (itemId: number, isPublic: boolean) => {
    try {
      console.log('[Products] Toggling public status:', itemId, isPublic);
      
      // Optimistic update
      setItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, isPublic } : item
      ));
      setFixedItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, isPublic } : item
      ));

      // Update in backend
      await updateProduct(itemId, { isPublic });
      
      console.log('[Products] Public status updated successfully');
    } catch (err) {
      console.error('[Products] Error toggling public status:', err);
      // Revert optimistic update
      await loadProducts();
      setError(t.common.errorUpdating || 'Error al actualizar el producto');
    }
  };

  if (error && items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-4">{error}</p>
          <button
            onClick={() => { loadProducts(); loadFixedProducts(); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {t.common.retry}
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProductsView 
      items={items} 
      isLoading={isLoading}
      onDelete={handleDelete}
      onTogglePublic={handleTogglePublic}
      activeFilter={activeFilter}
      setActiveFilter={setActiveFilter}
      fixedItems={fixedItems}
    />
  );
};

export default Products;
