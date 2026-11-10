import api from '../../../../../services/api/api';

export interface BackupMetadata {
  id: string;
  nombre_archivo: string;
  ruta_storage: string;
  tamano_bytes: number;
  tamano_formateado: string;
  tipo_backup: string;
  estado: string;
  checksum_sha256: string;
  fecha_creacion: string;
  total_tablas: number;
  total_registros: number;
  descripcion?: string;
  almacenamiento: string;
}

export interface AzureInfraInfo {
  proveedor: string;
  servicio_bd: string;
  cluster_region: string;
  modo_respaldo_fisico: string;
  estado_proteccion: string;
  pitr_habilitado: boolean;
  retencion_dias: number;
  rpo_objetivo: string;
  rto_objetivo: string;
  redundancia: string;
  cifrado: string;
  contenedor_blobs: string;
}

export interface BackupsResponse {
  infraestructura_azure: AzureInfraInfo;
  backups: BackupMetadata[];
}

export const backupApiService = {
  async listBackups(): Promise<BackupsResponse> {
    const res = await api.get('/users-security/backups', { timeout: 30000 });
    return res.data;
  },

  async generateBackup(dto?: { descripcion?: string; tipo?: string }): Promise<any> {
    const res = await api.post('/users-security/backups/generate', dto || {}, { timeout: 120000 });
    return res.data;
  },

  async downloadBackupFile(backupId: string, filename: string): Promise<void> {
    const res = await api.get(`/users-security/backups/download/${backupId}`, {
      responseType: 'blob',
      timeout: 60000,
    });
    const blob = new Blob([res.data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.json') ? filename : `${filename}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  async restoreFromBackupId(backupId: string): Promise<any> {
    const res = await api.post(
      '/users-security/backups/restore',
      { backup_id: backupId },
      { timeout: 120000 },
    );
    return res.data;
  },

  async restoreFromUploadedJson(jsonData: any): Promise<any> {
    const res = await api.post(
      '/users-security/backups/restore-upload',
      { backup_data: jsonData },
      { timeout: 120000 },
    );
    return res.data;
  },
};

