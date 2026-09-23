/**
 * @caso-de-uso CU14 — Consultar sucursales
 * @subsistema Sucursales e Inventario
 * @capa Boundary — Frontend web
 * @responsabilidad Implementa una parte reutilizable de la interfaz de Frontend web y comunica eventos al controlador de presentación.
 * @secuencia Cliente -> listado de sucursales -> controlador de consulta -> servicio de sucursales -> Ciudad/Sucursal/Disponibilidad.
 */
import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, MapPin, ExternalLink, Phone, Calendar } from 'lucide-react';
import type { PublicBranch } from '../types/branchesPublic.types';
import { isBranchOpenNow } from '../hooks/useBranches';

interface BranchModalProps {
  branch: PublicBranch | null;
  onClose: () => void;
  copiedPhoneId: number | null;
  onCopyPhone: (branch: PublicBranch, e: React.MouseEvent) => void;
}

export const BranchModal: React.FC<BranchModalProps> = React.memo(({
  branch,
  onClose,
  copiedPhoneId,
  onCopyPhone,
}) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (branch) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [branch]);

  const status = useMemo(() => {
    if (!branch) return { isOpen: false, message: '' };
    return isBranchOpenNow(branch.hora_apertura, branch.hora_cierre);
  }, [branch?.hora_apertura, branch?.hora_cierre]);

  if (!branch) return null;

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${branch.nombre}, ${branch.direccion}, ${branch.ciudad.nombre}, Bolivia`)}`;


  return (
    <div className="branch-modal-overlay" onClick={onClose}>
      <div className="branch-modal-content" onClick={(e) => e.stopPropagation()}>
        <button
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Cerrar modal"
          type="button"
        >
          <X size={20} />
        </button>

        <div className="modal-header">
          <div className="modal-city-badge">
            <MapPin size={14} />
            <span>{branch.ciudad.nombre}, {branch.ciudad.pais}</span>
          </div>
          <h2 className="modal-branch-name">{branch.nombre}</h2>
          <div className={`branch-status-badge ${status.isOpen ? 'open' : 'closed'}`}>
            <span className="status-dot"></span>
            <span>{status.message}</span>
          </div>
        </div>

        <div className="modal-body">
          <div className="modal-detail-card">
            <h4>Ubicación & Dirección</h4>
            <p>{branch.direccion}</p>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="modal-maps-link"
            >
              <ExternalLink size={15} />
              <span>Abrir ubicación en Google Maps</span>
            </a>
          </div>

          <div className="modal-detail-card">
            <h4>Horarios de Atención</h4>
            <div className="modal-schedule-row">
              <span>Lunes a Sábado:</span>
              <strong>{branch.hora_apertura || '10:00'} - {branch.hora_cierre || '22:00'}</strong>
            </div>
            <div className="modal-schedule-row">
              <span>Domingos y Feriados:</span>
              <strong>11:00 - 20:00</strong>
            </div>
          </div>

          <div className="modal-detail-card">
            <h4>Teléfono de Contacto</h4>
            <div className="modal-phone-action">
              <span className="phone-display">{branch.telefono || 'Sin número registrado'}</span>
              {branch.telefono && (
                <div className="phone-buttons">
                  <a href={`tel:${branch.telefono}`} className="modal-action-btn-small">
                    <Phone size={14} />
                    <span>Llamar</span>
                  </a>
                  <button
                    type="button"
                    className="modal-action-btn-small secondary"
                    onClick={(e) => onCopyPhone(branch, e)}
                  >
                    {copiedPhoneId === branch.id_sucursal ? '¡Copiado!' : 'Copiar'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sección de preparación para CU16 — Reservas */}
          <div className="modal-reservation-highlight">
            <div className="res-highlight-header">
              <Calendar size={20} className="res-icon" />
              <div>
                <h5>¿Quieres probarte prendas en esta sucursal?</h5>
                <p>Puedes explorar nuestro catálogo y reservar tus prendas favoritas para retirarlas o medírtelas en esta boutique.</p>
              </div>
            </div>
            <button
              className="modal-reserve-now-btn"
              type="button"
              onClick={() => {
                onClose();
                navigate('/catalog');
              }}
            >
              Explorar prendas disponibles para reservar →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

BranchModal.displayName = 'BranchModal';
