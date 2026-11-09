/**
 * @caso-de-uso CU13 — Gestionar ciudades y sucursales
 * @subsistema Sucursales e Inventario
 * @capa Boundary — Frontend web
 * @responsabilidad Implementa una parte reutilizable de la interfaz de Frontend web y comunica eventos al controlador de presentación.
 * @secuencia Administrador -> vista de sucursales -> controlador geográfico -> servicio de sucursales -> Ciudad/Sucursal.
 */
import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  Store,
  ChevronLeft,
  ChevronRight,
  MapPin,
} from 'lucide-react';
import type { City, PaginationMeta } from '../../types/branchesAdmin.types';

interface CitiesTabProps {
  cities: City[];
  meta: PaginationMeta;
  loading: boolean;
  search: string;
  onSearchChange: (val: string) => void;
  onPageChange: (page: number) => void;
  onOpenCreateModal: () => void;
  onOpenEditModal: (city: City) => void;
  onDeleteCity: (city: City) => void;
}

export const CitiesTab: React.FC<CitiesTabProps> = ({
  cities,
  meta,
  loading,
  search,
  onSearchChange,
  onPageChange,
  onOpenCreateModal,
  onOpenEditModal,
  onDeleteCity,
}) => {
  const [cityToDelete, setCityToDelete] = useState<City | null>(null);

  const totalBranchesInCities = cities.reduce(
    (acc, curr) => acc + (curr.total_sucursales || 0),
    0,
  );

  return (
    <div className="cities-tab-content">
      {/* KPI Stats Bar */}
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card">
          <div className="kpi-icon-box purple">
            <Building2 size={22} />
          </div>
          <div className="kpi-data">
            <span className="kpi-label">Ciudades Registradas</span>
            <strong className="kpi-value">{meta.total}</strong>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-icon-box blue">
            <Store size={22} />
          </div>
          <div className="kpi-data">
            <span className="kpi-label">Sucursales Ubicadas</span>
            <strong className="kpi-value">{totalBranchesInCities}</strong>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="admin-table-toolbar">
        <div className="toolbar-search-filter">
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="admin-input search-field"
              placeholder="Buscar ciudad o país..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        <button
          type="button"
          className="admin-btn primary"
          onClick={onOpenCreateModal}
        >
          <Plus size={18} /> Nueva Ciudad
        </button>
      </div>

      {/* Table Section */}
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Ciudad</th>
              <th>País</th>
              <th>Sucursales Operando</th>
              <th>Direcciones de Clientes</th>
              <th className="actions-header">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="table-loading-cell">
                  <div className="spinner-border" />
                  <span>Cargando ciudades...</span>
                </td>
              </tr>
            ) : cities.length === 0 ? (
              <tr>
                <td colSpan={6} className="table-empty-cell">
                  <Building2 size={40} className="empty-icon" />
                  <h4>No se encontraron ciudades</h4>
                  <p>Intenta con otro término de búsqueda.</p>
                </td>
              </tr>
            ) : (
              cities.map((c) => {
                const hasBranches = (c.total_sucursales || 0) > 0;
                const hasAddresses = (c.total_direcciones || 0) > 0;
                const canDelete = !hasBranches && !hasAddresses;

                return (
                  <tr key={c.id_ciudad}>
                    <td>
                      <span className="cell-id-badge">#{c.id_ciudad}</span>
                    </td>
                    <td>
                      <div className="city-title-cell">
                        <Building2 size={16} />
                        <strong>{c.nombre}</strong>
                      </div>
                    </td>
                    <td>
                      <span className="country-badge">{c.pais}</span>
                    </td>
                    <td>
                      <span className={`count-badge ${hasBranches ? 'active' : 'zero'}`}>
                        <Store size={13} />
                        {c.total_sucursales || 0} sucursales
                      </span>
                    </td>
                    <td>
                      <span className="count-badge muted">
                        <MapPin size={13} />
                        {c.total_direcciones || 0} direcciones
                      </span>
                    </td>
                    <td className="cell-actions">
                      <div className="action-buttons-group">
                        <button
                          type="button"
                          className="icon-action-btn edit"
                          title="Editar ciudad"
                          onClick={() => onOpenEditModal(c)}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          type="button"
                          className={`icon-action-btn delete ${!canDelete ? 'disabled' : ''}`}
                          title={
                            canDelete
                              ? 'Eliminar ciudad'
                              : 'No se puede eliminar porque tiene sucursales o direcciones asociadas'
                          }
                          onClick={() => {
                            if (canDelete) {
                              setCityToDelete(c);
                            }
                          }}
                          disabled={!canDelete}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
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

      {/* Confirmation Modal for Delete City */}
      {cityToDelete && (
        <div className="admin-modal-overlay" onClick={() => setCityToDelete(null)}>
          <div
            className="admin-modal-container confirmation-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header danger">
              <div className="danger-icon-title">
                <AlertTriangle size={24} />
                <h3 className="admin-modal-title">Eliminar Ciudad</h3>
              </div>
            </div>

            <div className="admin-modal-body">
              <p className="confirm-text">
                ¿Estás seguro de que deseas eliminar permanentemente la ciudad <strong>"{cityToDelete.nombre}" ({cityToDelete.pais})</strong>?
              </p>
              <p className="recommendation">
                Esta acción no se puede deshacer. Se ha comprobado que no posee sucursales ni direcciones vinculadas.
              </p>
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn secondary"
                onClick={() => setCityToDelete(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="admin-btn danger"
                onClick={() => {
                  const target = cityToDelete;
                  setCityToDelete(null);
                  onDeleteCity(target);
                }}
              >
                <Trash2 size={16} /> Eliminar Permanentemente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
