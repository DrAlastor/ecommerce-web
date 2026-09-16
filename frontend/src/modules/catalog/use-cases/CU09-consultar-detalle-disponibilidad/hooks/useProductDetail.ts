import { useState, useEffect, useCallback, useMemo } from 'react';
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
    if (!product || selectedColorId === null || selectedTallaId === null) return null;
    return (
      product.variantes.find(
        (v) =>
          v.color.id_color === selectedColorId && v.talla.id_talla === selectedTallaId,
      ) || null
    );
  }, [product, selectedColorId, selectedTallaId]);

  // Si la variante tiene una imagen específica, sincronizar imagen activa
  useEffect(() => {
    if (selectedVariant?.imagen_url && product?.imagenes) {
      const idx = product.imagenes.findIndex((img) => img.url === selectedVariant.imagen_url);
      if (idx !== -1) {
        setActiveImageIndex(idx);
      }
    }
  }, [selectedVariant, product]);

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
      image: product.imagenes[activeImageIndex]?.url || product.imagenes[0]?.url || '',
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
    addToCart(shopProd, quantity, selectedVariant.talla.codigo, selectedVariant.color.nombre);
  };

  const isFavorited = product ? isInWishlist(product.id_producto) : false;

  const handleToggleWishlist = () => {
    if (!product) return;
    toggleWishlist(product.id_producto);
  };

  return {
    id,
    product,
    isLoading,
    errorMessage,
    selectedColorId,
    setSelectedColorId,
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
