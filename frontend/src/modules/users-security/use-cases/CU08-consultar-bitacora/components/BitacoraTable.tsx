import React from 'react';
import type { BitacoraItem } from '../services/bitacora.service';
import { ShieldAlert, Activity } from 'lucide-react';

interface BitacoraTableProps {
  logs: BitacoraItem[];
  loading: boolean;
}

export const BitacoraTable: React.FC<BitacoraTableProps> = ({ logs, loading }) => {
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const datePart = d.toLocaleDateString('es-BO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      const timePart = d.toLocaleTimeString('es-BO', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
      return { datePart, timePart };
    } catch {
      return { datePart: dateStr, timePart: '' };
    }
  };

  const getActionBadgeClass = (accion: string) => {
    const lower = accion.toLowerCase();
    if (lower.includes('inicio de sesion') || lower.includes('inicio de sesión') || lower.includes('login')) return 'action-login';
    if (lower.includes('cierre de sesion') || lower.includes('cierre') || lower.includes('cerrar') || lower.includes('logout')) return 'action-logout';
    if (lower.includes('creó') || lower.includes('creo') || lower.includes('creación') || lower.includes('creacion')) return 'action-create';
    if (lower.includes('modificó') || lower.includes('modifico') || lower.includes('modificación') || lower.includes('modificacion') || lower.includes('actualiz') || lower.includes('cambio')) return 'action-edit';
    if (lower.includes('eliminó') || lower.includes('elimino') || lower.includes('eliminación') || lower.includes('eliminacion')) return 'action-delete';
    if (lower.includes('consultó') || lower.includes('consulto') || lower.includes('consulta')) return 'action-query';
    return 'action-default';
  };

  if (loading) {
    return (
      <div className="bitacora-table-wrapper">
        <div className="bitacora-loading">
          <Activity size={32} style={{ animation: 'spin 1.5s linear infinite', margin: '0 auto 1rem auto', display: 'block' }} />
          <span>Consultando registros de la bitácora...</span>
        </div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="bitacora-table-wrapper">
        <div className="bitacora-empty">
          <ShieldAlert size={40} style={{ margin: '0 auto 0.75rem auto', color: '#999' }} />
          <h3>No se encontraron registros</h3>
          <p>No hay eventos registrados en la bitácora que coincidan con tu búsqueda.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bitacora-table-wrapper">
      <table className="bitacora-table">
        <thead>
          <tr>
            <th style={{ width: '80px' }}>ID</th>
            <th style={{ width: '180px' }}>Fecha y Hora</th>
            <th>Usuario Responsable</th>
            <th>Acción Registrada</th>
            <th>Entidad Afectada</th>
            <th style={{ width: '130px' }}>Dirección IP</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => {
            const { datePart, timePart } = formatDate(log.fecha_hora);
            const userInitial = log.usuario?.nombre ? log.usuario.nombre.charAt(0).toUpperCase() : 'U';

            return (
              <tr key={log.id_bitacora}>
                <td>
                  <span className="log-id">#{log.id_bitacora}</span>
                </td>
                <td>
                  <div className="log-time">
                    <span className="log-date">{datePart}</span>
                    <span className="log-hour">{timePart}</span>
                  </div>
                </td>
                <td>
                  <div className="user-cell">
                    <div className="user-avatar-badge">{userInitial}</div>
                    <div className="user-info">
                      <span className="user-name">{log.usuario?.nombre || 'Usuario'}</span>
                      <span className="user-email">{log.usuario?.email} ({log.usuario?.rol})</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`action-badge ${getActionBadgeClass(log.accion)}`}>
                    {log.accion}
                  </span>
                </td>
                <td>
                  <span className="entity-badge">{log.entidad_afectada}</span>
                </td>
                <td>
                  <span className="ip-badge">{log.ip || '—'}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
