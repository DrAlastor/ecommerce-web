/**
 * @caso-de-uso CU15 — Consultar inventario
 * @subsistema Sucursales e Inventario
 * @capa Service/Gateway — Frontend web
 * @responsabilidad Encapsula la comunicación con la API o integración externa y transforma su respuesta para la capa de presentación.
 * @secuencia Administrador o Encargado -> vista de inventario -> controlador de inventario -> servicio de existencias -> Inventario/Variante/Sucursal.
 */
import api from '../../../../../services/api/api';
import type {
  InventoryItem,
  InventoryMetadata,
  InventoryQueryParams,
  InventoryResponse,
} from '../types/inventory.types';

const baseUrl = '/branches-inventory/admin/inventory';

export const inventoryService = {
  /**
   * Obtiene metadatos de filtros (sucursales permitidas para el usuario autenticado, tallas, colores, etc.)
   */
  async getMetadata(): Promise<InventoryMetadata> {
    const res = await api.get<InventoryMetadata>(`${baseUrl}/metadata`);
    return res.data;
  },

  /**
   * Consulta el inventario paginado y con estadísticas según los filtros aplicados
   */
  async getInventory(params?: InventoryQueryParams): Promise<InventoryResponse> {
    const res = await api.get<InventoryResponse>(baseUrl, {
      params: {
        search: params?.search?.trim() || undefined,
        id_sucursal: params?.id_sucursal || undefined,
        id_talla: params?.id_talla || undefined,
        id_color: params?.id_color || undefined,
        stock_status: params?.stock_status !== 'todos' ? params?.stock_status : undefined,
        page: params?.page || 1,
        limit: params?.limit || 15,
      },
    });
    return res.data;
  },

  /**
   * Obtiene el detalle de un registro específico de inventario
   */
  async getInventoryDetail(id: number): Promise<InventoryItem> {
    const res = await api.get<InventoryItem>(`${baseUrl}/${id}`);
    return res.data;
  },
};
