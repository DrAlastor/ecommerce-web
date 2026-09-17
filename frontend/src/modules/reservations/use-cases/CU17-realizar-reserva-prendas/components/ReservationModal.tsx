import React, { useEffect, useState } from 'react';
import {
  X,
  Store,
  Calendar,
  Clock,
  MapPin,
  AlertCircle,
  Check,
  ShieldCheck,
  Minus,
  Plus,
  Loader2,
  CalendarClock,
} from 'lucide-react';
import type {
  BranchAvailability,
  ReservationReceipt,
} from '../types/reservation.types';
import { reservationService } from '../services/reservation.service';
import './ReservationModal.css';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id_producto: number;
    nombre: string;
    precio_base: number;
    imagenes?: Array<{ url: string; es_principal?: boolean }>;
  };
  selectedVariant: {
    id_producto_variante: number;
    sku: string;
    precio_adicional?: number;
    talla: { codigo: string };
    color: { nombre: string; codigo_hex: string | null };
    modelo_3d_url?: string | null;
    imagen_url?: string | null;
  } | null;
  initialQuantity?: number;
  onReservationSuccess: (receipt: ReservationReceipt) => void;
  onRequireAuth?: () => void;
}

const formatHour = (timeVal?: string | null): string => {
  if (!timeVal) return '';
  if (timeVal.includes('T')) {
    return timeVal.split('T')[1].substring(0, 5);
  }
  return timeVal.substring(0, 5);
};

export const ReservationModal: React.FC<ReservationModalProps> = ({
  isOpen,
  onClose,
  product,
  selectedVariant,
  initialQuantity = 1,
  onReservationSuccess,
  onRequireAuth,
}) => {
  const [loadingBranches, setLoadingBranches] = useState<boolean>(false);
  const [branches, setBranches] = useState<BranchAvailability[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number>(initialQuantity);
  const [visitDate, setVisitDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fechas mínimas y sugeridas para visita (hoy, mañana, máx 3 días)
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 3);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  useEffect(() => {
    if (isOpen && selectedVariant) {
      setQuantity(Math.max(1, initialQuantity));
      setVisitDate(tomorrowStr);
      setNotes('');
      setErrorMessage(null);
      fetchBranches(selectedVariant.id_producto_variante);
    }
  }, [isOpen, selectedVariant]);

  const fetchBranches = async (variantId: number) => {
    try {
      setLoadingBranches(true);
      setErrorMessage(null);
      const data = await reservationService.getBranchAvailability(variantId);
      setBranches(data.sucursales);

      // Auto-seleccionar la primera sucursal con stock disponible
      const firstWithStock = data.sucursales.find((s) => s.stock_disponible > 0);
      if (firstWithStock) {
        setSelectedBranchId(firstWithStock.id_sucursal);
      } else if (data.sucursales.length > 0) {
        setSelectedBranchId(data.sucursales[0].id_sucursal);
      }
    } catch (err: any) {
      console.error('Error al cargar sucursales:', err);
      setErrorMessage('No se pudo verificar la disponibilidad en sucursales.');
    } finally {
      setLoadingBranches(false);
    }
  };

  if (!isOpen || !selectedVariant) return null;

  const selectedBranch = branches.find((b) => b.id_sucursal === selectedBranchId);
  const maxAvailable = selectedBranch ? selectedBranch.stock_disponible : 0;
  const isAvailableInSelectedBranch = maxAvailable > 0;

  const handleQuantityChange = (newQty: number) => {
    if (newQty < 1) return;
    if (maxAvailable > 0 && newQty > maxAvailable) {
      setQuantity(maxAvailable);
    } else {
      setQuantity(newQty);
    }
  };

  const handleConfirmReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranchId) {
      setErrorMessage('Por favor selecciona una sucursal física.');
      return;
    }

    if (!isAvailableInSelectedBranch) {
      setErrorMessage(
        'La sucursal seleccionada no tiene existencias disponibles para esta prenda.',
      );
      return;
    }

    if (quantity > maxAvailable) {
      setErrorMessage(`Solo hay ${maxAvailable} unidad(es) disponible(s) en esta tienda.`);
      return;
    }

    // Validar si el usuario está autenticado en localStorage
    const token = localStorage.getItem('accessToken');
    if (!token) {
      if (onRequireAuth) {
        onRequireAuth();
      } else {
        setErrorMessage('Debes iniciar sesión con tu cuenta de cliente para reservar.');
      }
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const receipt = await reservationService.createReservation({
        id_sucursal: selectedBranchId,
        id_producto_variante: selectedVariant.id_producto_variante,
        cantidad: quantity,
        fecha_visita: visitDate ? new Date(visitDate).toISOString() : undefined,
        observaciones: notes.trim() || undefined,
      });

      onReservationSuccess(receipt);
    } catch (err: any) {
      console.error('Error al crear reserva:', err);
      const serverMsg =
        err.response?.data?.message ||
        'Ocurrió un error al procesar tu reserva. Inténtalo nuevamente.';
      setErrorMessage(serverMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Precios
  const basePrice = Number(product.precio_base) || 0;
  const addPrice = Number(selectedVariant.precio_adicional) || 0;
  const finalUnitPrice = basePrice + addPrice;
  const estimatedSubtotal = finalUnitPrice * quantity;

  // Imagen del producto o variante
  const previewImg =
    selectedVariant.imagen_url ||
    product.imagenes?.find((img) => img.es_principal)?.url ||
    product.imagenes?.[0]?.url;

  return (
    <div className="reservation-modal-backdrop" onClick={onClose}>
      <div
        className="reservation-modal-container reservation-form-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado */}
        <div className="reservation-modal-header">
          <div className="modal-title-wrap">
            <CalendarClock size={22} className="text-stone-900" />
            <div>
              <h2 className="reservation-modal-title">Reservar Prenda en Sucursal</h2>
              <p className="reservation-modal-subtitle">
                Separa tu prenda temporalmente para probártela o comprarla en tienda.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="reservation-modal-close"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mensaje de error general si existe */}
        {errorMessage && (
          <div className="reservation-alert-banner">
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleConfirmReservation} className="reservation-form-body">
          {/* Tarjeta de Prenda Seleccionada */}
          <div className="reservation-product-card">
            <div className="product-card-thumb">
              {previewImg ? (
                <img src={previewImg} alt={product.nombre} />
              ) : (
                <div className="thumb-placeholder">👗</div>
              )}
            </div>
            <div className="product-card-info">
              <h3 className="product-name">{product.nombre}</h3>
              <div className="product-specs-chips">
                <span className="spec-chip">Talla: {selectedVariant.talla.codigo}</span>
                <span className="spec-chip color-chip">
                  <span
                    className="color-dot"
                    style={{ backgroundColor: selectedVariant.color.codigo_hex || '#111827' }}
                  />
                  {selectedVariant.color.nombre}
                </span>
                <span className="spec-chip sku-chip">SKU: {selectedVariant.sku}</span>
              </div>
              <div className="product-card-price">
                <span className="price-label">Precio referencial:</span>
                <span className="price-value">Bs {finalUnitPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Selector de Sucursal Física */}
          <div className="form-field-group">
            <label className="field-label">
              <Store size={16} />
              <span>Selecciona la Sucursal de Retiro y Prueba:</span>
            </label>

            {loadingBranches ? (
              <div className="branches-loading-box">
                <Loader2 size={24} className="spin-icon" />
                <span>Verificando disponibilidad en sucursales físicas...</span>
              </div>
            ) : branches.length === 0 ? (
              <div className="no-branches-box">
                <AlertCircle size={20} />
                <span>No se encontraron sucursales físicas activas.</span>
              </div>
            ) : (
              <div className="branches-selection-grid">
                {branches.map((suc) => {
                  const isSelected = suc.id_sucursal === selectedBranchId;
                  const hasStock = suc.stock_disponible > 0;

                  return (
                    <div
                      key={suc.id_sucursal}
                      className={`branch-option-card ${isSelected ? 'selected' : ''} ${
                        !hasStock ? 'no-stock' : ''
                      }`}
                      onClick={() => setSelectedBranchId(suc.id_sucursal)}
                    >
                      <div className="branch-option-header">
                        <span className="branch-name">{suc.nombre}</span>
                        {hasStock ? (
                          <span className="branch-stock-pill in-stock">
                            {suc.stock_disponible} disponible(s)
                          </span>
                        ) : (
                          <span className="branch-stock-pill out-of-stock">Agotado</span>
                        )}
                      </div>
                      <div className="branch-option-address">
                        <MapPin size={13} />
                        <span>{suc.direccion} ({suc.ciudad})</span>
                      </div>
                      <div className="branch-option-hours">
                        <Clock size={13} />
                        <span>Horario: {formatHour(suc.hora_apertura)} - {formatHour(suc.hora_cierre)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selector de Cantidad y Fecha Prevista */}
          <div className="form-fields-row">
            {/* Cantidad */}
            <div className="field-column">
              <label className="field-label">Cantidad a reservar:</label>
              <div className="quantity-stepper">
                <button
                  type="button"
                  className="btn-stepper"
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1 || !isAvailableInSelectedBranch}
                >
                  <Minus size={14} />
                </button>
                <span className="stepper-value">{quantity}</span>
                <button
                  type="button"
                  className="btn-stepper"
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={!isAvailableInSelectedBranch || quantity >= maxAvailable}
                >
                  <Plus size={14} />
                </button>
              </div>
              <span className="field-hint">
                {isAvailableInSelectedBranch
                  ? `Máx. ${maxAvailable} unidad(es)`
                  : 'Sin stock en esta sucursal'}
              </span>
            </div>

            {/* Fecha estimada de visita */}
            <div className="field-column">
              <label className="field-label">
                <Calendar size={15} />
                <span>Fecha prevista de visita:</span>
              </label>
              <input
                type="date"
                className="input-date"
                min={todayStr}
                max={maxDateStr}
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                required
              />
              <span className="field-hint">Recomendado dentro de las próximas 48h.</span>
            </div>
          </div>

          {/* Observaciones Opcionales */}
          <div className="form-field-group">
            <label className="field-label">
              Notas u observaciones para el personal de tienda (opcional):
            </label>
            <textarea
              className="input-textarea"
              rows={2}
              placeholder="Ej: Acudiré después de las 16:00 a probármelo..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={200}
            />
          </div>

          {/* Caja de Reglas y Condiciones */}
          <div className="reservation-policy-box">
            <div className="policy-item">
              <ShieldCheck size={18} className="text-emerald-700" />
              <div>
                <strong>Apartado Garantizado por 48 horas:</strong>
                <p>
                  Tus prendas se reservarán en el sistema sin compromiso de compra. No requiere pago previo.
                </p>
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="reservation-modal-footer">
            <div className="footer-subtotal">
              <span className="subtotal-label">Subtotal estimado:</span>
              <span className="subtotal-price">Bs {estimatedSubtotal.toFixed(2)}</span>
            </div>

            <div className="footer-buttons">
              <button
                type="button"
                className="btn-cancel-reservation"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-confirm-reservation"
                disabled={isSubmitting || loadingBranches || !isAvailableInSelectedBranch}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="spin-icon" />
                    <span>Confirmando reserva...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    <span>Confirmar Reserva</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
