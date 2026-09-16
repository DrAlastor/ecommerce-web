import React, { useMemo } from 'react';
import { MapPin, Navigation, Clock, Phone, ExternalLink } from 'lucide-react';
import type { PublicBranch } from '../types/branchesPublic.types';
import { isBranchOpenNow } from '../hooks/useBranches';

interface BranchCardProps {
  branch: PublicBranch;
  onOpenModal: (branch: PublicBranch) => void;
}

export const BranchCard: React.FC<BranchCardProps> = React.memo(({ branch, onOpenModal }) => {
  const status = useMemo(
    () => isBranchOpenNow(branch.hora_apertura, branch.hora_cierre),
    [branch.hora_apertura, branch.hora_cierre],
  );

  const googleMapsUrl = useMemo(() => {
    const query = encodeURIComponent(`${branch.nombre}, ${branch.direccion}, ${branch.ciudad.nombre}, Bolivia`);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  }, [branch.nombre, branch.direccion, branch.ciudad.nombre]);


  return (
    <article
      className="branch-card"
      onClick={() => onOpenModal(branch)}
    >
      {/* Cabecera de la tarjeta */}
      <div className="branch-card-header">
        <div className="branch-city-tag">
          <MapPin size={13} />
          <span>{branch.ciudad.nombre}</span>
        </div>
        <div className={`branch-status-badge ${status.isOpen ? 'open' : 'closed'}`}>
          <span className="status-dot"></span>
          <span>{status.isOpen ? 'Abierto' : 'Cerrado'}</span>
        </div>
      </div>

      {/* Nombre del establecimiento */}
      <h3 className="branch-name">{branch.nombre}</h3>

      {/* Información de atención */}
      <div className="branch-info-list">
        {/* Dirección */}
        <div className="branch-info-row">
          <Navigation size={17} className="info-icon" />
          <div className="info-content">
            <span className="info-label">Dirección</span>
            <span className="info-value">{branch.direccion}</span>
          </div>
        </div>

        {/* Horarios */}
        <div className="branch-info-row">
          <Clock size={17} className="info-icon" />
          <div className="info-content">
            <span className="info-label">Horario de atención</span>
            <span className="info-value">
              {branch.hora_apertura || '10:00'} - {branch.hora_cierre || '21:00'}
            </span>
            <span className="status-subtext">{status.message}</span>
          </div>
        </div>

        {/* Teléfono */}
        <div className="branch-info-row">
          <Phone size={17} className="info-icon" />
          <div className="info-content">
            <span className="info-label">Contacto directo</span>
            <span className="info-value">{branch.telefono || 'Sin teléfono'}</span>
          </div>
        </div>
      </div>

      {/* Barra de acciones de la tarjeta */}
      <div className="branch-card-actions" onClick={(e) => e.stopPropagation()}>
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="card-action-btn maps-btn"
          title="Cómo llegar con Google Maps"
        >
          <ExternalLink size={15} />
          <span>Cómo llegar</span>
        </a>

        {branch.telefono && (
          <a
            href={`tel:${branch.telefono}`}
            className="card-action-btn call-btn"
            title="Llamar a la tienda"
          >
            <Phone size={15} />
            <span>Llamar</span>
          </a>
        )}

        <button
          type="button"
          className="card-action-btn details-btn"
          onClick={() => onOpenModal(branch)}
        >
          <span>Ver detalles</span>
        </button>
      </div>
    </article>
  );
});

BranchCard.displayName = 'BranchCard';
