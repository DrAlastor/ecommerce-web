import React from 'react';
import { CalendarClock, ArrowRight } from 'lucide-react';
import type { ReservationTab } from '../types/my-reservations.types';

interface ReservationEmptyStateProps {
  activeTab: ReservationTab;
}

export const ReservationEmptyState: React.FC<ReservationEmptyStateProps> = ({ activeTab }) => {
  return (
    <div className="reservations-empty-state">
      <div className="empty-icon-wrap">
        <CalendarClock size={40} />
      </div>
      <h3>
        {activeTab === 'activas'
          ? 'No tienes reservas activas en este momento'
          : 'No cuentas con historial de reservas pasadas'}
      </h3>
      <p>
        {activeTab === 'activas'
          ? 'Explora nuestro catálogo, elige tus prendas favoritas y apártalas en tu sucursal más cercana para probártelas sin compromiso.'
          : 'Aquí aparecerán tus reservas una vez que las hayas retirado, completado o cancelado.'}
      </p>
      {activeTab === 'activas' && (
        <a href="/catalogo" className="btn-go-catalog">
          Explorar Catálogo de Moda <ArrowRight size={16} />
        </a>
      )}
    </div>
  );
};
