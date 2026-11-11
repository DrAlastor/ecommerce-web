import api from '../../../services/api/api';
import type {
  ClusterMonitoringOverview,
  EnrichedTenantDetails,
  OperationalResult,
  SaasBackupItem,
  SaasBitacoraItem,
  SaasDashboardMetricsResponse,
  SaasSuperAdminUser,
  SaasPlanItem,
  CreatePlanPayload,
  UpdatePlanPayload,
  UpdateTenantDataPayload,
} from '../types/saas.types';

export const saasService = {
  /**
   * CU01 - Autenticación del Super Administrador del SaaS
   */
  async loginSuperAdmin(email: string, password: string): Promise<{ accessToken: string; user: SaasSuperAdminUser }> {
    const res = await api.post<{ accessToken: string; user: SaasSuperAdminUser }>('/saas/auth/login', {
      email,
      password,
    });
    if (res.data?.accessToken) {
      localStorage.setItem('saas_token', res.data.accessToken);
      localStorage.setItem('saas_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  async getSuperAdminProfile(): Promise<SaasSuperAdminUser> {
    const token = localStorage.getItem('saas_token');
    const res = await api.get<SaasSuperAdminUser>('/saas/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },

  logoutSuperAdmin(): void {
    localStorage.removeItem('saas_token');
    localStorage.removeItem('saas_user');
  },

  getStoredSuperAdmin(): SaasSuperAdminUser | null {
    const raw = localStorage.getItem('saas_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  /**
   * CU04 - Obtiene métricas consolidadas del Dashboard de Super Admin
   */
  async getSuperAdminDashboard(params?: {
    timeRange?: string;
    plan?: string;
    status?: string;
  }): Promise<SaasDashboardMetricsResponse> {
    const res = await api.get<SaasDashboardMetricsResponse>('/saas/dashboard/metrics', {
      params,
    });
    return res.data;
  },

  /**
   * CU05 - Obtiene el panorama completo de salud y telemetría de todos los tenants
   */
  async getMonitoringOverview(): Promise<ClusterMonitoringOverview> {
    const res = await api.get<ClusterMonitoringOverview>('/saas/monitoring/overview');
    return res.data;
  },

  async pingTenant(tenantKey: string): Promise<OperationalResult> {
    const res = await api.post<OperationalResult>(`/saas/monitoring/${tenantKey}/ping`);
    return res.data;
  },

  async resetTenantPool(tenantKey: string): Promise<OperationalResult> {
    const res = await api.post<OperationalResult>(`/saas/monitoring/${tenantKey}/reset-pool`);
    return res.data;
  },

  async purgeTenantCache(tenantKey: string): Promise<OperationalResult> {
    const res = await api.post<OperationalResult>(`/saas/monitoring/${tenantKey}/purge-cache`);
    return res.data;
  },

  async toggleTenantStatus(tenantKey: string, reason?: string): Promise<OperationalResult> {
    const res = await api.post<OperationalResult>(`/saas/monitoring/${tenantKey}/toggle-status`, {
      reason,
    });
    return res.data;
  },

  async updateTenantQuota(
    tenantKey: string,
    quotaStorageMb: number,
    maxConnections: number,
  ): Promise<OperationalResult> {
    const res = await api.post<OperationalResult>(`/saas/monitoring/${tenantKey}/update-quota`, {
      quotaStorageMb,
      maxConnections,
    });
    return res.data;
  },

  /**
   * Gestión de Tenants & Edición de Datos
   */
  async getAllTenants(): Promise<EnrichedTenantDetails[]> {
    const res = await api.get<EnrichedTenantDetails[]>('/saas/tenants');
    return res.data;
  },

  async updateTenant(
    tenantKey: string,
    payload: UpdateTenantDataPayload,
  ): Promise<{ success: boolean; message: string; data: EnrichedTenantDetails }> {
    const res = await api.put<{ success: boolean; message: string; data: EnrichedTenantDetails }>(
      `/saas/tenants/${tenantKey}`,
      payload,
    );
    return res.data;
  },

  /**
   * Bitácora de los Tenants
   */
  async getConsolidatedBitacora(params?: {
    tenantKey?: string;
    search?: string;
    limit?: number;
  }): Promise<SaasBitacoraItem[]> {
    const res = await api.get<SaasBitacoraItem[]>('/saas/bitacora', { params });
    return res.data;
  },

  /**
   * Backups y Restore de los Tenants
   */
  async listBackups(tenantKey?: string): Promise<SaasBackupItem[]> {
    const res = await api.get<SaasBackupItem[]>('/saas/backups', {
      params: { tenantKey },
    });
    return res.data;
  },

  async createBackup(tenantKey: string): Promise<SaasBackupItem> {
    const res = await api.post<SaasBackupItem>(`/saas/backups/${tenantKey}/create`);
    return res.data;
  },

  async restoreBackup(backupId: string): Promise<{ success: boolean; message: string; backup: SaasBackupItem }> {
    const res = await api.post<{ success: boolean; message: string; backup: SaasBackupItem }>(
      `/saas/backups/${backupId}/restore`,
    );
    return res.data;
  },

  async deleteBackup(backupId: string): Promise<{ success: boolean; message: string }> {
    const res = await api.delete<{ success: boolean; message: string }>(`/saas/backups/${backupId}`);
    return res.data;
  },

  /**
   * CU02 - Gestión de Planes de Suscripción (CRUD)
   */
  async getPlans(): Promise<SaasPlanItem[]> {
    const res = await api.get<SaasPlanItem[]>('/saas/plans');
    return res.data;
  },

  async getPlanById(id: number): Promise<SaasPlanItem> {
    const res = await api.get<SaasPlanItem>(`/saas/plans/${id}`);
    return res.data;
  },

  async createPlan(data: CreatePlanPayload): Promise<SaasPlanItem> {
    const res = await api.post<SaasPlanItem>('/saas/plans', data);
    return res.data;
  },

  async updatePlan(id: number, data: UpdatePlanPayload): Promise<SaasPlanItem> {
    const res = await api.put<SaasPlanItem>(`/saas/plans/${id}`, data);
    return res.data;
  },

  async deletePlan(id: number): Promise<{ success: boolean; message: string }> {
    const res = await api.delete<{ success: boolean; message: string }>(`/saas/plans/${id}`);
    return res.data;
  },
};
