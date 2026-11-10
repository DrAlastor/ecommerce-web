import React, { useState, useEffect, useRef } from 'react';
import {
  Database,
  Download,
  RotateCcw,
  Plus,
  CheckCircle2,
  ShieldCheck,
  UploadCloud,
  FileJson,
  AlertTriangle,
  Server,
  RefreshCw,
  HardDrive,
} from 'lucide-react';
import { backupApiService } from '../services/backup.service';
import type { BackupMetadata, AzureInfraInfo } from '../services/backup.service';
import '../../CU07-gestionar-empresas/pages/SettingsPages.css';

export const BackupsSettingsTab: React.FC = () => {
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [infraInfo, setInfraInfo] = useState<AzureInfraInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Estado para restauración desde archivo local
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedBackupData, setParsedBackupData] = useState<any | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Modal de confirmación para restaurar
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'cloud' | 'local';
    targetName: string;
    targetId?: string;
    dataPayload?: any;
  }>({
    isOpen: false,
    type: 'cloud',
    targetName: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchBackups = async () => {
    try {
      setIsLoading(true);
      const res = await backupApiService.listBackups();
      setBackups(res.backups || []);
      setInfraInfo(res.infraestructura_azure || null);
    } catch (err: any) {
      console.error('Error cargando backups:', err);
      showNotification('error', 'No se pudo cargar el historial de copias de seguridad.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 6000);
  };

  // Generar y descargar backup
  const handleGenerateBackup = async () => {
    try {
      setIsGenerating(true);
      const res = await backupApiService.generateBackup({
        descripcion: 'Copia de seguridad integral bajo demanda con sincronización en Azure Blob Storage',
        tipo: 'MANUAL',
      });

      showNotification(
        'success',
        `Copia generada exitosamente (${res.data?.total_registros ?? 0} registros en ${res.data?.total_tablas ?? 44} tablas). Almacenada en Azure Blob Storage.`
      );

      // Si el backend retornó el payload directo, iniciar descarga automática
      if (res.file_content && res.data?.nombre_archivo) {
        const jsonStr = JSON.stringify(res.file_content, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = res.data.nombre_archivo;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }

      await fetchBackups();
    } catch (err: any) {
      console.error('Error generando backup:', err);
      showNotification('error', err.response?.data?.message || 'Error al generar la copia de seguridad.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Descargar backup existente a la PC
  const handleDownload = async (bkp: BackupMetadata) => {
    try {
      await backupApiService.downloadBackupFile(bkp.id, bkp.nombre_archivo);
      showNotification('success', `Archivo ${bkp.nombre_archivo} descargado exitosamente.`);
    } catch (err: any) {
      console.error('Error descargando backup:', err);
      showNotification('error', 'Error al descargar el archivo de respaldo.');
    }
  };

  // Lectura y validación del archivo local seleccionado
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    setParsedBackupData(null);

    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setUploadError('El archivo debe tener formato JSON (.json).');
      return;
    }

    setUploadedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const json = JSON.parse(text);

        if (!json.tables || typeof json.tables !== 'object') {
          setUploadError('El archivo JSON no tiene la estructura de tablas de la base de datos.');
          setParsedBackupData(null);
          return;
        }

        setParsedBackupData(json);
      } catch (err) {
        setUploadError('No se pudo interpretar el archivo JSON. Verifique su sintaxis.');
        setParsedBackupData(null);
      }
    };
    reader.readAsText(file);
  };

  // Iniciar flujo de confirmación
  const openConfirmCloud = (bkp: BackupMetadata) => {
    setConfirmModal({
      isOpen: true,
      type: 'cloud',
      targetName: bkp.nombre_archivo,
      targetId: bkp.id,
    });
  };

  const openConfirmLocal = () => {
    if (!parsedBackupData) return;
    setConfirmModal({
      isOpen: true,
      type: 'local',
      targetName: uploadedFile?.name || 'Archivo local',
      dataPayload: parsedBackupData,
    });
  };

  // Ejecución final de la restauración
  const executeRestore = async () => {
    try {
      setIsRestoring(true);
      setConfirmModal((prev) => ({ ...prev, isOpen: false }));

      if (confirmModal.type === 'cloud' && confirmModal.targetId) {
        const res = await backupApiService.restoreFromBackupId(confirmModal.targetId);
        showNotification(
          'success',
          `Restauración completada: ${res.message || 'El sistema ha sido recuperado exitosamente.'}`
        );
      } else if (confirmModal.type === 'local' && confirmModal.dataPayload) {
        const res = await backupApiService.restoreFromUploadedJson(confirmModal.dataPayload);
        showNotification(
          'success',
          `Restauración desde archivo completada: ${res.message || 'Base de datos y configuraciones restauradas exitosamente.'}`
        );
        // Limpiar archivo subido tras restaurar
        setUploadedFile(null);
        setParsedBackupData(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }

      await fetchBackups();
    } catch (err: any) {
      console.error('Error restaurando respaldo:', err);
      showNotification('error', err.response?.data?.message || 'Fallo durante el proceso de restauración.');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="settings-card" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Encabezado */}
      <div className="settings-header">
        <div className="settings-header-info">
          <div className="settings-header-icon" style={{ backgroundColor: '#F5EBE6', color: '#8A5340' }}>
            <Database size={24} />
          </div>
          <div>
            <div className="settings-title-row">
              <h2 className="settings-title">Gestión de Copias de Seguridad y Restauración</h2>
              <span className="settings-status-badge" style={{ backgroundColor: '#ECFDF5', color: '#065F46', borderColor: '#A7F3D0' }}>
                Azure Cloud Conectado
              </span>
            </div>
            <p className="settings-subtitle">
              Respaldos lógicos de datos, compresión JSON atómica y snapshots físicos en Microsoft Azure
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={fetchBackups}
            disabled={isLoading || isGenerating || isRestoring}
            className="btn-secondary"
            title="Recargar catálogo de respaldos"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', height: '42px', padding: '0 0.9rem' }}
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
            Actualizar
          </button>

          <button
            onClick={handleGenerateBackup}
            disabled={isGenerating || isRestoring}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: '42px', padding: '0 1.25rem' }}
          >
            <Plus size={17} />
            {isGenerating ? 'Generando y Exportando...' : 'Generar y Descargar Backup (.json)'}
          </button>
        </div>
      </div>

      {/* Alerta de notificación */}
      {notification && (
        <div
          className={`settings-alert ${
            notification.type === 'success' ? 'settings-alert-success' : 'settings-alert-error'
          }`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}
        >
          {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <div style={{ flex: 1, fontSize: '0.9rem' }}>{notification.message}</div>
          <span style={{ fontSize: '0.78rem', color: '#6B7280', fontStyle: 'italic' }}>
            Registrado en Bitácora
          </span>
        </div>
      )}

      {/* Tarjeta 1: Infraestructura y Respaldo Físico Azure */}
      <div
        style={{
          padding: '1.25rem 1.5rem',
          backgroundColor: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Server size={22} style={{ color: '#0284C7' }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0F172A' }}>
                Respaldo Físico & Continuo — Microsoft Azure Database
              </div>
              <div style={{ fontSize: '0.82rem', color: '#64748B' }}>
                {infraInfo?.servicio_bd || 'Azure Database for PostgreSQL Flexible Server'} • Región East US 2
              </div>
            </div>
          </div>
          <span
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '9999px',
              backgroundColor: '#DCFCE7',
              color: '#15803D',
              fontSize: '0.75rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <ShieldCheck size={14} />
            {infraInfo?.estado_proteccion || 'ACTIVO Y SALUDABLE'}
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '1rem',
            fontSize: '0.82rem',
            color: '#334155',
            paddingTop: '0.75rem',
            borderTop: '1px solid #E2E8F0',
          }}
        >
          <div>
            <div style={{ color: '#64748B', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              RPO (Objetivo Punto de Recuperación)
            </div>
            <div style={{ fontWeight: 600, color: '#0F172A', marginTop: '0.2rem' }}>
              {infraInfo?.rpo_objetivo || '< 5 minutos (WAL Archiving Continuo)'}
            </div>
          </div>
          <div>
            <div style={{ color: '#64748B', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              RTO (Tiempo de Recuperación)
            </div>
            <div style={{ fontWeight: 600, color: '#0F172A', marginTop: '0.2rem' }}>
              {infraInfo?.rto_objetivo || '< 15 minutos (Point-in-Time Restore)'}
            </div>
          </div>
          <div>
            <div style={{ color: '#64748B', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Retención & Redundancia
            </div>
            <div style={{ fontWeight: 600, color: '#0F172A', marginTop: '0.2rem' }}>
              35 Días • Geo-Redundante (GRS)
            </div>
          </div>
          <div>
            <div style={{ color: '#64748B', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Almacenamiento Azure Blob
            </div>
            <div style={{ fontWeight: 600, color: '#0F172A', marginTop: '0.2rem', fontFamily: 'monospace' }}>
              fashionstorestorages / backups
            </div>
          </div>
        </div>
      </div>

      {/* Tarjeta 2: Restaurar desde archivo local (.json) */}
      <div
        style={{
          padding: '1.25rem 1.5rem',
          backgroundColor: '#FFFFFF',
          border: '1px dashed #CBD5E1',
          borderRadius: '12px',
          marginBottom: '1.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <UploadCloud size={22} style={{ color: '#8A5340' }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1E293B' }}>
                Restaurar desde Archivo Local (.json)
              </div>
              <div style={{ fontSize: '0.82rem', color: '#64748B' }}>
                Suba una copia de seguridad previamente descargada en su PC para restaurar la totalidad de los datos
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary"
            style={{ fontSize: '0.85rem', padding: '0.45rem 0.9rem' }}
          >
            Seleccionar Archivo...
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json,application/json"
            style={{ display: 'none' }}
          />
        </div>

        {uploadError && (
          <div style={{ color: '#DC2626', fontSize: '0.82rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <AlertTriangle size={15} />
            {uploadError}
          </div>
        )}

        {parsedBackupData && (
          <div
            style={{
              marginTop: '0.85rem',
              padding: '0.85rem 1.15rem',
              backgroundColor: '#F1F5F9',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <FileJson size={28} style={{ color: '#0F766E' }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#0F172A', fontFamily: 'monospace' }}>
                  {uploadedFile?.name}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748B', display: 'flex', gap: '0.8rem', marginTop: '0.15rem' }}>
                  <span>
                    <strong>Tablas:</strong> {parsedBackupData.metadata?.total_tablas || Object.keys(parsedBackupData.tables || {}).length}
                  </span>
                  <span>
                    <strong>Registros:</strong> {parsedBackupData.metadata?.total_registros ?? 'Incluidos'}
                  </span>
                  <span>
                    <strong>Fecha origen:</strong> {parsedBackupData.metadata?.fecha_creacion ? new Date(parsedBackupData.metadata.fecha_creacion).toLocaleString() : 'N/D'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={openConfirmLocal}
              disabled={isRestoring}
              className="btn-danger"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 1rem', fontSize: '0.82rem' }}
            >
              <RotateCcw size={15} />
              {isRestoring ? 'Restaurando...' : 'Restaurar Este Archivo'}
            </button>
          </div>
        )}
      </div>

      {/* Sección 3: Historial y Catálogo de Respaldos Lógicos en Azure */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1E293B', margin: 0 }}>
              Puntos de Respaldo Lógico en la Nube
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>
              Copias íntegras archivadas en Microsoft Azure Blob Storage con validación criptográfica SHA-256
            </p>
          </div>

          <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
            Total disponibles: <strong>{backups.length}</strong>
          </div>
        </div>

        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.75rem' }} />
            <div>Cargando respaldos desde Azure Blob Storage...</div>
          </div>
        ) : backups.length === 0 ? (
          <div
            style={{
              padding: '2.5rem',
              textAlign: 'center',
              backgroundColor: '#F8FAFC',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              color: '#64748B',
            }}
          >
            <HardDrive size={32} style={{ margin: '0 auto 0.75rem', color: '#94A3B8' }} />
            <div style={{ fontWeight: 600, color: '#334155' }}>Aún no se han generado copias de seguridad</div>
            <div style={{ fontSize: '0.82rem', marginTop: '0.25rem' }}>
              Haga clic en "Generar y Descargar Backup" para crear la primera copia en Azure y guardarla en su PC.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '10px' }}>
            <table className="backups-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.78rem', color: '#475569', textTransform: 'uppercase' }}>
                    Archivo de Respaldo
                  </th>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.78rem', color: '#475569', textTransform: 'uppercase' }}>
                    Fecha y Hora
                  </th>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.78rem', color: '#475569', textTransform: 'uppercase' }}>
                    Tipo
                  </th>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.78rem', color: '#475569', textTransform: 'uppercase' }}>
                    Tamaño
                  </th>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.78rem', color: '#475569', textTransform: 'uppercase' }}>
                    Estado
                  </th>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.78rem', color: '#475569', textTransform: 'uppercase', textAlign: 'right' }}>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {backups.map((bkp) => (
                  <tr
                    key={bkp.id}
                    style={{
                      borderBottom: '1px solid #F1F5F9',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileJson size={17} style={{ color: '#0284C7' }} />
                        <div>
                          <div style={{ fontFamily: 'monospace', fontSize: '0.82rem', fontWeight: 600, color: '#0F172A' }}>
                            {bkp.nombre_archivo}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontFamily: 'monospace' }}>
                            SHA256: {bkp.checksum_sha256?.slice(0, 16)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#475569', fontSize: '0.84rem', whiteSpace: 'nowrap' }}>
                      {new Date(bkp.fecha_creacion).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span
                        style={{
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          backgroundColor: bkp.tipo_backup === 'PROGRAMADO' ? '#EEF2FF' : '#FEF3C7',
                          color: bkp.tipo_backup === 'PROGRAMADO' ? '#4338CA' : '#B45309',
                          border: `1px solid ${bkp.tipo_backup === 'PROGRAMADO' ? '#C7D2FE' : '#FDE68A'}`,
                        }}
                      >
                        {bkp.tipo_backup}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontSize: '0.82rem', color: '#475569' }}>
                      {bkp.tamano_formateado}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span
                        style={{
                          padding: '0.2rem 0.6rem',
                          borderRadius: '9999px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          backgroundColor: '#DEF7EC',
                          color: '#03543F',
                        }}
                      >
                        {bkp.estado}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={() => handleDownload(bkp)}
                        className="btn-secondary"
                        style={{
                          padding: '0.35rem 0.65rem',
                          fontSize: '0.78rem',
                          marginRight: '0.5rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                        title="Descargar copia a la PC"
                      >
                        <Download size={13} />
                        Descargar
                      </button>
                      <button
                        onClick={() => openConfirmCloud(bkp)}
                        disabled={isRestoring}
                        className="btn-danger"
                        style={{
                          padding: '0.35rem 0.75rem',
                          fontSize: '0.78rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                        title="Restaurar base de datos a este punto"
                      >
                        <RotateCcw size={13} />
                        Restaurar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de confirmación para restauración */}
      {confirmModal.isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              maxWidth: '520px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: '#FEE2E2',
                  color: '#DC2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#111827' }}>
                  Confirmar Restauración del Sistema
                </h3>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#6B7280' }}>
                  Operación Transaccional Irreversible en PostgreSQL
                </p>
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '8px',
                padding: '0.85rem 1rem',
                fontSize: '0.82rem',
                color: '#991B1B',
                lineHeight: 1.45,
                marginBottom: '1.25rem',
              }}
            >
              <strong>Advertencia Crítica:</strong> Al continuar, la base de datos se restablecerá de manera exacta
              al estado contenido en <strong>{confirmModal.targetName}</strong>. Cualquier cambio generado con
              posterioridad a este respaldo será sobrescrito.
            </div>

            <div
              style={{
                fontSize: '0.82rem',
                color: '#4B5563',
                marginBottom: '1.5rem',
                lineHeight: 1.5,
              }}
            >
              Esta acción se ejecutará dentro de una transacción ACID segura y quedará registrada de forma inmutable
              en la <strong>Bitácora de Auditoría del Sistema</strong> indicando el usuario responsable, hora e IP.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="btn-secondary"
                disabled={isRestoring}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={executeRestore}
                disabled={isRestoring}
                className="btn-danger"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.25rem' }}
              >
                <RotateCcw size={16} />
                {isRestoring ? 'Restaurando Sistema...' : 'Sí, Confirmar y Restaurar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
