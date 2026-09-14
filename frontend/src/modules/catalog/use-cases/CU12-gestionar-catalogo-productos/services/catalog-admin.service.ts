import api from '../../../../../services/api/api';
import type {
  AdminProduct,
  AdminVariant,
  AdminCategory,
  AdminSize,
  AdminColor,
  AdminSeason,
  AdminCollection,
  AdminSizeGuide,
  AdminPromotion,
  CatalogMetadata,
  PaginatedResponse,
} from '../types/catalog-admin.types';

export const catalogAdminService = {
  // Metadata
  async getMetadata(): Promise<CatalogMetadata> {
    const res = await api.get<CatalogMetadata>('/catalog/admin/metadata');
    return res.data;
  },

  // Products
  async getProducts(params?: {
    search?: string;
    id_categoria?: number;
    id_coleccion?: number;
    genero?: string;
    estado?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<AdminProduct>> {
    const res = await api.get<PaginatedResponse<AdminProduct>>('/catalog/admin/products', { params });
    return res.data;
  },

  async getProductById(id: number): Promise<AdminProduct> {
    const res = await api.get<AdminProduct>(`/catalog/admin/products/${id}`);
    return res.data;
  },

  async createProduct(data: {
    nombre: string;
    descripcion?: string;
    precio_base: number;
    genero?: string;
    estado?: string;
    id_categoria: number;
    id_coleccion?: number;
  }): Promise<{ message: string; data: AdminProduct }> {
    const res = await api.post('/catalog/admin/products', data);
    return res.data;
  },

  async updateProduct(
    id: number,
    data: {
      nombre?: string;
      descripcion?: string;
      precio_base?: number;
      genero?: string;
      estado?: string;
      id_categoria?: number;
      id_coleccion?: number;
    },
  ): Promise<{ message: string; data: AdminProduct }> {
    const res = await api.put(`/catalog/admin/products/${id}`, data);
    return res.data;
  },

  async toggleProductStatus(id: number, estado: 'activo' | 'inactivo'): Promise<{ message: string }> {
    const res = await api.patch(`/catalog/admin/products/${id}/status`, { estado });
    return res.data;
  },

  // Variants
  async getVariants(productId: number): Promise<AdminVariant[]> {
    const res = await api.get<AdminVariant[]>(`/catalog/admin/products/${productId}/variants`);
    return res.data;
  },

  async createVariant(
    productId: number,
    data: {
      sku: string;
      id_talla: number;
      id_color: number;
      precio_adicional?: number;
      modelo_3d_url?: string;
      imagen_url?: string;
      estado?: string;
    },
  ): Promise<{ message: string; data: AdminVariant }> {
    const res = await api.post(`/catalog/admin/products/${productId}/variants`, data);
    return res.data;
  },

  async updateVariant(
    id: number,
    data: {
      sku?: string;
      id_talla?: number;
      id_color?: number;
      precio_adicional?: number;
      modelo_3d_url?: string;
      imagen_url?: string;
      estado?: string;
    },
  ): Promise<{ message: string; data: AdminVariant }> {
    const res = await api.put(`/catalog/admin/variants/${id}`, data);
    return res.data;
  },

  async toggleVariantStatus(id: number, estado: 'activo' | 'inactivo'): Promise<{ message: string }> {
    const res = await api.patch(`/catalog/admin/variants/${id}/status`, { estado });
    return res.data;
  },

  // Product Images
  async addProductImage(
    productId: number,
    data: {
      url: string;
      texto_alternativo?: string;
      es_principal?: boolean;
      orden?: number;
    },
  ) {
    const res = await api.post(`/catalog/admin/products/${productId}/images`, data);
    return res.data;
  },

  async deleteProductImage(imageId: number) {
    const res = await api.delete(`/catalog/admin/images/${imageId}`);
    return res.data;
  },

  async setMainProductImage(productId: number, imageId: number) {
    const res = await api.patch(`/catalog/admin/products/${productId}/images/${imageId}/main`);
    return res.data;
  },

  // Categories
  async getCategories(): Promise<AdminCategory[]> {
    const res = await api.get<AdminCategory[]>('/catalog/admin/categories');
    return res.data;
  },

  async createCategory(data: { nombre: string; descripcion?: string; id_categoria_padre?: number }) {
    const res = await api.post('/catalog/admin/categories', data);
    return res.data;
  },

  async updateCategory(id: number, data: { nombre?: string; descripcion?: string; id_categoria_padre?: number }) {
    const res = await api.put(`/catalog/admin/categories/${id}`, data);
    return res.data;
  },

  async deleteCategory(id: number) {
    const res = await api.delete(`/catalog/admin/categories/${id}`);
    return res.data;
  },

  // Sizes & Colors
  async getSizes(): Promise<AdminSize[]> {
    const res = await api.get<AdminSize[]>('/catalog/admin/sizes');
    return res.data;
  },

  async createSize(data: { codigo: string }) {
    const res = await api.post('/catalog/admin/sizes', data);
    return res.data;
  },

  async deleteSize(id: number) {
    const res = await api.delete(`/catalog/admin/sizes/${id}`);
    return res.data;
  },

  async getColors(): Promise<AdminColor[]> {
    const res = await api.get<AdminColor[]>('/catalog/admin/colors');
    return res.data;
  },

  async createColor(data: { nombre: string; codigo_hex?: string }) {
    const res = await api.post('/catalog/admin/colors', data);
    return res.data;
  },

  async updateColor(id: number, data: { nombre?: string; codigo_hex?: string }) {
    const res = await api.put(`/catalog/admin/colors/${id}`, data);
    return res.data;
  },

  async deleteColor(id: number) {
    const res = await api.delete(`/catalog/admin/colors/${id}`);
    return res.data;
  },

  // Seasons & Collections
  async getSeasons(): Promise<AdminSeason[]> {
    const res = await api.get<AdminSeason[]>('/catalog/admin/seasons');
    return res.data;
  },

  async createSeason(data: { nombre: string; fecha_inicio: string; fecha_fin: string; estado?: string }) {
    const res = await api.post('/catalog/admin/seasons', data);
    return res.data;
  },

  async updateSeason(id: number, data: { nombre?: string; fecha_inicio?: string; fecha_fin?: string; estado?: string }) {
    const res = await api.put(`/catalog/admin/seasons/${id}`, data);
    return res.data;
  },

  async getCollections(): Promise<AdminCollection[]> {
    const res = await api.get<AdminCollection[]>('/catalog/admin/collections');
    return res.data;
  },

  async createCollection(data: { nombre: string; descripcion?: string; id_temporada?: number }) {
    const res = await api.post('/catalog/admin/collections', data);
    return res.data;
  },

  async updateCollection(id: number, data: { nombre?: string; descripcion?: string; id_temporada?: number }) {
    const res = await api.put(`/catalog/admin/collections/${id}`, data);
    return res.data;
  },

  async deleteCollection(id: number) {
    const res = await api.delete(`/catalog/admin/collections/${id}`);
    return res.data;
  },

  // Size Guides
  async getSizeGuides(categoryId?: number): Promise<AdminSizeGuide[]> {
    const res = await api.get<AdminSizeGuide[]>('/catalog/admin/size-guides', {
      params: categoryId ? { id_categoria: categoryId } : undefined,
    });
    return res.data;
  },

  async createSizeGuide(data: {
    id_categoria: number;
    parte_cuerpo: string;
    talla_etiqueta: string;
    min_cm: number;
    max_cm: number;
  }) {
    const res = await api.post('/catalog/admin/size-guides', data);
    return res.data;
  },

  async updateSizeGuide(
    id: number,
    data: {
      parte_cuerpo?: string;
      talla_etiqueta?: string;
      min_cm?: number;
      max_cm?: number;
    },
  ) {
    const res = await api.put(`/catalog/admin/size-guides/${id}`, data);
    return res.data;
  },

  async deleteSizeGuide(id: number) {
    const res = await api.delete(`/catalog/admin/size-guides/${id}`);
    return res.data;
  },

  // Promotions
  async getPromotions(): Promise<AdminPromotion[]> {
    const res = await api.get<AdminPromotion[]>('/catalog/admin/promotions');
    return res.data;
  },

  async createPromotion(data: {
    nombre: string;
    limite_usos?: number;
    tipo_descuento: 'porcentaje' | 'monto_fijo';
    valor_descuento: number;
    fecha_inicio: string;
    fecha_fin: string;
    estado?: string;
    product_ids?: number[];
  }) {
    const res = await api.post('/catalog/admin/promotions', data);
    return res.data;
  },

  async updatePromotion(
    id: number,
    data: {
      nombre?: string;
      limite_usos?: number;
      tipo_descuento?: 'porcentaje' | 'monto_fijo';
      valor_descuento?: number;
      fecha_inicio?: string;
      fecha_fin?: string;
      estado?: string;
    },
  ) {
    const res = await api.put(`/catalog/admin/promotions/${id}`, data);
    return res.data;
  },

  async togglePromotionStatus(id: number, estado: 'activo' | 'inactivo') {
    const res = await api.patch(`/catalog/admin/promotions/${id}/status`, { estado });
    return res.data;
  },

  async assignProductsToPromotion(id: number, productIds: number[]) {
    const res = await api.post(`/catalog/admin/promotions/${id}/products`, { product_ids: productIds });
    return res.data;
  },
};
