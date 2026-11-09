/**
 * @caso-de-uso CU08 — Consultar catálogo de productos
 * @subsistema Catálogo y Proveedores
 * @capa Fachada del módulo — Frontend web
 * @responsabilidad Expone la API pública del caso de uso y centraliza sus exportaciones para el resto de la aplicación.
 * @secuencia Cliente -> catálogo y filtros -> controlador de catálogo -> servicio de catálogo -> Producto/Categoría/Colección/Promoción.
 */
export * from './pages/CatalogPage';
export * from './hooks/useCatalog';
export * from './components/ProductCard/ProductCard';
export * from './components/ProductGrid/ProductGrid';
export * from './components/CatalogFilters/CatalogFilters';
export * from './components/CatalogToolbar/CatalogToolbar';
export * from './components/ActiveFilterChips/ActiveFilterChips';
export * from './components/CatalogPagination/CatalogPagination';
