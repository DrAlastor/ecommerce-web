/**
 * @caso-de-uso CU09 — Consultar detalle y disponibilidad de producto
 * @subsistema Catálogo e Inventario
 * @capa Control (presentación) — Frontend web
 * @responsabilidad Coordina estado, validaciones y acciones de la interfaz antes de delegar la operación al servicio o API.
 * @secuencia Cliente -> detalle del producto -> controlador de detalle -> servicios de catálogo e inventario -> Producto/Variante/Inventario/Sucursal.
 */
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productDetailService } from '../services/product-detail.service';
import { useShop } from '../../../../../context/ShopContext';
import type { ProductDetail, ProductVariant } from '../types/product-detail.types';
import type { Product } from '../../../../../types/shop.types';

export function useProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, isInWishlist } = useShop();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [selectedColorId, setSelectedColorId] = useState<number | null>(null);
  const [selectedTallaId, setSelectedTallaId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'descripcion' | 'sucursales' | 'guia'>('descripcion');

  const fetchProduct = useCallback(async () => {
    if (!id || isNaN(Number(id))) {
      setErrorMessage('Identificador de producto inválido.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await productDetailService.getProductById(Number(id));
      setProduct(data);

      // Preseleccionar primer color y primera talla disponibles
      if (data.variantes.length > 0) {
        const firstInStock = data.variantes.find((v) => v.total_stock > 0) || data.variantes[0];
        setSelectedColorId(firstInStock.color.id_color);
        setSelectedTallaId(firstInStock.talla.id_talla);
      } else {
        if (data.colores_disponibles.length > 0) {
          setSelectedColorId(data.colores_disponibles[0].id_color);
        }
        if (data.tallas_disponibles.length > 0) {
          setSelectedTallaId(data.tallas_disponibles[0].id_talla);
        }
      }
    } catch (err: any) {
      console.error('Error al cargar detalle de producto:', err);
      setErrorMessage(
        err.response?.data?.message || 'No se pudo cargar la información del producto solicitado.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  // Variante seleccionada
  const selectedVariant: ProductVariant | null = useMemo(() => {
    if (!product || selectedColorId === null) return null;
    if (selectedTallaId !== null) {
      const exactMatch = product.variantes.find(
        (v) => v.color.id_color === selectedColorId && v.talla.id_talla === selectedTallaId,
      );
      if (exactMatch) return exactMatch;
    }
    return product.variantes.find((v) => v.color.id_color === selectedColorId) || null;
  }, [product, selectedColorId, selectedTallaId]);

  const isInitialLoadRef = useRef(true);

  // Al cambiar de producto en la ruta, reiniciar la bandera de carga inicial
  useEffect(() => {
    isInitialLoadRef.current = true;
  }, [id]);

  // Lista dinámica de imágenes:
  // - Posición 0 (arriba): Variante dinámica según el color seleccionado
  // - Posición 1 (abajo): Portada original de la modelo
  const galleryImages = useMemo(() => {
    if (!product) return [];
    const list = [...product.imagenes];
    if (selectedVariant?.imagen_url) {
      const existingIdx = list.findIndex((img) => img.url === selectedVariant.imagen_url);
      if (existingIdx !== -1) {
        const [found] = list.splice(existingIdx, 1);
        list.unshift(found);
      } else {
        list.unshift({
          id_imagen_producto: -selectedVariant.id_producto_variante,
          url: selectedVariant.imagen_url,
          texto_alternativo: `${product.nombre} - ${selectedVariant.color.nombre}`,
          es_principal: true,
          orden: 0,
        });
      }
    }
    return list;
  }, [product, selectedVariant]);

  // Al cargar el producto inicialmente: "primero la portada" (abajo, índice 1)
  useEffect(() => {
    if (!product || galleryImages.length === 0) return;
    if (isInitialLoadRef.current) {
      const portadaIdx = galleryImages.length > 1 && selectedVariant?.imagen_url ? 1 : 0;
      setActiveImageIndex(portadaIdx);
    }
  }, [product?.id_producto, galleryImages.length, selectedVariant?.imagen_url]);

  // Al seleccionar activamente un color de variante: mostrar la variante en la imagen grande (arriba, índice 0)
  const handleSelectColor = useCallback((colorId: number) => {
    isInitialLoadRef.current = false;
    setSelectedColorId(colorId);
    setActiveImageIndex(0);
  }, []);

  // Precios dinámicos
  const currentPrice = selectedVariant
    ? selectedVariant.precio_final
    : product?.precio_final_base || 0;

  const originalPrice = selectedVariant
    ? selectedVariant.precio_variante
    : product?.precio_base || 0;

  const hasDiscount = selectedVariant
    ? selectedVariant.tiene_descuento
    : product?.tiene_descuento || false;

  const discountPercent = selectedVariant
    ? selectedVariant.descuento_porcentaje
    : product?.descuento_porcentaje || 0;

  const isAvailable = Boolean(selectedVariant && selectedVariant.total_stock > 0);

  // Convertir a tipo Product de ShopContext para la cesta
  const toShopProduct = (): Product | null => {
    if (!product) return null;
    return {
      id: product.id_producto,
      name: product.nombre,
      category: product.categoria.nombre,
      categorySlug: product.categoria.nombre.toLowerCase().replace(/\s+/g, '-'),
      price: currentPrice,
      originalPrice: hasDiscount ? originalPrice : undefined,
      rating: 4.8,
      reviewsCount: 12,
      image: galleryImages[activeImageIndex]?.url || product.imagenes[0]?.url || '',
      isNew: Boolean(product.coleccion),
      isSale: hasDiscount,
      description: product.descripcion || undefined,
      sizes: product.tallas_disponibles.map((t) => t.codigo),
      colors: product.colores_disponibles.map((c) => c.nombre),
    };
  };

  const handleAddToCart = () => {
    const shopProd = toShopProduct();
    if (!shopProd || !selectedVariant) return;
    addToCart(
      shopProd,
      quantity,
      selectedVariant.talla.codigo,
      selectedVariant.color.nombre,
      selectedVariant.id_producto_variante,
    );
  };

  const isFavorited = product ? isInWishlist(product.id_producto) : false;

  const handleToggleWishlist = () => {
    if (!product) return;
    toggleWishlist(product.id_producto);
  };

  return {
    id,
    product,
    galleryImages,
    isLoading,
    errorMessage,
    selectedColorId,
    setSelectedColorId: handleSelectColor,
    selectedTallaId,
    setSelectedTallaId,
    selectedVariant,
    quantity,
    setQuantity,
    activeImageIndex,
    setActiveImageIndex,
    isSizeGuideOpen,
    setIsSizeGuideOpen,
    activeTab,
    setActiveTab,
    currentPrice,
    originalPrice,
    hasDiscount,
    discountPercent,
    isAvailable,
    isFavorited,
    fetchProduct,
    handleAddToCart,
    handleToggleWishlist,
    navigate,
  };
}
