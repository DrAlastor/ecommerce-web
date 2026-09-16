import React from 'react';
import type { BranchStock } from '../../types/product-detail.types';
import { Store, MapPin, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface BranchAvailabilityProps {
  sucursales: BranchStock[];
  selectedTalla?: string;
  selectedColor?: string;
}

export const BranchAvailability: React.FC<BranchAvailabilityProps> = ({
  sucursales,
  selectedTalla,
  selectedColor,
}) => {
  if (!sucursales || sucursales.length === 0) {
    return (
      <div className="branch-availability-empty">
        <Store size={28} />
        <p>No se encontró información de inventario en sucursales físicas para esta combinación.</p>
      </div>
    );
  }

  // Agrupar por ciudad
  const groupedByCity = sucursales.reduce<Record<string, BranchStock[]>>((acc, curr) => {
    const city = curr.ciudad || 'Otras ciudades';
    if (!acc[city]) acc[city] = [];
    acc[city].push(curr);
    return acc;
  }, {});

  return (
    <div className="branch-availability-wrapper">
      <div className="availability-header">
        <div className="availability-title-group">
          <Store size={18} />
          <h3>Disponibilidad en Tiendas Físicas</h3>
        </div>
        {selectedTalla && selectedColor && (
          <span className="availability-variant-badge">
            Variante: <strong>{selectedColor}</strong> / Talla <strong>{selectedTalla}</strong>
          </span>
        )}
      </div>

      <p className="availability-caption">
        Consulta el stock en tiempo real en nuestras sucursales para compra presencial o retiro inmediato.
      </p>

      <div className="branch-cities-list">
        {Object.entries(groupedByCity).map(([city, branches]) => (
          <div key={city} className="city-branches-group">
            <h4 className="city-title">{city}</h4>
            <div className="branch-items-grid">
              {branches.map((b) => {
                const isAvailable = b.stock_disponible > 0;
                const isLowStock = b.stock_disponible > 0 && b.stock_disponible <= 3;

                return (
                  <div
                    key={b.id_sucursal}
                    className={`branch-stock-card ${isAvailable ? 'available' : 'unavailable'}`}
                  >
                    <div className="branch-info-col">
                      <strong className="branch-name">{b.nombre}</strong>
                      <span className="branch-address">
                        <MapPin size={13} /> {b.direccion}
                      </span>
                    </div>

                    <div className="branch-status-col">
                      {isAvailable ? (
                        isLowStock ? (
                          <span className="status-pill low-stock">
                            <AlertTriangle size={13} />
                            <span>Últimas {b.stock_disponible} u.</span>
                          </span>
                        ) : (
                          <span className="status-pill in-stock">
                            <CheckCircle2 size={13} />
                            <span>Disponible ({b.stock_disponible} u.)</span>
                          </span>
                        )
                      ) : (
                        <span className="status-pill no-stock">
                          <XCircle size={13} />
                          <span>Agotado</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
