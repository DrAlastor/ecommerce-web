/**
 * @caso-de-uso CU10 — Gestionar catálogo de productos
 * @subsistema Catálogo y Proveedores
 * @capa Fachada del módulo — Frontend web
 * @responsabilidad Expone la API pública del caso de uso y centraliza sus exportaciones para el resto de la aplicación.
 * @secuencia Administrador -> administración de catálogo -> controlador de productos -> servicio de catálogo -> Producto/Variante/Categoría/Colección/Promoción.
 */
export { ManageCatalogPage } from './pages/ManageCatalogPage';
export { useCatalogAdmin } from './hooks/useCatalogAdmin';
export { useProductAdmin } from './hooks/useProductAdmin';
export { useVariantAdmin } from './hooks/useVariantAdmin';
export { catalogAdminService } from './services/catalog-admin.service';
export * from './types/catalog-admin.types';
