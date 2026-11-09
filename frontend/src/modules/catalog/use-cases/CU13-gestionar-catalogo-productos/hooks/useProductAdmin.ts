/**
 * @caso-de-uso CU10 — Gestionar catálogo de productos
 * @subsistema Catálogo y Proveedores
 * @capa Control (presentación) — Frontend web
 * @responsabilidad Coordina estado, validaciones y acciones de la interfaz antes de delegar la operación al servicio o API.
 * @secuencia Administrador -> administración de catálogo -> controlador de productos -> servicio de catálogo -> Producto/Variante/Categoría/Colección/Promoción.
 */
import { useState, useEffect, useCallback } from 'react';
import { catalogAdminService } from '../services/catalog-admin.service';
import type { AdminProduct, PaginationMeta } from '../types/catalog-admin.types';

export function useProductAdmin(onFeedback: (type: 'success' | 'error', message: string) => void) {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(false);

  // Filtros
  const [search, setSearch] = useState('');
  const [idCategoria, setIdCategoria] = useState<number | undefined>();
  const [estadoFilter, setEstadoFilter] = useState<'activo' | 'inactivo' | undefined>();
  const [page, setPage] = useState(1);

  // Modales
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<AdminProduct | null>(null);
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [activeProductForVariants, setActiveProductForVariants] = useState<AdminProduct | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await catalogAdminService.getProducts({
        search: search.trim() || undefined,
        id_categoria: idCategoria,
        estado: estadoFilter,
        page,
        limit: 10,
      });
      setProducts(res.data);
      setMeta(res.meta);
    } catch (err: any) {
      console.error('Error al obtener productos:', err);
      onFeedback('error', err.response?.data?.message || 'Error al cargar productos.');
    } finally {
      setLoading(false);
    }
  }, [search, idCategoria, estadoFilter, page, onFeedback]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleCreateOrUpdate = async (data: any) => {
    try {
      if (selectedProduct) {
        await catalogAdminService.updateProduct(selectedProduct.id_producto, data);
        onFeedback('success', 'Prenda actualizada exitosamente.');
      } else {
        await catalogAdminService.createProduct(data);
        onFeedback('success', 'Prenda creada exitosamente.');
      }
      setProductModalOpen(false);
      setSelectedProduct(null);
      fetchProducts();
    } catch (err: any) {
      onFeedback('error', err.response?.data?.message || 'Error al guardar prenda.');
      throw err;
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'activo' ? 'inactivo' : 'activo';
    try {
      await catalogAdminService.toggleProductStatus(id, nextStatus);
      onFeedback('success', `Producto marcado como ${nextStatus}.`);
      fetchProducts();
    } catch (err: any) {
      onFeedback('error', err.response?.data?.message || 'Error al cambiar estado.');
    }
  };

  const openCreateModal = () => {
    setSelectedProduct(null);
    setProductModalOpen(true);
  };

  const openEditModal = (prod: AdminProduct) => {
    setSelectedProduct(prod);
    setProductModalOpen(true);
  };

  const openVariantsModal = (prod: AdminProduct) => {
    setActiveProductForVariants(prod);
    setVariantModalOpen(true);
  };

  return {
    products,
    meta,
    loading,
    search,
    setSearch,
    idCategoria,
    setIdCategoria,
    estadoFilter,
    setEstadoFilter,
    page,
    setPage,
    productModalOpen,
    setProductModalOpen,
    selectedProduct,
    variantModalOpen,
    setVariantModalOpen,
    activeProductForVariants,
    fetchProducts,
    handleCreateOrUpdate,
    handleToggleStatus,
    openCreateModal,
    openEditModal,
    openVariantsModal,
  };
}
