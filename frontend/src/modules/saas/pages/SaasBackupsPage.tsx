import React, { useEffect, useState } from 'react';
import { saasService } from '../services/saas.service';
import type { SaasBackupItem } from '../types/saas.types';
import { SaasPagination } from '../components/SaasPagination';
import {
  HardDrive,
  Plus,
  RefreshCw,
  RotateCcw,
  Trash2,
  Filter,
  X,
  FileCheck,
} from 'lucide-react';
import './SaasBackupsPage.css';

const PAGE_SIZE = 10;

export const SaasBackupsPage: React.FC = () => {
  const [backups, setBackups] = useState<SaasBackupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState('ALL');
  const [targetTenantToBackup, setTargetTenantToBackup] = useState('dressly');
  const [isGenerating, setIsGenerating] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchBackups = async (resetPage = false) => {
    setLoading(true);
    try {
      const data = await saasService.listBackups(selectedTenant !== 'ALL' ? selectedTenant : undefined);
      setBackups(data);
      if (resetPage) setCurrentPage(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups(true);
  }, [selectedTenant]);

  const showToast = (type: 'success' | 'error' | 'warning', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4500);
  };

  const handleCreateBackup = async () => {
    setIsGenerating(true);
    try {
      const newBkp = await saasService.createBackup(targetTenantToBackup);
      showToast('success', `Copia de seguridad creada exitosamente para ${newBkp.tenantName} (${newBkp.nombre_archivo}).`);
      fetchBackups();
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || err.message || 'Error al generar backup');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRestoreBackup = async (backup: SaasBackupItem) => {
    if (
      !window.confirm(
        `¿Confirmas la restauración de la base de datos [${backup.databaseName}] del inquilino [${backup.tenantName}] desde el archivo ${backup.nombre_archivo}? Esta operación reemplazará los datos actuales.`,
      )
    ) {
      return;
    }

    setRestoringId(backup.id);
    try {
      const res = await saasService.restoreBackup(backup.id);
      showToast('success', res.message);
      fetchBackups();
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || err.message || 'Error al restaurar backup');
    } finally {
      setRestoringId(null);
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    if (!window.confirm('¿Deseas eliminar definitivamente este archivo de copia de seguridad?')) {
      return;
    }

    try {
      const res = await saasService.deleteBackup(backupId);
      showToast('warning', res.message);
      fetchBackups();
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || err.message || 'Error al eliminar backup');
    }
  };

  return (
    <div className="saas-backups-container">
      {toast && (
        <div className={`saas-toast ${toast.type}`}>
          <span>{toast.text}</span>
          <button type="button" onClick={() => setToast(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      <div className="saas-backups-header">
        <div>
          <h1 className="backups-title">Gestión de Backups y Restore Multi-Tenant</h1>
          <p className="backups-subtitle">
            Generación bajo demanda de copias de seguridad por inquilino, restauración física de esquemas dedicados y trazabilidad de retención en Azure Storage.
          </p>
        </div>
      </div>

      {/* Panel de Creación Rápida */}
      <div className="backup-creator-card">
        <div className="creator-left">
          <div className="creator-icon">
            <HardDrive size={24} />
          </div>
          <div className="creator-texts">
            <h3>Generar Copia de Seguridad Bajo Demanda</h3>
            <p>Exporta un snapshot consistente de las tablas y transacciones del tenant seleccionado.</p>
          </div>
        </div>

        <div className="creator-actions">
          <select
            value={targetTenantToBackup}
            onChange={(e) => setTargetTenantToBackup(e.target.value)}
            className="select-tenant-create"
          >
            <option value="dressly">Dressly Fashion Store (dressly_db)</option>
            <option value="urbanly">Urbanly Fashion Store (urbanly_db)</option>
            <option value="aura-sport">Aura Athletics (aura_sport_db)</option>
          </select>

          <button
            type="button"
            className="btn-create-backup"
            onClick={handleCreateBackup}
            disabled={isGenerating}
          >
            <Plus size={16} />
            <span>{isGenerating ? 'Generando Snapshot...' : 'Crear Backup Ahora'}</span>
          </button>
        </div>
      </div>

      {/* Filtros e Historial */}
      <div className="backups-list-section">
        <div className="list-controls-bar">
          <div className="filter-group">
            <Filter size={15} />
            <select
              value={selectedTenant}
              onChange={(e) => setSelectedTenant(e.target.value)}
              className="select-filter-tenant"
            >
              <option value="ALL">Todos los Tenants</option>
              <option value="dressly">Dressly Fashion Store</option>
              <option value="urbanly">Urbanly Fashion Store</option>
              <option value="aura-sport">Aura Athletics</option>
            </select>
          </div>

          <button type="button" className="btn-refresh" onClick={fetchBackups}>
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            <span>Actualizar</span>
          </button>
        </div>

        <div className="backups-table-card">
          {loading && backups.length === 0 ? (
            <div className="backups-loading">
              <div className="saas-spinner" />
              <span>Cargando catálogo de copias de seguridad...</span>
            </div>
          ) : backups.length === 0 ? (
            <div className="backups-empty">
              <HardDrive size={36} color="#94A3B8" />
              <h3>No se encontraron copias de seguridad</h3>
              <p>Genera un backup con el botón superior para comenzar.</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="backups-table">
                  <thead>
                    <tr>
                      <th>Inquilino / Base Física</th>
                      <th>Archivo de Backup</th>
                      <th>Tamaño</th>
                      <th>Fecha de Creación</th>
                      <th>Tipo</th>
                      <th>Estado</th>
                      <th>Checksum SHA-256</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backups
                      .slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
                      .map((bkp) => {
                      const isRestoring = restoringId === bkp.id;
                      return (
                        <tr key={bkp.id}>
                          <td>
                            <div className="tenant-cell">
                              <span className="tenant-name">{bkp.tenantName}</span>
                              <code className="db-code">{bkp.databaseName}</code>
                            </div>
                          </td>
                          <td>
                            <div className="file-cell">
                              <FileCheck size={14} className="text-indigo" />
                              <span className="file-name">{bkp.nombre_archivo}</span>
                            </div>
                          </td>
                          <td>
                            <strong>{bkp.tamano_formateado}</strong>
                          </td>
                          <td className="date-cell">
                            {new Date(bkp.fecha_creacion).toLocaleString('es-BO', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td>
                            <span className="backup-type-tag">{bkp.tipo_backup}</span>
                          </td>
                          <td>
                            <span
                              className={`status-pill ${
                                bkp.estado === 'DISPONIBLE'
                                  ? 'available'
                                  : bkp.estado === 'RESTAURADO'
                                  ? 'restored'
                                  : 'failed'
                              }`}
                            >
                              {bkp.estado}
                            </span>
                          </td>
                          <td>
                            <span className="hash-code" title={bkp.checksum_sha256}>
                              {bkp.checksum_sha256.slice(0, 12)}...
                            </span>
                          </td>
                          <td>
                            <div className="row-actions">
                              <button
                                type="button"
                                className="btn-restore-action"
                                onClick={() => handleRestoreBackup(bkp)}
                                disabled={isRestoring}
                                title="Restaurar base de datos a este punto en el tiempo"
                              >
                                <RotateCcw size={14} className={isRestoring ? 'spin' : ''} />
                                <span>{isRestoring ? 'Restaurando...' : 'Restaurar'}</span>
                              </button>

                              <button
                                type="button"
                                className="btn-delete-action"
                                onClick={() => handleDeleteBackup(bkp.id)}
                                title="Eliminar archivo de backup"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <SaasPagination
                currentPage={currentPage}
                totalItems={backups.length}
                pageSize={PAGE_SIZE}
                onPageChange={(page) => setCurrentPage(page)}
                itemLabel="copias de seguridad"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
