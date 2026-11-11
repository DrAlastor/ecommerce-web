/**
 * @caso-de-uso CU27 — Consultar dashboard y reportes
 * @subsistema Reportes y Dashboard
 * @capa Service/Gateway — Frontend web
 * @responsabilidad Encapsula la comunicación con la API o integración externa y transforma su respuesta para la capa de presentación.
 * @secuencia Administrador o Encargado -> dashboard -> controlador de reportes -> servicio de agregación/exportación -> Ventas/Pagos/Inventario/Reservas/Compras.
 */
import api from '../../../../../services/api/api';
import type {
  AiChatResponse,
  AiReportAnalysis,
  DashboardMetrics,
  DemandPredictionResult,
  InterpretedQbeResponse,
  MonteCarloScenarioResult,
  QbeMetadata,
  QbeQueryPayload,
  QbeQueryResult,
  ReportData,
  ReportFilters,
  RfmClusterResult,
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
      role_view?: string;
    },
    forceRefresh = false,
  ): Promise<DashboardMetrics> {
    const key = `dash_${params?.role_view || 'default'}_${params?.id_sucursal || 'all'}_${params?.fecha_inicio || ''}_${params?.fecha_fin || ''}`;
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
    role_view?: string;
  }): DashboardMetrics | null {
    const key = `dash_${params?.role_view || 'default'}_${params?.id_sucursal || 'all'}_${params?.fecha_inicio || ''}_${params?.fecha_fin || ''}`;
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

  /**
   * CU32 — Obtiene el catálogo de metadatos de entidades y operadores para QBE
   */
  async getQbeMetadata(): Promise<QbeMetadata> {
    const res = await api.get<QbeMetadata>('/reports/qbe/metadata');
    return res.data;
  },

  /**
   * CU32 — Ejecuta una consulta dinámica QBE
   */
  async executeQbeQuery(payload: QbeQueryPayload): Promise<QbeQueryResult> {
    const res = await api.post<QbeQueryResult>('/reports/qbe/execute', payload);
    return res.data;
  },

  /**
   * CU32 — Exporta una consulta dinámica QBE a CSV, Excel o PDF
   */
  async exportQbeQuery(
    payload: QbeQueryPayload,
    format: 'csv' | 'excel' | 'pdf',
  ): Promise<void> {
    const res = await api.post(
      '/reports/qbe/export',
      { ...payload, format },
      { responseType: 'blob' },
    );

    const extension = format === 'excel' ? 'xlsx' : format;
    const cleanDate = new Date().toISOString().split('T')[0];
    const fileName = `Consulta_QBE_${payload.entity}_${cleanDate}.${extension}`;

    const blob = new Blob([res.data], {
      type:
        format === 'csv'
          ? 'text/csv;charset=utf-8;'
          : format === 'pdf'
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

  /**
   * CU32 & CU33 — Interpreta una consulta en lenguaje natural a parámetros estructurados QBE
   */
  async interpretNaturalQuery(prompt: string): Promise<InterpretedQbeResponse> {
    const res = await api.post<InterpretedQbeResponse>('/reports/qbe/interpret', { prompt });
    return res.data;
  },

  /**
   * CU33 — Genera un diagnóstico e insights ejecutivos con IA (Gemini)
   */
  async generateAiAnalysis(payload: {
    entity: string;
    rows: Record<string, any>[];
    totalRows: number;
    userPrompt?: string;
  }): Promise<AiReportAnalysis> {
    const res = await api.post<AiReportAnalysis>('/reports/ai/analyze', payload);
    return res.data;
  },

  /**
   * CU33 — Procesa un mensaje conversacional en el Chat Analítico con IA
   */
  async sendAiChat(payload: {
    message: string;
    history?: { role: 'user' | 'assistant'; content: string }[];
    currentContext?: Record<string, any>;
  }): Promise<AiChatResponse> {
    const res = await api.post<AiChatResponse>('/reports/ai/chat', payload);
    return res.data;
  },

  /**
   * CU33 — Síntesis de voz directa desde el backend (audio/wav streaming)
   */
  async transcribe(audio: string, mimeType: string): Promise<string> {
    const result = await api.post('/reports/ai/transcribe', {audio, mimeType}, {timeout: 65000});
    return result.data.text;
  },
  async getSpeechAudio(text: string): Promise<Blob> {
    const res = await api.post('/reports/ai/tts', { text }, {
      responseType: 'blob',
    });
    return res.data;
  },

  /**
   * CU29 — Modelo Supervisado: Red Neuronal MLP para predicción de demanda y stock crítico
   */
  async getDemandPredictions(branchId?: number): Promise<DemandPredictionResult> {
    const res = await api.get<DemandPredictionResult>('/reports/ai/predictions', {
      params: branchId ? { branchId } : undefined,
    });
    return res.data;
  },

  /**
   * CU29 — Modelo No Supervisado: K-Means RFM para segmentación y detección de riesgo de fuga
   */
  async getRfmClusters(): Promise<RfmClusterResult> {
    const res = await api.get<RfmClusterResult>('/reports/ai/rfm-clusters');
    return res.data;
  },

  /**
   * CU29 — Simulación Estocástica: Monte Carlo para proyección probabilística de escenarios
   */
  async getMonteCarloScenarios(params?: {
    horizonDays?: number;
    growthRatePercent?: number;
    branchId?: number;
  }): Promise<MonteCarloScenarioResult> {
    const res = await api.get<MonteCarloScenarioResult>('/reports/ai/scenarios', {
      params,
    });
    return res.data;
  },
};
