import React, { useState } from 'react';
import {
  Building2,
  Store,
  MapPin,
  Phone,
  Clock,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Power,
} from 'lucide-react';
import type { Branch, City, PaginationMeta } from '../../types/branchesAdmin.types';

interface BranchesTabProps {
  branches: Branch[];
  cities: City[];
  meta: PaginationMeta;
  loading: boolean;
  search: string;
  selectedCityId: number;
  selectedStatus: string;
  onSearchChange: (val: string) => void;
  onCityFilterChange: (id: number) => void;
  onStatusFilterChange: (st: string) => void;
  onPageChange: (page: number) => void;
  onOpenCreateModal: () => void;
  onOpenEditModal: (branch: Branch) => void;
  onOpenDetailModal: (branch: Branch) => void;
  onToggleStatus: (branch: Branch) => void;
  onDeleteBranch: (branch: Branch, forceDeactivate?: boolean) => void;
}

export const BranchesTab: React.FC<BranchesTabProps> = ({
  branches,
  cities,
  meta,
  loading,
  search,
  selectedCityId,
  selectedStatus,
  onSearchChange,
  onCityFilterChange,
  onStatusFilterChange,
  onPageChange,
  onOpenCreateModal,
  onOpenEditModal,
  onOpenDetailModal,
  onToggleStatus,
  onDeleteBranch,
}) => {
  const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null);

  const activeCount = branches.filter((b) => b.estado === 'activo').length;
  const inactiveCount = branches.filter((b) => b.estado === 'inactivo').length;

  return (
    <div className="branches-tab-content">
      {/* KPI Stats Bar */}
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card">
          <div className="kpi-icon-box blue">
            <Store size={22} />
          </div>
          <div className="kpi-data">
            <span className="kpi-label">Total Sucursales</span>
            <strong className="kpi-value">{meta.total}</strong>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-icon-box green">
            <CheckCircle2 size={22} />
          </div>
          <div className="kpi-data">
            <span className="kpi-label">Operativas / Activas</span>
            <strong className="kpi-value">{activeCount}</strong>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-icon-box red">
            <XCircle size={22} />
          </div>
          <div className="kpi-data">
            <span className="kpi-label">Inactivas / Suspendidas</span>
            <strong className="kpi-value">{inactiveCount}</strong>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-icon-box purple">
            <Building2 size={22} />
          </div>
          <div className="kpi-data">
            <span className="kpi-label">Ciudades Disponibles</span>
            <strong className="kpi-value">{cities.length}</strong>
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="admin-table-toolbar">
        <div className="toolbar-search-filter">
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="admin-input search-field"
              placeholder="Buscar por nombre, dirección, teléfono o ciudad..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          <div className="filter-dropdown-wrapper">
            <Filter size={16} />
            <select
              className="admin-select filter-select"
              value={selectedCityId}
              onChange={(e) => onCityFilterChange(Number(e.target.value))}
            >
              <option value={0}>Todas las Ciudades</option>
              {cities.map((c) => (
                <option key={c.id_ciudad} value={c.id_ciudad}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-dropdown-wrapper">
            <select
              className="admin-select filter-select"
              value={selectedStatus}
              onChange={(e) => onStatusFilterChange(e.target.value)}
            >
              <option value="todos">Todos los Estados</option>
              <option value="activo">Solo Activas</option>
              <option value="inactivo">Solo Inactivas</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          className="admin-btn primary add-branch-btn"
          onClick={onOpenCreateModal}
        >
          <Plus size={18} /> Nueva Sucursal
        </button>
      </div>

      {/* Table Section */}
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Sucursal</th>
              <th>Ciudad</th>
              <th>Dirección</th>
              <th>Teléfono</th>
              <th>Horario</th>
              <th>Estado</th>
              <th className="actions-header">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="table-loading-cell">
                  <div className="spinner-border" />
                  <span>Cargando sucursales de FashionStore...</span>
                </td>
              </tr>
            ) : branches.length === 0 ? (
              <tr>
                <td colSpan={8} className="table-empty-cell">
                  <Store size={40} className="empty-icon" />
                  <h4>No se encontraron sucursales</h4>
                  <p>Intenta ajustar los términos de búsqueda o los filtros aplicados.</p>
                </td>
              </tr>
            ) : (
              branches.map((b) => (
                <tr key={b.id_sucursal} className={`branch-row ${b.estado}`}>
                  <td>
                    <span className="cell-id-badge">#{b.id_sucursal}</span>
                  </td>
                  <td>
                    <div className="branch-title-cell">
                      <strong>{b.nombre}</strong>
                      {b.tiene_historial && (
                        <span className="history-tag" title="Posee historial operativo en el sistema">
                          <ShieldCheck size={12} /> Con Historial
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="city-pill">
                      <Building2 size={13} />
                      {b.ciudad?.nombre}
                    </span>
                  </td>
                  <td className="cell-address">
                    <span title={b.direccion}>
                      <MapPin size={13} /> {b.direccion}
                    </span>
                  </td>
                  <td className="cell-phone">
                    {b.telefono ? (
                      <span>
                        <Phone size={13} /> {b.telefono}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="cell-schedule">
                    {b.hora_apertura && b.hora_cierre ? (
                      <span className="schedule-badge">
                        <Clock size={13} /> {b.hora_apertura} - {b.hora_cierre}
                      </span>
                    ) : (
                      <span className="text-muted">No especificado</span>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className={`status-toggle-btn ${b.estado}`}
                      onClick={() => onToggleStatus(b)}
                      title={`Haz clic para cambiar estado a ${b.estado === 'activo' ? 'inactivo' : 'activo'}`}
                    >
                      <Power size={12} />
                      {b.estado === 'activo' ? 'Activa' : 'Inactiva'}
                    </button>
                  </td>
                  <td className="cell-actions">
                    <div className="action-buttons-group">
                      <button
                        type="button"
                        className="icon-action-btn view"
                        title="Ver detalle completo de sucursal"
                        onClick={() => onOpenDetailModal(b)}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        type="button"
                        className="icon-action-btn edit"
                        title="Editar sucursal"
                        onClick={() => onOpenEditModal(b)}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        className="icon-action-btn delete"
                        title="Eliminar o desactivar sucursal"
                        onClick={() => setBranchToDelete(b)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {meta.totalPages > 1 && (
        <div className="admin-pagination-bar">
          <span className="pagination-info">
            Página <strong>{meta.page}</strong> de <strong>{meta.totalPages}</strong> ({meta.total} registros)
          </span>
          <div className="pagination-nav-buttons">
            <button
              type="button"
              className="admin-btn secondary sm"
              disabled={meta.page <= 1}
              onClick={() => onPageChange(meta.page - 1)}
            >
              <ChevronLeft size={16} /> Anterior
            </button>
            <button
              type="button"
              className="admin-btn secondary sm"
              disabled={meta.page >= meta.totalPages}
              onClick={() => onPageChange(meta.page + 1)}
            >
              Siguiente <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Delete/Deactivate */}
      {branchToDelete && (
        <div className="admin-modal-overlay" onClick={() => setBranchToDelete(null)}>
          <div
            className="admin-modal-container confirmation-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header danger">
              <div className="danger-icon-title">
                <AlertTriangle size={24} />
                <h3 className="admin-modal-title">Gestión de Retiro de Sucursal</h3>
              </div>
            </div>

            <div className="admin-modal-body">
              <p className="confirm-text">
                Estás procesando el retiro de la sucursal <strong>"{branchToDelete.nombre}"</strong> situada en <strong>{branchToDelete.ciudad?.nombre}</strong>.
              </p>

              {branchToDelete.tiene_historial ? (
                <div className="history-alert-box">
                  <ShieldCheck size={20} />
                  <div>
                    <strong>Regla de Negocio (CU08):</strong>
                    <p>
                      Esta sucursal registra operaciones comerciales e inventario previo. Por tanto, <strong>no debe eliminarse físicamente</strong> para conservar la trazabilidad y la integridad de la base de datos.
                    </p>
                    <p className="recommendation">
                      En su lugar, el sistema la desactivará para que no esté disponible en ventas nuevas ni recepciones, pero manteniendo todo su historial.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="history-alert-box normal">
                  <p>
                    Esta sucursal no registra historial de ventas ni movimientos. Puede eliminarse permanentemente de la base de datos.
                  </p>
                </div>
              )}
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn secondary"
                onClick={() => setBranchToDelete(null)}
              >
                Cancelar
              </button>

              {branchToDelete.tiene_historial ? (
                <button
                  type="button"
                  className="admin-btn warning"
                  onClick={() => {
                    const target = branchToDelete;
                    setBranchToDelete(null);
                    onDeleteBranch(target, true);
                  }}
                >
                  <Power size={16} /> Desactivar Sucursal (Recomendado)
                </button>
              ) : (
                <button
                  type="button"
                  className="admin-btn danger"
                  onClick={() => {
                    const target = branchToDelete;
                    setBranchToDelete(null);
                    onDeleteBranch(target, false);
                  }}
                >
                  <Trash2 size={16} /> Eliminar Permanentemente
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
