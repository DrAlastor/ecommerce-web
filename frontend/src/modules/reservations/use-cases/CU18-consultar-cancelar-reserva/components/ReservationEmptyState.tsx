import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarClock, ArrowRight } from 'lucide-react';
import type { ReservationTab } from '../types/my-reservations.types';

interface ReservationEmptyStateProps {
  activeTab: ReservationTab;
}

export const ReservationEmptyState: React.FC<ReservationEmptyStateProps> = ({ activeTab }) => {
  const navigate = useNavigate();

  return (
    <div className="reservations-empty-state">
      <div className="empty-icon-wrap">
        <CalendarClock size={44} />
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
        <button
          type="button"
          onClick={() => navigate('/catalog')}
          className="btn-go-catalog"
        >
          <span>Explorar Catálogo de Moda</span>
          <ArrowRight size={16} />
        </button>
      )}
    </div>
  );
};
