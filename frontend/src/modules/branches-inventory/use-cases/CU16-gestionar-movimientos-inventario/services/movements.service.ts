/**
 * @caso-de-uso CU16 — Gestionar movimientos de inventario
 * @subsistema Sucursales e Inventario
 * @capa Service/Gateway — Frontend web
 * @responsabilidad Encapsula la comunicación con la API o integración externa y transforma su respuesta para la capa de presentación.
 * @secuencia Administrador o Encargado -> formulario de movimiento -> controlador de inventario -> servicio transaccional -> MovimientoInventario/Inventario/Variante/Sucursal.
 */
import api from '../../../../../services/api/api';
import type {
  CreateMovementPayload,
  MovementItem,
  MovementMetadata,
  MovementQueryParams,
  MovementResponse,
} from '../types/movements.types';

const baseUrl = '/branches-inventory/admin/movements';

export const movementsService = {
  /**
   * Obtiene metadatos para el formulario de movimientos (sucursales permitidas y variantes con stock)
   */
  async getMetadata(): Promise<MovementMetadata> {
    const res = await api.get<MovementMetadata>(`${baseUrl}/metadata`);
    return res.data;
  },

  /**
   * Consulta el historial paginado de movimientos de inventario
   */
  async getMovements(params?: MovementQueryParams): Promise<MovementResponse> {
    const res = await api.get<MovementResponse>(baseUrl, {
      params: {
        search: params?.search?.trim() || undefined,
        id_sucursal: params?.id_sucursal || undefined,
        tipo_movimiento:
          params?.tipo_movimiento && params.tipo_movimiento !== 'todos'
            ? params.tipo_movimiento
            : undefined,
        fecha_desde: params?.fecha_desde || undefined,
        fecha_hasta: params?.fecha_hasta || undefined,
        page: params?.page || 1,
        limit: params?.limit || 15,
      },
    });
    return res.data;
  },

  /**
   * Obtiene el detalle ampliado de un movimiento
   */
  async getMovementDetail(id: number): Promise<MovementItem> {
    const res = await api.get<MovementItem>(`${baseUrl}/${id}`);
    return res.data;
  },

  /**
   * Registra un nuevo movimiento manual de inventario
   */
  async createMovement(payload: CreateMovementPayload): Promise<any> {
    const res = await api.post(baseUrl, payload);
    return res.data;
  },
};
