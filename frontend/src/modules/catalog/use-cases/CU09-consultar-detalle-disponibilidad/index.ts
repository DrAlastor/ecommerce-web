/**
 * @caso-de-uso CU09 — Consultar detalle y disponibilidad de producto
 * @subsistema Catálogo e Inventario
 * @capa Fachada del módulo — Frontend web
 * @responsabilidad Expone la API pública del caso de uso y centraliza sus exportaciones para el resto de la aplicación.
 * @secuencia Cliente -> detalle del producto -> controlador de detalle -> servicios de catálogo e inventario -> Producto/Variante/Inventario/Sucursal.
 */
export * from './pages/ProductDetailPage';
export * from './hooks/useProductDetail';
export * from './types/product-detail.types';
export * from './services/product-detail.service';
export * from './components/ProductGallery/ProductGallery';
export * from './components/ProductInfo/ProductInfo';
export * from './components/VariantSelector/VariantSelector';
export * from './components/BranchAvailability/BranchAvailability';
export * from './components/SizeGuideModal/SizeGuideModal';
export * from './components/VirtualFittingBadge/VirtualFittingBadge';
export * from './components/ProductActions/ProductActions';
