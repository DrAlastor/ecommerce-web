/**
 * @caso-de-uso CU08 — Consultar catálogo de productos
 * @subsistema Catálogo y Proveedores
 * @capa Control (presentación) — Frontend web
 * @responsabilidad Coordina estado, validaciones y acciones de la interfaz antes de delegar la operación al servicio o API.
 * @secuencia Cliente -> catálogo y filtros -> controlador de catálogo -> servicio de catálogo -> Producto/Categoría/Colección/Promoción.
 */
import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useShop } from '../../../../../context/ShopContext';
import { CatalogApi } from '../../../services/catalog.api';
import type {
  CatalogProduct,
  CatalogFilterMetadata,
  CatalogQueryParams,
} from '../../../types/catalog.types';
import type { Product } from '../../../../../types/shop.types';

export function useCatalog() {
  const { searchQuery: globalSearchQuery } = useShop();
  const location = useLocation();

  // URL query params iniciales
  const queryParams = new URLSearchParams(location.search);
  const rawCat = queryParams.get('category');
  const isInitialSale = queryParams.get('sale') === 'true' || rawCat === 'sale';
  const initialCategory = isInitialSale ? 'all' : (rawCat || 'all');
  const initialSearch = queryParams.get('search') || globalSearchQuery || '';

  // Estados de datos
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [filterMeta, setFilterMeta] = useState<CatalogFilterMetadata | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalProducts, setTotalProducts] = useState<number>(0);

  // Estados de filtros
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [onlySale, setOnlySale] = useState<boolean>(isInitialSale);
  const [only3D, setOnly3D] = useState<boolean>(false);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('recientes');

  // Control UI móvil
  const [showMobileFilters, setShowMobileFilters] = useState<boolean>(false);

  // Cargar metadatos de filtros una sola vez
  useEffect(() => {
    let isMounted = true;
    const fetchMetadata = async () => {
      try {
        const meta = await CatalogApi.getFilterMetadata();
        if (isMounted) {
          setFilterMeta(meta);
        }
      } catch (err) {
        console.error('Error al cargar metadatos de filtros:', err);
      }
    };
    fetchMetadata();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sincronizar búsqueda global proveniente del Navbar
  useEffect(() => {
    if (globalSearchQuery !== undefined && globalSearchQuery !== searchQuery) {
      setSearchQuery(globalSearchQuery);
      setCurrentPage(1);
    }
  }, [globalSearchQuery]);

  // Sincronizar parámetros de URL (categoría, rebajas, búsqueda)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cat = params.get('category');
    const isSale = params.get('sale') === 'true' || cat === 'sale';

    if (isSale) {
      setOnlySale(true);
      setSelectedCategory('all');
    } else if (cat) {
      setSelectedCategory(cat);
      setOnlySale(false);
    }

    const searchParam = params.get('search');
    if (searchParam !== null && searchParam !== searchQuery) {
      setSearchQuery(searchParam);
    }

    setCurrentPage(1);
  }, [location.search]);

  // Cargar productos del catálogo con los filtros actuales
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const params: CatalogQueryParams = {
        page: currentPage,
        limit: 12,
        sort_by: sortBy,
      };

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      if (selectedCategory && selectedCategory !== 'all') {
        params.categoria = selectedCategory;
      }

      if (selectedGender && selectedGender !== 'all') {
        params.genero = selectedGender;
      }

      if (selectedSizes.length > 0) {
        params.talla = selectedSizes[0];
      }

      if (selectedColors.length > 0) {
        params.color = selectedColors[0];
      }

      if (onlySale) {
        params.en_oferta = true;
      }

      if (only3D) {
        params.solo_3d = true;
      }

      if (minPrice && !isNaN(Number(minPrice))) {
        params.min_price = Number(minPrice);
      }

      if (maxPrice && !isNaN(Number(maxPrice))) {
        params.max_price = Number(maxPrice);
      }

      const response = await CatalogApi.getProducts(params);
      setProducts(response.data);
      setTotalProducts(response.meta.total);
      setTotalPages(response.meta.totalPages);
    } catch (err: any) {
      console.error('Error al consultar catálogo de productos:', err);
      setErrorMessage(
        err?.response?.data?.message ||
          'No fue posible cargar el catálogo. Por favor, verifica tu conexión e inténtalo nuevamente.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    currentPage,
    sortBy,
    searchQuery,
    selectedCategory,
    selectedGender,
    selectedSizes,
    selectedColors,
    onlySale,
    only3D,
    minPrice,
    maxPrice,
  ]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Helpers de filtros
  const handleToggleColor = (colorName: string) => {
    setSelectedColors((prev) =>
      prev.includes(colorName) ? prev.filter((c) => c !== colorName) : [colorName]
    );
    setCurrentPage(1);
  };

  const handleToggleSize = (sizeCode: string) => {
    setSelectedSizes((prev) =>
      prev.includes(sizeCode) ? prev.filter((s) => s !== sizeCode) : [sizeCode]
    );
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSelectedGender('all');
    setSelectedSizes([]);
    setSelectedColors([]);
    setOnlySale(false);
    setOnly3D(false);
    setMinPrice('');
    setMaxPrice('');
    setSearchQuery('');
    setSortBy('recientes');
    setCurrentPage(1);
  };

  // Conversor hacia el tipo Product esperado por ShopContext
  const toShopProduct = (cp: CatalogProduct): Product => ({
    id: cp.id_producto,
    name: cp.nombre,
    category: cp.categoria?.nombre || 'Prenda',
    categorySlug: cp.categoria?.nombre.toLowerCase() || 'prenda',
    price: cp.precio_final,
    originalPrice: cp.tiene_descuento ? cp.precio_base : undefined,
    rating: 4.8,
    reviewsCount: 15,
    image:
      cp.imagen_principal ||
      'https://fashionstorestorage.blob.core.windows.net/productos/chaleco_sastre.png',
    isNew: cp.id_producto > 15,
    isSale: cp.tiene_descuento,
    description: cp.descripcion || '',
    sizes: cp.tallas_disponibles.map((t) => t.codigo),
    colors: cp.colores_disponibles.map((c) => c.nombre),
  });

  return {
    products,
    filterMeta,
    isLoading,
    errorMessage,
    currentPage,
    totalPages,
    totalProducts,
    selectedCategory,
    setSelectedCategory,
    selectedGender,
    setSelectedGender,
    searchQuery,
    setSearchQuery,
    selectedColors,
    selectedSizes,
    onlySale,
    setOnlySale,
    only3D,
    setOnly3D,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    sortBy,
    setSortBy,
    showMobileFilters,
    setShowMobileFilters,
    handleToggleColor,
    handleToggleSize,
    handleResetFilters,
    fetchProducts,
    setCurrentPage,
    toShopProduct,
  };
}
