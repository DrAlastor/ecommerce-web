/**
 * @caso-de-uso CU27 — Consultar dashboard y reportes
 * @subsistema Reportes y Dashboard
 * @capa Service/Gateway — Frontend web
 * @responsabilidad Encapsula la comunicación con la API o integración externa y transforma su respuesta para la capa de presentación.
 * @secuencia Administrador o Encargado -> dashboard -> controlador de reportes -> servicio de agregación/exportación -> Ventas/Pagos/Inventario/Reservas/Compras.
 */
import api from '../../../../../services/api/api';
import type {
  DashboardMetrics,
  ReportData,
  ReportFilters,
} from '../types/reports.types';

const dashboardCache = new Map<string, { data: DashboardMetrics; timestamp: number }>();

export const reportsService = {
  /**
   * Obtiene métricas en vivo para el Dashboard General (con caché inteligente para cambios ultrarrápidos)
   */
  async getDashboard(
    params?: {
      fecha_inicio?: string;
      fecha_fin?: string;
      id_sucursal?: number | string;
    },
    forceRefresh = false,
  ): Promise<DashboardMetrics> {
    const key = `dash_${params?.id_sucursal || 'all'}_${params?.fecha_inicio || ''}_${params?.fecha_fin || ''}`;
    const cached = dashboardCache.get(key);
    if (!forceRefresh && cached && Date.now() - cached.timestamp < 60000) {
      return cached.data;
    }

    const res = await api.get<DashboardMetrics>('/reports/dashboard', { params });
    dashboardCache.set(key, { data: res.data, timestamp: Date.now() });
    return res.data;
  },

  /**
   * Obtiene datos cacheados de forma síncrona inmediata (0ms de latencia)
   */
  getCachedDashboard(params?: {
    fecha_inicio?: string;
    fecha_fin?: string;
    id_sucursal?: number | string;
  }): DashboardMetrics | null {
    const key = `dash_${params?.id_sucursal || 'all'}_${params?.fecha_inicio || ''}_${params?.fecha_fin || ''}`;
    const cached = dashboardCache.get(key);
    if (cached && Date.now() - cached.timestamp < 120000) {
      return cached.data;
    }
    return null;
  },

  /**
   * Obtiene sucursales autorizadas para el usuario en sesión
   */
  async getAuthorizedBranches() {
    const res = await api.get<{
      isAdmin: boolean;
      isGlobal: boolean;
      branches: { id_sucursal: number; nombre: string; ciudad?: { nombre: string } }[];
    }>('/reports/branches');
    return res.data;
  },

  /**
   * Obtiene catálogo de categorías para filtros
   */
  async getCategories() {
    const res = await api.get<{ id_categoria: number; nombre: string }[]>('/reports/categories');
    return res.data;
  },

  /**
   * Genera la vista previa de un reporte en pantalla
   */
  async generateReport(filters: ReportFilters): Promise<ReportData> {
    const res = await api.get<ReportData>('/reports/generate', { params: filters });
    return res.data;
  },

  /**
   * Descarga el archivo de reporte en CSV, Excel o PDF respetando los mismos filtros
   */
  async exportReport(
    filters: ReportFilters,
    formato: 'csv' | 'excel' | 'pdf',
  ): Promise<void> {
    const res = await api.get('/reports/export', {
      params: { ...filters, formato },
      responseType: 'blob',
    });

    const extension = formato === 'excel' ? 'xlsx' : formato;
    const cleanDate = new Date().toISOString().split('T')[0];
    const fileName = `Reporte_${filters.tipo_reporte}_${cleanDate}.${extension}`;

    const blob = new Blob([res.data], {
      type:
        formato === 'csv'
          ? 'text/csv;charset=utf-8;'
          : formato === 'pdf'
            ? 'application/pdf'
            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },
};
