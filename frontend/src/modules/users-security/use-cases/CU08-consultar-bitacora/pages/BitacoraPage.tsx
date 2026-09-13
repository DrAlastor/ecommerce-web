import React, { useEffect, useState, useCallback } from 'react';
import { 
  bitacoraService, 
  type BitacoraItem, 
  type BitacoraParams 
} from '../services/bitacora.service';
import { Search, RefreshCw, ShieldAlert, Activity } from 'lucide-react';
import './BitacoraPage.css';

export const BitacoraPage: React.FC = () => {
  const [logs, setLogs] = useState<BitacoraItem[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useState<BitacoraParams>({ page: 1, limit: 15 });
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await bitacoraService.getLogs(params);
      setLogs(response.data);
      setMeta(response.meta);
    } catch (error) {
      console.error('Error al cargar la bitácora:', error);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setParams(prev => ({ ...prev, search: searchTerm.trim() || undefined, page: 1 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const datePart = d.toLocaleDateString('es-BO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      const timePart = d.toLocaleTimeString('es-BO', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
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

  return (
    <div className="bitacora-page">
      <div className="bitacora-header">
        <div className="bitacora-header-title">
          <h1>Bitácora de Auditoría y Seguridad</h1>
          <p>Supervisa de manera centralizada todos los accesos, cambios de datos y eventos del sistema.</p>
        </div>
        <button 
          className="btn-refresh" 
          onClick={fetchLogs} 
          disabled={loading}
          title="Recargar eventos"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span>Actualizar</span>
        </button>
      </div>

      <div className="bitacora-stats">
        <div className="stat-card">
          <span className="stat-label">Total Registros</span>
          <span className="stat-value">{meta.total}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Eventos en Página</span>
          <span className="stat-value">{logs.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Página Actual</span>
          <span className="stat-value">{meta.page} / {meta.totalPages}</span>
        </div>
      </div>

      <div className="bitacora-toolbar">
        <div className="bitacora-search-box">
          <Search size={18} className="bitacora-search-icon" />
          <input
            type="text"
            className="bitacora-search-input"
            placeholder="Buscar por acción, usuario, entidad o IP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="bitacora-table-wrapper">
          <div className="bitacora-loading">
            <Activity size={32} style={{ animation: 'spin 1.5s linear infinite', margin: '0 auto 1rem auto', display: 'block' }} />
            <span>Consultando registros de la bitácora...</span>
          </div>
        </div>
      ) : logs.length === 0 ? (
        <div className="bitacora-table-wrapper">
          <div className="bitacora-empty">
            <ShieldAlert size={40} style={{ margin: '0 auto 0.75rem auto', color: '#999' }} />
            <h3>No se encontraron registros</h3>
            <p>No hay eventos registrados en la bitácora que coincidan con tu búsqueda.</p>
          </div>
        </div>
      ) : (
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
      )}

      {/* Pagination Bar */}
      <div className="pagination-bar">
        <span>Mostrando {logs.length} de {meta.total} eventos registrados</span>
        <div className="pagination-buttons">
          <button
            disabled={params.page === 1 || loading}
            onClick={() => setParams(prev => ({ ...prev, page: (prev.page || 1) - 1 }))}
          >
            ← Anterior
          </button>
          <span style={{ display: 'flex', alignItems: 'center', padding: '0 0.5rem', fontWeight: 500 }}>
            {meta.page} de {meta.totalPages}
          </span>
          <button
            disabled={params.page === meta.totalPages || loading}
            onClick={() => setParams(prev => ({ ...prev, page: (prev.page || 1) + 1 }))}
          >
            Siguiente →
          </button>
        </div>
      </div>
    </div>
  );
};
