/**
 * @caso-de-uso CU18 — Consultar y cancelar reserva
 * @subsistema Reservas
 * @capa Boundary — Frontend web
 * @responsabilidad Implementa una parte reutilizable de la interfaz de Frontend web y comunica eventos al controlador de presentación.
 * @secuencia Cliente -> listado de reservas -> controlador de reservas -> servicio de cancelación -> Reserva/DetalleReserva/Inventario.
 */
import React from 'react';
import { Clock, Archive } from 'lucide-react';
import type { ReservationTab } from '../types/my-reservations.types';

interface ReservationFilterTabsProps {
  activeTab: ReservationTab;
  onTabChange: (tab: ReservationTab) => void;
}

export const ReservationFilterTabs: React.FC<ReservationFilterTabsProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <div className="reservations-nav-tabs">
      <button
        type="button"
        className={`res-nav-tab ${activeTab === 'activas' ? 'active' : ''}`}
        onClick={() => onTabChange('activas')}
      >
        <Clock size={16} />
        Reservas Activas
      </button>
      <button
        type="button"
        className={`res-nav-tab ${activeTab === 'historico' ? 'active' : ''}`}
        onClick={() => onTabChange('historico')}
      >
        <Archive size={16} />
        Historial de Reservas
      </button>
    </div>
  );
};
