import React, { useState } from 'react';
import { Database, Download, RotateCcw, Plus, CheckCircle, Shield } from 'lucide-react';
import '../../CU07-gestionar-empresas/pages/SettingsPages.css';

interface BackupItem {
  id: string;
  nombre_archivo: string;
  tamano: string;
  tipo: string;
  fecha: string;
  estado: string;
}

export const BackupsSettingsTab: React.FC = () => {
  const [backups, setBackups] = useState<BackupItem[]>([
    {
      id: 'bkp-20261108-01',
      nombre_archivo: 'tenant_dressly_backup_20261108_020000.sql.gz',
      tamano: '4.66 MB',
      tipo: 'PROGRAMADO',
      fecha: '2026-11-08 02:00:00',
      estado: 'COMPLETADO',
    },
    {
      id: 'bkp-20261107-01',
      nombre_archivo: 'tenant_dressly_backup_20261107_020000.sql.gz',
      tamano: '4.62 MB',
      tipo: 'PROGRAMADO',
      fecha: '2026-11-07 02:00:00',
      estado: 'COMPLETADO',
    },
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const handleCreateBackup = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const now = new Date();
      const newBkp: BackupItem = {
        id: `bkp-manual-${now.getTime()}`,
        nombre_archivo: `tenant_dressly_manual_${now.toISOString().slice(0, 10)}.sql.gz`,
        tamano: '4.82 MB',
        tipo: 'BAJO DEMANDA',
        fecha: now.toLocaleString(),
        estado: 'COMPLETADO',
      };
      setBackups([newBkp, ...backups]);
      setIsGenerating(false);
      setNotification('Copia de seguridad bajo demanda generada y resguardada exitosamente.');
      setTimeout(() => setNotification(null), 4000);
    }, 1200);
  };

  const handleRestore = (bkp: BackupItem) => {
    if (window.confirm(`¿Confirmar restauración al punto de respaldo del ${bkp.fecha}? Esta acción sobrescribirá datos actuales del tenant de forma atómica.`)) {
      setNotification(`Restauración completada con éxito desde ${bkp.nombre_archivo}.`);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  return (
    <div className="settings-card">
      {/* Header */}
      <div className="settings-header">
        <div className="settings-header-info">
          <div className="settings-header-icon">
            <Database size={24} />
          </div>
          <div>
            <div className="settings-title-row">
              <h2 className="settings-title">Gestión de Backups y Restauración</h2>
              <span className="settings-status-badge">Operacional</span>
            </div>
            <p className="settings-subtitle">
              Respaldos lógicos de datos, compresión y recuperación de snapshots
            </p>
          </div>
        </div>

        <button
          onClick={handleCreateBackup}
          disabled={isGenerating}
          className="btn-primary"
        >
          <Plus size={16} />
          {isGenerating ? 'Generando Respaldo...' : 'Generar Backup Bajo Demanda'}
        </button>
      </div>

      {notification && (
        <div className="settings-alert settings-alert-success">
          <CheckCircle size={18} />
          <div>{notification}</div>
        </div>
      )}

      {/* Tarjeta de Infraestructura de Almacenamiento */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.25rem',
          backgroundColor: '#EFF6FF',
          border: '1px solid #BFDBFE',
          borderRadius: '10px',
          marginBottom: '1.5rem',
          color: '#1E3A8A',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Shield size={22} style={{ color: '#2563EB' }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>
              Almacenamiento Seguro de Respaldos
            </div>
            <div style={{ fontSize: '0.8rem', color: '#3B82F6' }}>
              Contenedor privado con retención rotativa de 30 días, cifrado y hash de integridad SHA-256.
            </div>
          </div>
        </div>
        <span
          style={{
            padding: '0.25rem 0.65rem',
            borderRadius: '6px',
            backgroundColor: '#DBEAFE',
            color: '#1E40AF',
            fontSize: '0.75rem',
            fontWeight: 700,
          }}
        >
          Conectado
        </span>
      </div>

      {/* Tabla de Historial */}
      <div style={{ overflowX: 'auto' }}>
        <table className="backups-table">
          <thead>
            <tr>
              <th>Archivo / Identificador</th>
              <th>Fecha y Hora</th>
              <th>Tipo</th>
              <th>Tamaño</th>
              <th>Estado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {backups.map((bkp) => (
              <tr key={bkp.id}>
                <td style={{ fontFamily: 'monospace', fontSize: '0.82rem', fontWeight: 600 }}>
                  {bkp.nombre_archivo}
                </td>
                <td style={{ color: '#554E48', fontSize: '0.88rem' }}>{bkp.fecha}</td>
                <td>
                  <span
                    style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: '5px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backgroundColor: bkp.tipo === 'PROGRAMADO' ? '#EEF2FF' : '#FEF3C7',
                      color: bkp.tipo === 'PROGRAMADO' ? '#4338CA' : '#B45309',
                      border: `1px solid ${bkp.tipo === 'PROGRAMADO' ? '#C7D2FE' : '#FDE68A'}`,
                    }}
                  >
                    {bkp.tipo}
                  </span>
                </td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#554E48' }}>
                  {bkp.tamano}
                </td>
                <td>
                  <span
                    style={{
                      padding: '0.2rem 0.55rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      backgroundColor: '#DEF7EC',
                      color: '#03543F',
                    }}
                  >
                    {bkp.estado}
                  </span>
                </td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button
                    onClick={() => alert(`Descargando backup: ${bkp.nombre_archivo}`)}
                    className="btn-secondary"
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', marginRight: '0.5rem' }}
                    title="Descargar respaldo"
                  >
                    <Download size={14} />
                    Descargar
                  </button>
                  <button
                    onClick={() => handleRestore(bkp)}
                    className="btn-danger"
                    title="Restaurar a este punto"
                  >
                    <RotateCcw size={14} />
                    Restaurar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
