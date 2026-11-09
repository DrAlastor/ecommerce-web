/**
 * @caso-de-uso CU16 — Gestionar movimientos de inventario
 * @subsistema Sucursales e Inventario
 * @capa Control (presentación) — Frontend web
 * @responsabilidad Coordina estado, validaciones y acciones de la interfaz antes de delegar la operación al servicio o API.
 * @secuencia Administrador o Encargado -> formulario de movimiento -> controlador de inventario -> servicio transaccional -> MovimientoInventario/Inventario/Variante/Sucursal.
 */
import { useCallback, useEffect, useState } from 'react';
import { movementsService } from '../services/movements.service';
import type {
  CreateMovementPayload,
  MovementItem,
  MovementMetadata,
  MovementPaginationMeta,
  MovementQueryParams,
  MovementStats,
} from '../types/movements.types';

export function useMovements() {
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMeta, setLoadingMeta] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [metadata, setMetadata] = useState<MovementMetadata>({
    sucursales: [],
    variantes: [],
  });

  const [items, setItems] = useState<MovementItem[]>([]);
  const [pagination, setPagination] = useState<MovementPaginationMeta>({
    total: 0,
    page: 1,
    limit: 15,
    totalPages: 1,
  });

  const [stats, setStats] = useState<MovementStats>({
    total_movimientos: 0,
    unidades_ingresadas: 0,
    unidades_egresadas: 0,
    unidades_ajustes: 0,
    unidades_devoluciones: 0,
  });

  const [filters, setFilters] = useState<MovementQueryParams>({
    search: '',
    id_sucursal: undefined,
    tipo_movimiento: 'todos',
    fecha_desde: '',
    fecha_hasta: '',
    page: 1,
    limit: 15,
  });

  const [selectedMovement, setSelectedMovement] = useState<MovementItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  // Carga de metadatos (sucursales y variantes con existencias)
  const fetchMetadata = useCallback(async () => {
    try {
      setLoadingMeta(true);
      const data = await movementsService.getMetadata();
      setMetadata(data);
    } catch (err: any) {
      console.error('Error cargando metadatos de movimientos:', err);
    } finally {
      setLoadingMeta(false);
    }
  }, []);

  // Carga del historial de movimientos
  const fetchMovements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await movementsService.getMovements(filters);
      setItems(res.data);
      setPagination(res.pagination);
      setStats(res.stats);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        'Error al consultar el historial de movimientos.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  const updateFilters = (newFilters: Partial<MovementQueryParams>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: newFilters.page !== undefined ? newFilters.page : 1,
    }));
  };

  const handleCreateMovement = async (payload: CreateMovementPayload) => {
    try {
      setSubmitting(true);
      const result = await movementsService.createMovement(payload);
      setIsCreateModalOpen(false);
      // Refrescar metadatos (stocks actualizados) e historial
      await Promise.all([fetchMetadata(), fetchMovements()]);
      return { success: true, message: result.message };
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        'No se pudo registrar el movimiento de inventario.';
      return { success: false, message: msg };
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDetail = (item: MovementItem) => {
    setSelectedMovement(item);
    setIsDetailModalOpen(true);
  };

  return {
    loading,
    loadingMeta,
    submitting,
    error,
    metadata,
    items,
    pagination,
    stats,
    filters,
    selectedMovement,
    isCreateModalOpen,
    isDetailModalOpen,
    updateFilters,
    handleCreateMovement,
    handleOpenDetail,
    setIsCreateModalOpen,
    setIsDetailModalOpen,
    refetch: fetchMovements,
  };
}
