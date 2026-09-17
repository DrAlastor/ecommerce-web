import api from '../../../services/api/api';
import type {
  AddToCartPayload,
  BackendCart,
  SyncCartPayload,
  UpdateCartItemPayload,
} from '../types/cart.types';

export const cartService = {
  /**
   * Obtiene el carrito activo del cliente autenticado
   */
  async getCart(): Promise<BackendCart> {
    const response = await api.get<BackendCart>('/sales-billing/cart');
    return response.data;
  },

  /**
   * Agrega un producto variante al carrito
   */
  async addToCart(payload: AddToCartPayload): Promise<BackendCart> {
    const response = await api.post<BackendCart>('/sales-billing/cart/items', payload);
    return response.data;
  },

  /**
   * Actualiza la cantidad de un ítem en el carrito
   */
  async updateQuantity(idItem: number, payload: UpdateCartItemPayload): Promise<BackendCart> {
    const response = await api.patch<BackendCart>(`/sales-billing/cart/items/${idItem}`, payload);
    return response.data;
  },

  /**
   * Elimina un ítem específico del carrito
   */
  async removeItem(idItem: number): Promise<BackendCart> {
    const response = await api.delete<BackendCart>(`/sales-billing/cart/items/${idItem}`);
    return response.data;
  },

  /**
   * Vacía el carrito completo
   */
  async clearCart(): Promise<BackendCart> {
    const response = await api.delete<BackendCart>('/sales-billing/cart/clear');
    return response.data;
  },

  /**
   * Sincroniza ítems de sesión local al carrito de base de datos
   */
  async syncGuestCart(payload: SyncCartPayload): Promise<BackendCart> {
    const response = await api.post<BackendCart>('/sales-billing/cart/sync', payload);
    return response.data;
  },
};
