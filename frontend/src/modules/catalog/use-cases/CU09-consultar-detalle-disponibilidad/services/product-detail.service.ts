/**
 * @caso-de-uso CU09 — Consultar detalle y disponibilidad de producto
 * @subsistema Catálogo e Inventario
 * @capa Service/Gateway — Frontend web
 * @responsabilidad Encapsula la comunicación con la API o integración externa y transforma su respuesta para la capa de presentación.
 * @secuencia Cliente -> detalle del producto -> controlador de detalle -> servicios de catálogo e inventario -> Producto/Variante/Inventario/Sucursal.
 */
import api from '../../../../../services/api/api';
import type { ProductDetail } from '../types/product-detail.types';

export const productDetailService = {
  async getProductById(id: number): Promise<ProductDetail> {
    const response = await api.get<ProductDetail>(`/catalog/products/${id}`);
    return response.data;
  },
};
