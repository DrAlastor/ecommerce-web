/**
 * @caso-de-uso CU17 — Realizar reserva de prendas
 * @subsistema Reservas
 * @capa Boundary — Frontend web
 * @responsabilidad Implementa una parte reutilizable de la interfaz de Frontend web y comunica eventos al controlador de presentación.
 * @secuencia Cliente -> formulario de reserva -> controlador de reservas -> servicio de disponibilidad -> Reserva/DetalleReserva/Inventario/Sucursal.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Printer,
  X,
  Info,
  Store,
  ArrowLeft,
} from 'lucide-react';
import type { ReservationReceipt } from '../types/reservation.types';
import './ReservationModal.css';

interface ReservationReceiptModalProps {
  receipt: ReservationReceipt;
  onClose: () => void;
}

export const ReservationReceiptModal: React.FC<ReservationReceiptModalProps> = ({
  receipt,
  onClose,
}) => {
  const navigate = useNavigate();
  const handlePrint = () => {
    window.print();
  };

  const formattedReservationDate = new Date(receipt.comprobante.fecha_reserva).toLocaleDateString(
    'es-BO',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
  );

  const formattedLimitDate = new Date(receipt.comprobante.fecha_limite).toLocaleDateString(
    'es-BO',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
  );

  const formattedEstimatedDate = receipt.comprobante.horario_estimado
    ? new Date(receipt.comprobante.horario_estimado).toLocaleDateString('es-BO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'No especificada';

  return (
    <div className="reservation-modal-backdrop" onClick={onClose}>
      <div
        className="reservation-modal-container receipt-modal print-receipt-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="reservation-modal-header receipt-header">
          <div className="receipt-success-badge">
            <CheckCircle2 size={24} className="text-emerald-500" />
            <div>
              <h2 className="receipt-title">¡Reserva Generada con Éxito!</h2>
              <p className="receipt-subtitle">
                Tus prendas ya fueron apartadas temporalmente en tienda.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="reservation-modal-close no-print"
            onClick={onClose}
            aria-label="Cerrar comprobante"
          >
            <X size={20} />
          </button>
        </div>

        {/* Voucher Central Card */}
        <div className="receipt-voucher-card">
          {/* Top Bar con Código y Estado */}
          <div className="voucher-top-bar">
            <div>
              <span className="voucher-label">CÓDIGO DE RESERVA</span>
              <div className="voucher-code-display">{receipt.comprobante.codigo}</div>
            </div>
            <div className="voucher-status-chip">
              <span className="status-dot"></span>
              <span>{receipt.comprobante.estado}</span>
            </div>
          </div>

          {/* Barcode & QR Simulation */}
          <div className="voucher-barcode-section">
            <div className="simulated-barcode">
              {Array.from({ length: 38 }).map((_, i) => (
                <div
                  key={i}
                  className="barcode-line"
                  style={{
                    width: i % 3 === 0 ? '4px' : i % 2 === 0 ? '2px' : '1px',
                    height: '42px',
                    backgroundColor: '#111827',
                    display: 'inline-block',
                    marginRight: '2px',
                  }}
                />
              ))}
            </div>
            <span className="barcode-number">{receipt.comprobante.codigo}</span>
          </div>

          {/* Información de la Sucursal */}
          <div className="receipt-branch-card">
            <div className="branch-card-header">
              <Store size={18} className="text-amber-600" />
              <h4>Sucursal de Retiro: {receipt.sucursal.nombre}</h4>
            </div>
            <div className="branch-card-details">
              <div className="branch-detail-row">
                <MapPin size={15} />
                <span>
                  {receipt.sucursal.direccion} ({receipt.sucursal.ciudad})
                </span>
              </div>
              <div className="branch-detail-row">
                <Clock size={15} />
                <span>Horario de Atención: {receipt.sucursal.horario}</span>
              </div>
              {receipt.sucursal.telefono && (
                <div className="branch-detail-row">
                  <Phone size={15} />
                  <span>Contacto: {receipt.sucursal.telefono}</span>
                </div>
              )}
            </div>
          </div>

          {/* Resumen de Tiempos y Vigencia */}
          <div className="receipt-dates-grid">
            <div className="date-item">
              <span className="date-label">Fecha de Registro:</span>
              <span className="date-value">{formattedReservationDate}</span>
            </div>
            <div className="date-item">
              <span className="date-label">Visita Estimada:</span>
              <span className="date-value highlight-visit">{formattedEstimatedDate}</span>
            </div>
            <div className="date-item expiration-item">
              <span className="date-label">Vigente Hasta (48h):</span>
              <span className="date-value highlight-exp">{formattedLimitDate}</span>
            </div>
          </div>

          {/* Tabla de Artículos Reservados */}
          <div className="receipt-items-section">
            <h4 className="receipt-items-heading">Prendas Reservadas ({receipt.resumen.total_prendas})</h4>
            <div className="receipt-items-list">
              {receipt.items.map((item) => (
                <div key={item.id_detalle_reserva} className="receipt-item-row">
                  <div className="item-thumb-title">
                    {item.imagen_url ? (
                      <img src={item.imagen_url} alt={item.producto_nombre} className="item-thumb-img" />
                    ) : (
                      <div className="item-thumb-fallback">👕</div>
                    )}
                    <div>
                      <h5 className="item-name">{item.producto_nombre}</h5>
                      <div className="item-specs">
                        <span className="spec-badge">Talla: {item.talla}</span>
                        <span className="spec-badge color-badge">
                          <span
                            className="color-sample-circle"
                            style={{ backgroundColor: item.color_hex }}
                          />
                          {item.color_nombre}
                        </span>
                        <span className="spec-badge sku-badge">SKU: {item.sku}</span>
                      </div>
                    </div>
                  </div>
                  <div className="item-qty-price">
                    <span className="item-qty-pill">{item.cantidad} unidad(es)</span>
                    <span className="item-unit-price">Bs {item.subtotal_estimado.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Referencial */}
            <div className="receipt-total-bar">
              <span>Monto Referencial de Compra en Tienda:</span>
              <strong className="total-amount">Bs {receipt.resumen.total_estimado.toFixed(2)}</strong>
            </div>
          </div>

          {/* Notas / Instrucciones */}
          <div className="receipt-instructions-box">
            <div className="instructions-header">
              <Info size={16} />
              <span>Instrucciones para tu visita:</span>
            </div>
            <ul className="instructions-list">
              {receipt.instrucciones.map((inst, idx) => (
                <li key={idx}>{inst}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Acciones Inferiores */}
        <div className="reservation-modal-footer no-print">
          <div className="receipt-footer-left">
            <button
              type="button"
              className="btn-receipt-catalog"
              onClick={() => {
                onClose();
                navigate('/catalog');
              }}
            >
              <ArrowLeft size={16} />
              <span>Volver al Catálogo</span>
            </button>
            <button
              type="button"
              className="btn-receipt-secondary"
              onClick={() => {
                onClose();
                navigate('/mis-reservas');
              }}
            >
              Ver Mis Reservas
            </button>
          </div>
          <div className="receipt-footer-right">
            <button type="button" className="btn-receipt-print" onClick={handlePrint}>
              <Printer size={16} />
              <span>Imprimir</span>
            </button>
            <button type="button" className="btn-receipt-close-action" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
