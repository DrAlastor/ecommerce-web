/**
 * @caso-de-uso CU10 — Gestionar catálogo de productos
 * @subsistema Catálogo y Proveedores
 * @capa Control (presentación) — Frontend web
 * @responsabilidad Coordina estado, validaciones y acciones de la interfaz antes de delegar la operación al servicio o API.
 * @secuencia Administrador -> administración de catálogo -> controlador de productos -> servicio de catálogo -> Producto/Variante/Categoría/Colección/Promoción.
 */
import { useState, useEffect, useCallback } from 'react';
import { catalogAdminService } from '../services/catalog-admin.service';
import type { AdminVariant } from '../types/catalog-admin.types';

export function useVariantAdmin(
  productId: number | null,
  onFeedback: (type: 'success' | 'error', message: string) => void,
) {
  const [variants, setVariants] = useState<AdminVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingVariant, setEditingVariant] = useState<AdminVariant | null>(null);

  const fetchVariants = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const data = await catalogAdminService.getVariants(productId);
      setVariants(data);
    } catch (err: any) {
      console.error('Error al cargar variantes:', err);
      onFeedback('error', err.response?.data?.message || 'Error al cargar variantes.');
    } finally {
      setLoading(false);
    }
  }, [productId, onFeedback]);

  useEffect(() => {
    fetchVariants();
  }, [fetchVariants]);

  const handleSaveVariant = async (data: any) => {
    if (!productId) return;
    try {
      if (editingVariant) {
        await catalogAdminService.updateVariant(editingVariant.id_producto_variante, data);
        onFeedback('success', 'Variante actualizada exitosamente.');
      } else {
        await catalogAdminService.createVariant(productId, data);
        onFeedback('success', 'Variante creada exitosamente.');
      }
      setEditingVariant(null);
      fetchVariants();
    } catch (err: any) {
      onFeedback('error', err.response?.data?.message || 'Error al guardar variante.');
      throw err;
    }
  };

  const handleToggleStatus = async (variantId: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'activo' ? 'inactivo' : 'activo';
    try {
      await catalogAdminService.toggleVariantStatus(variantId, nextStatus);
      onFeedback('success', `Variante cambiada a ${nextStatus}.`);
      fetchVariants();
    } catch (err: any) {
      onFeedback('error', err.response?.data?.message || 'Error al cambiar estado.');
    }
  };

  return {
    variants,
    loading,
    editingVariant,
    setEditingVariant,
    fetchVariants,
    handleSaveVariant,
    handleToggleStatus,
  };
}
