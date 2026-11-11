import React, { useEffect, useState } from 'react';
import { saasService } from '../services/saas.service';
import type { SaasBitacoraItem } from '../types/saas.types';
import { Clock, Search, Filter, RefreshCw } from 'lucide-react';
import './SaasBitacoraPage.css';

export const SaasBitacoraPage: React.FC = () => {
  const [items, setItems] = useState<SaasBitacoraItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchBitacora = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setIsRefreshing(true);

    try {
      const data = await saasService.getConsolidatedBitacora({
        tenantKey: selectedTenant !== 'ALL' ? selectedTenant : undefined,
        search: searchTerm || undefined,
        limit: 150,
      });
      setItems(data);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBitacora();
  }, [selectedTenant]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBitacora();
  };

  return (
    <div className="saas-bitacora-container">
      <div className="saas-bitacora-header">
        <div>
          <h1 className="bitacora-title">Bitácora Global de Auditoría de Tenants</h1>
          <p className="bitacora-subtitle">
            Registro unificado de trazabilidad, eventos de seguridad, inicios de sesión y modificaciones transaccionales en todas las bases de datos de la plataforma.
          </p>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bitacora-filters-bar">
        <form onSubmit={handleSearchSubmit} className="bitacora-search-form">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por acción, usuario o entidad afectada..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit" className="btn-search">
            Buscar
          </button>
        </form>

        <div className="bitacora-right-filters">
          <div className="tenant-select-wrapper">
            <Filter size={15} />
            <select
              value={selectedTenant}
              onChange={(e) => setSelectedTenant(e.target.value)}
              className="select-tenant-bitacora"
            >
              <option value="ALL">Todos los Tenants</option>
              <option value="dressly">Dressly Fashion Store</option>
              <option value="urbanly">Urbanly Fashion Store</option>
              <option value="aura-sport">Aura Athletics</option>
            </select>
          </div>

          <button
            type="button"
            className="btn-refresh-bitacora"
            onClick={() => fetchBitacora(true)}
            disabled={isRefreshing}
          >
            <RefreshCw size={15} className={isRefreshing ? 'spin' : ''} />
            <span>{isRefreshing ? 'Actualizando...' : 'Refrescar'}</span>
          </button>
        </div>
      </div>

      {/* Tabla de Bitácora */}
      <div className="bitacora-table-card">
        {loading && items.length === 0 ? (
          <div className="bitacora-loading">
            <div className="saas-spinner" />
            <span>Consultando eventos en las bases de datos dedicadas...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="bitacora-empty">
            <Clock size={36} color="#94A3B8" />
            <h3>No se encontraron registros de auditoría</h3>
            <p>Intenta cambiar los términos de búsqueda o el inquilino seleccionado.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="bitacora-table">
              <thead>
                <tr>
                  <th>Fecha & Hora (UTC)</th>
                  <th>Inquilino / Tienda</th>
                  <th>Acción Realizada</th>
                  <th>Entidad Afectada</th>
                  <th>Usuario Responsable</th>
                  <th>Dirección IP</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="col-date">
                      {new Date(item.fecha_hora).toLocaleString('es-BO', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td>
                      <span className="tenant-badge-cell">
                        {item.tenantName}
                      </span>
                    </td>
                    <td>
                      <span className="action-pill">{item.accion}</span>
                    </td>
                    <td className="col-entity">{item.entidad_afectada}</td>
                    <td className="col-user">
                      <span className="user-email-text">{item.usuario_email}</span>
                      <span className="user-id-sub">ID: #{item.usuario_id}</span>
                    </td>
                    <td className="col-ip">
                      <code>{item.ip || '127.0.0.1'}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
