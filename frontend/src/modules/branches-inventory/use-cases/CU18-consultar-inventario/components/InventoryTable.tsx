/**
 * @caso-de-uso CU15 — Consultar inventario
 * @subsistema Sucursales e Inventario
 * @capa Boundary — Frontend web
 * @responsabilidad Implementa una parte reutilizable de la interfaz de Frontend web y comunica eventos al controlador de presentación.
 * @secuencia Administrador o Encargado -> vista de inventario -> controlador de inventario -> servicio de existencias -> Inventario/Variante/Sucursal.
 */
import React from 'react';
import { Eye, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import type { InventoryItem } from '../types/inventory.types';

interface InventoryTableProps {
  items: InventoryItem[];
  loading: boolean;
  totalItems: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSelectItem: (item: InventoryItem) => void;
}

export const InventoryTable: React.FC<InventoryTableProps> = React.memo(({
  items,
  loading,
  totalItems,
  currentPage,
  totalPages,
  onPageChange,
  onSelectItem,
}) => {
  if (loading) {
    return (
      <div className="inventory-table-container">
        <div className="inv-table-loading">
          <div className="inv-spinner"></div>
          <p>Consultando existencias por sucursal...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="inventory-table-container">
        <div className="inv-table-empty">
          <PackageIcon size={44} />
          <h4>No se encontraron existencias</h4>
          <p>No existen variantes registradas con los filtros seleccionados en las sucursales autorizadas.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="inventory-table-container">
      <div className="inv-table-wrapper">
        <table className="inv-table">
          <thead>
            <tr>
              <th>Producto & SKU</th>
              <th>Sucursal</th>
              <th>Talla</th>
              <th>Color</th>
              <th className="text-right">Stock Disp.</th>
              <th className="text-right">Reservado</th>
              <th className="text-right">Físico Total</th>
              <th className="text-center">Estado</th>
              <th className="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const { variante, sucursal } = item;
              const isLow = item.estado_stock === 'bajo';
              const isOut = item.estado_stock === 'agotado';

              return (
                <tr key={item.id_inventario_sucursal} className={`inv-row ${isOut ? 'row-out' : isLow ? 'row-low' : ''}`}>
                  {/* Producto & SKU */}
                  <td>
                    <div className="inv-product-cell">
                      <div className="inv-product-thumb">
                        {variante.imagen_url ? (
                          <img src={variante.imagen_url} alt={variante.producto_nombre} />
                        ) : (
                          <div className="inv-thumb-placeholder">👗</div>
                        )}
                      </div>
                      <div className="inv-product-names">
                        <span className="inv-prod-title">{variante.producto_nombre}</span>
                        <span className="inv-sku-code">SKU: {variante.sku}</span>
                        <span className="inv-cat-badge">{variante.categoria}</span>
                      </div>
                    </div>
                  </td>

                  {/* Sucursal */}
                  <td>
                    <div className="inv-branch-cell">
                      <span className="inv-branch-name">{sucursal.nombre}</span>
                      <span className="inv-branch-city">{sucursal.ciudad}</span>
                    </div>
                  </td>

                  {/* Talla */}
                  <td>
                    <span className="inv-size-pill">{variante.talla}</span>
                  </td>

                  {/* Color */}
                  <td>
                    <div className="inv-color-cell">
                      {variante.color.codigo_hex && (
                        <span
                          className="inv-color-swatch"
                          style={{ backgroundColor: variante.color.codigo_hex }}
                        />
                      )}
                      <span>{variante.color.nombre}</span>
                    </div>
                  </td>

                  {/* Stock Disponible */}
                  <td className="text-right">
                    <span className={`inv-stock-number ${isOut ? 'zero' : isLow ? 'low' : 'ok'}`}>
                      {item.stock_disponible}
                    </span>
                    <span className="inv-min-hint">Mín: {item.stock_minimo}</span>
                  </td>

                  {/* Stock Reservado */}
                  <td className="text-right">
                    <span className={`inv-reserved-number ${item.stock_reservado > 0 ? 'active' : 'idle'}`}>
                      {item.stock_reservado}
                    </span>
                  </td>

                  {/* Físico Total */}
                  <td className="text-right">
                    <span className="inv-total-number">{item.stock_total}</span>
                  </td>

                  {/* Estado Badge */}
                  <td className="text-center">
                    {isOut ? (
                      <span className="inv-badge out">
                        <XCircle size={13} />
                        <span>Agotado</span>
                      </span>
                    ) : isLow ? (
                      <span className="inv-badge warning">
                        <AlertTriangle size={13} />
                        <span>Bajo stock</span>
                      </span>
                    ) : (
                      <span className="inv-badge ok">
                        <CheckCircle2 size={13} />
                        <span>Normal</span>
                      </span>
                    )}
                  </td>

                  {/* Acciones */}
                  <td className="text-center">
                    <button
                      type="button"
                      className="inv-action-view-btn"
                      onClick={() => onSelectItem(item)}
                      title="Ver detalle completo de existencias"
                    >
                      <Eye size={16} />
                      <span>Detalle</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="inv-pagination-bar">
        <div className="inv-pagination-info">
          Mostrando <strong>{items.length}</strong> de <strong>{totalItems}</strong> registros de existencias
        </div>
        <div className="inv-pagination-controls">
          <button
            type="button"
            className="inv-page-btn"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            <ChevronLeft size={16} />
            <span>Anterior</span>
          </button>
          <span className="inv-page-indicator">
            Página {currentPage} de {totalPages}
          </span>
          <button
            type="button"
            className="inv-page-btn"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            <span>Siguiente</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
});

function PackageIcon({ size }: { size: number }) {
  return <span style={{ fontSize: size }}>📦</span>;
}

InventoryTable.displayName = 'InventoryTable';
