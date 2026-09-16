import React from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Eye,
  Info,
  RefreshCw,
} from 'lucide-react';
import type {
  MovementItem,
  MovementPaginationMeta,
} from '../types/movements.types';

interface MovementsTableProps {
  items: MovementItem[];
  pagination: MovementPaginationMeta;
  loading: boolean;
  onPageChange: (newPage: number) => void;
  onSelectDetail: (item: MovementItem) => void;
}

export const MovementsTable: React.FC<MovementsTableProps> = ({
  items,
  pagination,
  loading,
  onPageChange,
  onSelectDetail,
}) => {
  const getBadgeClass = (tipo: string) => {
    const t = tipo.toLowerCase();
    if (t === 'entrada') return 'badge-type-entrada';
    if (t === 'salida' || t === 'salida_venta') return 'badge-type-salida';
    if (t === 'ajuste') return 'badge-type-ajuste';
    if (t === 'devolucion') return 'badge-type-devolucion';
    if (t === 'reserva') return 'badge-type-reserva';
    return 'badge-type-default';
  };

  const getTipoLabel = (tipo: string) => {
    const t = tipo.toLowerCase();
    if (t === 'entrada') return 'Entrada';
    if (t === 'salida') return 'Salida';
    if (t === 'salida_venta') return 'Venta';
    if (t === 'ajuste') return 'Ajuste';
    if (t === 'devolucion') return 'Devolución';
    if (t === 'reserva') return 'Reserva';
    return tipo;
  };

  const formatFecha = (iso: string) => {
    try {
      const d = new Date(iso);
      return new Intl.DateTimeFormat('es-BO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    } catch {
      return iso;
    }
  };

  return (
    <div className="movements-table-container">
      <div className="table-responsive">
        <table className="movements-table">
          <thead>
            <tr>
              <th>Fecha y Hora</th>
              <th>Tipo</th>
              <th>Prenda y Variante</th>
              <th style={{ textAlign: 'center' }}>Cantidad</th>
              <th>Sucursal</th>
              <th>Responsable</th>
              <th>Motivo</th>
              <th style={{ textAlign: 'center' }}>Detalle</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="table-state-cell">
                  <div className="spinner-loader" />
                  <span>Cargando historial de movimientos...</span>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={8} className="table-state-cell empty-cell">
                  <Info size={32} />
                  <span>No se encontraron movimientos registrados con los filtros aplicados.</span>
                </td>
              </tr>
            ) : (
              items.map((m) => {
                const isPositive =
                  m.tipo_movimiento === 'entrada' || m.tipo_movimiento === 'devolucion';
                const isNegative =
                  m.tipo_movimiento === 'salida' || m.tipo_movimiento === 'salida_venta';

                return (
                  <tr key={m.id_movimiento} className="movement-row">
                    {/* Fecha */}
                    <td className="cell-fecha">{formatFecha(m.fecha)}</td>

                    {/* Badge de tipo */}
                    <td>
                      <span className={`movement-type-badge ${getBadgeClass(m.tipo_movimiento)}`}>
                        {isPositive && <ArrowDownLeft size={13} />}
                        {isNegative && <ArrowUpRight size={13} />}
                        {!isPositive && !isNegative && <RefreshCw size={12} />}
                        {getTipoLabel(m.tipo_movimiento)}
                      </span>
                    </td>

                    {/* Prenda & Variante */}
                    <td>
                      <div className="product-variant-cell">
                        <span className="product-name">{m.producto.nombre}</span>
                        <div className="variant-details">
                          <span className="sku-tag">{m.variante.sku}</span>
                          <span className="spec-tag">Talla: {m.variante.talla}</span>
                          <span className="spec-tag color-tag">
                            {m.variante.color_hex && (
                              <span
                                className="color-swatch"
                                style={{ backgroundColor: m.variante.color_hex }}
                              />
                            )}
                            {m.variante.color}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Cantidad */}
                    <td style={{ textAlign: 'center' }}>
                      <span
                        className={`qty-badge ${
                          isPositive
                            ? 'qty-positive'
                            : isNegative
                            ? 'qty-negative'
                            : 'qty-neutral'
                        }`}
                      >
                        {isPositive ? `+${m.cantidad}` : isNegative ? `-${m.cantidad}` : m.cantidad}
                      </span>
                    </td>

                    {/* Sucursal */}
                    <td>
                      <div className="branch-cell">
                        <span className="branch-name">{m.sucursal.nombre}</span>
                        {m.sucursal.ciudad && (
                          <span className="branch-city">{m.sucursal.ciudad}</span>
                        )}
                      </div>
                    </td>

                    {/* Responsable */}
                    <td>
                      <div className="employee-cell">
                        <span className="employee-name">{m.responsable.nombre_completo}</span>
                        <span className="employee-code">{m.responsable.codigo}</span>
                      </div>
                    </td>

                    {/* Motivo */}
                    <td className="cell-motivo" title={m.motivo}>
                      {m.motivo}
                    </td>

                    {/* Acción Ver Detalle */}
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => onSelectDetail(m)}
                        className="btn-action-view"
                        title="Ver detalle del movimiento"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {pagination.totalPages > 1 && (
        <div className="table-pagination">
          <span className="pagination-info">
            Mostrando página {pagination.page} de {pagination.totalPages} (Total:{' '}
            {pagination.total} registros)
          </span>

          <div className="pagination-controls">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange(pagination.page - 1)}
              className="pagination-btn"
            >
              <ChevronLeft size={16} />
              <span>Anterior</span>
            </button>

            <span className="pagination-current-page">{pagination.page}</span>

            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange(pagination.page + 1)}
              className="pagination-btn"
            >
              <span>Siguiente</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
