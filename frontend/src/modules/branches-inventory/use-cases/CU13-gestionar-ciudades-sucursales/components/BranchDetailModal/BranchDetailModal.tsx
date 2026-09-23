/**
 * @caso-de-uso CU13 — Gestionar ciudades y sucursales
 * @subsistema Sucursales e Inventario
 * @capa Boundary — Frontend web
 * @responsabilidad Implementa una parte reutilizable de la interfaz de Frontend web y comunica eventos al controlador de presentación.
 * @secuencia Administrador -> vista de sucursales -> controlador geográfico -> servicio de sucursales -> Ciudad/Sucursal.
 */
import React from 'react';
import {
  X,
  MapPin,
  Phone,
  Clock,
  Building2,
  Users,
  Box,
  ArrowUpDown,
  FileCheck,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import type { BranchDetail } from '../../types/branchesAdmin.types';

interface BranchDetailModalProps {
  isOpen: boolean;
  branch: BranchDetail | null;
  loading: boolean;
  onClose: () => void;
}

export const BranchDetailModal: React.FC<BranchDetailModalProps> = ({
  isOpen,
  branch,
  loading,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div
        className="admin-modal-container branch-detail-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-modal-header">
          <div className="branch-detail-title-group">
            <span className="branch-id-badge">ID #{branch?.id_sucursal}</span>
            <h2 className="admin-modal-title">{branch?.nombre || 'Cargando detalle...'}</h2>
            {branch && (
              <span className={`status-pill ${branch.estado}`}>
                {branch.estado === 'activo' ? 'Operativa' : 'Inactiva'}
              </span>
            )}
          </div>
          <button type="button" className="admin-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="admin-modal-body">
          {loading || !branch ? (
            <div className="modal-loading-state">
              <div className="spinner-border" />
              <p>Cargando información completa de la sucursal...</p>
            </div>
          ) : (
            <>
              {/* Bloque Info Principal */}
              <div className="branch-detail-info-grid">
                <div className="info-card">
                  <div className="info-icon">
                    <Building2 size={18} />
                  </div>
                  <div className="info-content">
                    <label>Ciudad</label>
                    <p>{branch.ciudad?.nombre}, {branch.ciudad?.pais}</p>
                  </div>
                </div>

                <div className="info-card">
                  <div className="info-icon">
                    <MapPin size={18} />
                  </div>
                  <div className="info-content">
                    <label>Dirección</label>
                    <p>{branch.direccion}</p>
                  </div>
                </div>

                <div className="info-card">
                  <div className="info-icon">
                    <Phone size={18} />
                  </div>
                  <div className="info-content">
                    <label>Teléfono</label>
                    <p>{branch.telefono || 'Sin teléfono registrado'}</p>
                  </div>
                </div>

                <div className="info-card">
                  <div className="info-icon">
                    <Clock size={18} />
                  </div>
                  <div className="info-content">
                    <label>Horario de Atención</label>
                    <p>
                      {branch.hora_apertura && branch.hora_cierre
                        ? `${branch.hora_apertura} — ${branch.hora_cierre}`
                        : 'Horario no definido'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Métricas / Resumen Histórico */}
              <div className="branch-metrics-section">
                <h4 className="section-subtitle">Métricas e Historial Operativo</h4>
                <div className="metrics-cards-grid">
                  <div className="metric-badge-box">
                    <Box size={16} />
                    <span className="metric-val">{branch.metricas?.variantes_inventario ?? 0}</span>
                    <span className="metric-lbl">Variantes en Stock</span>
                  </div>

                  <div className="metric-badge-box">
                    <ArrowUpDown size={16} />
                    <span className="metric-val">{branch.metricas?.movimientos_registrados ?? 0}</span>
                    <span className="metric-lbl">Movimientos de Inventario</span>
                  </div>

                  <div className="metric-badge-box">
                    <FileCheck size={16} />
                    <span className="metric-val">{branch.metricas?.ordenes_compra ?? 0}</span>
                    <span className="metric-lbl">Órdenes de Compra</span>
                  </div>

                  <div className="metric-badge-box">
                    <Calendar size={16} />
                    <span className="metric-val">{branch.metricas?.reservas_recibidas ?? 0}</span>
                    <span className="metric-lbl">Reservas Procesadas</span>
                  </div>
                </div>

                {branch.tiene_historial && (
                  <div className="history-lock-notice">
                    <AlertTriangle size={16} />
                    <span>
                      Esta sucursal posee historial operativo registrado. Siguiendo las reglas del sistema, no podrá eliminarse físicamente para garantizar la trazabilidad contable.
                    </span>
                  </div>
                )}
              </div>

              {/* Personal Asignado */}
              <div className="branch-employees-section">
                <div className="section-header-row">
                  <div className="section-title-with-icon">
                    <Users size={18} />
                    <h4 className="section-subtitle">Personal Asignado ({branch.empleados?.length || 0})</h4>
                  </div>
                </div>

                {branch.empleados && branch.empleados.length > 0 ? (
                  <div className="employees-table-wrapper">
                    <table className="admin-mini-table">
                      <thead>
                        <tr>
                          <th>Empleado</th>
                          <th>Código</th>
                          <th>Cargo / Rol</th>
                          <th>CI</th>
                          <th>Email</th>
                        </tr>
                      </thead>
                      <tbody>
                        {branch.empleados.map((emp) => (
                          <tr key={emp.id_empleado}>
                            <td className="emp-name-cell">
                              <strong>{emp.nombre}</strong>
                            </td>
                            <td>
                              <code>{emp.codigo_empleado || `#${emp.id_empleado}`}</code>
                            </td>
                            <td>
                              <span className="role-tag">{emp.cargo || emp.rol}</span>
                            </td>
                            <td>{emp.ci}</td>
                            <td className="emp-email-cell">{emp.email || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-sub-state">
                    <p>No hay colaboradores asignados directamente a esta sucursal.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="admin-modal-footer">
          <button type="button" className="admin-btn secondary" onClick={onClose}>
            Cerrar Detalle
          </button>
        </div>
      </div>
    </div>
  );
};
