/**
 * @caso-de-uso CU15 — Consultar inventario
 * @subsistema Sucursales e Inventario
 * @capa Control (presentación) — Frontend web
 * @responsabilidad Coordina estado, validaciones y acciones de la interfaz antes de delegar la operación al servicio o API.
 * @secuencia Administrador o Encargado -> vista de inventario -> controlador de inventario -> servicio de existencias -> Inventario/Variante/Sucursal.
 */
import { useState, useEffect, useCallback } from 'react';
import { inventoryService } from '../services/inventory.service';
import type {
  InventoryItem,
  InventoryMetadata,
  InventoryStats,
} from '../types/inventory.types';

export function useInventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [metadata, setMetadata] = useState<InventoryMetadata | null>(null);
  const [stats, setStats] = useState<InventoryStats>({
    total_disponible: 0,
    total_reservado: 0,
    items_bajo_stock: 0,
    items_agotados: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [selectedSizeId, setSelectedSizeId] = useState<number | null>(null);
  const [selectedColorId, setSelectedColorId] = useState<number | null>(null);
  const [selectedStockStatus, setSelectedStockStatus] = useState<
    'todos' | 'disponible' | 'bajo' | 'agotado'
  >('todos');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modal de detalle
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<InventoryItem | null>(null);

  // 1. Cargar metadatos iniciales
  useEffect(() => {
    async function loadMeta() {
      try {
        const meta = await inventoryService.getMetadata();
        setMetadata(meta);
        // Si el usuario solo tiene una sucursal permitida (ej. Encargado de sucursal), preseleccionarla
        if (meta.branches.length === 1) {
          setSelectedBranchId(meta.branches[0].id_sucursal);
        }
      } catch (err: any) {
        console.error('Error al cargar metadatos de inventario:', err);
      }
    }
    loadMeta();
  }, []);

  // 2. Cargar inventario filtrado
  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await inventoryService.getInventory({
        search: searchQuery,
        id_sucursal: selectedBranchId || undefined,
        id_talla: selectedSizeId || undefined,
        id_color: selectedColorId || undefined,
        stock_status: selectedStockStatus,
        page: currentPage,
        limit: 15,
      });

      setItems(res.data);
      setTotalItems(res.meta.total);
      setTotalPages(res.meta.totalPages || 1);
      if (res.stats) {
        setStats(res.stats);
      }
    } catch (err: any) {
      console.error('Error al cargar inventario:', err);
      setError(
        err.response?.data?.message ||
          'No se pudo cargar el inventario. Verifique sus permisos de sucursal.',
      );
    } finally {
      setLoading(false);
    }
  }, [
    searchQuery,
    selectedBranchId,
    selectedSizeId,
    selectedColorId,
    selectedStockStatus,
    currentPage,
  ]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    // Si solo tiene 1 sucursal, no la reseteamos a null
    if (metadata && metadata.branches.length > 1) {
      setSelectedBranchId(null);
    }
    setSelectedSizeId(null);
    setSelectedColorId(null);
    setSelectedStockStatus('todos');
    setCurrentPage(1);
  }, [metadata]);

  return {
    items,
    metadata,
    stats,
    loading,
    error,
    searchQuery,
    setSearchQuery: (val: string) => {
      setSearchQuery(val);
      setCurrentPage(1);
    },
    selectedBranchId,
    setSelectedBranchId: (val: number | null) => {
      setSelectedBranchId(val);
      setCurrentPage(1);
    },
    selectedSizeId,
    setSelectedSizeId: (val: number | null) => {
      setSelectedSizeId(val);
      setCurrentPage(1);
    },
    selectedColorId,
    setSelectedColorId: (val: number | null) => {
      setSelectedColorId(val);
      setCurrentPage(1);
    },
    selectedStockStatus,
    setSelectedStockStatus: (val: 'todos' | 'disponible' | 'bajo' | 'agotado') => {
      setSelectedStockStatus(val);
      setCurrentPage(1);
    },
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems,
    selectedItemForDetail,
    setSelectedItemForDetail,
    handleResetFilters,
    refetch: fetchInventory,
  };
}
