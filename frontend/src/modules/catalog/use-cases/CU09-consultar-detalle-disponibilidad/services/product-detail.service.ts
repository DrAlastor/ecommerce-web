import api from '../../../../../services/api/api';
import type { ProductDetail } from '../types/product-detail.types';

export const productDetailService = {
  async getProductById(id: number): Promise<ProductDetail> {
    const response = await api.get<ProductDetail>(`/catalog/products/${id}`);
    return response.data;
  },
};
