import React, { useState } from 'react';
import { paymentBillingService } from '../../../services/payment-billing.service';
import { presentialSaleService } from '../../../services/presential-sale.service';
import type {
  PendingSale,
  PaymentConfirmationResult,
} from '../../../types/payment-billing.types';
import {
  Banknote,
  CreditCard,
  QrCode,
  Building2,
  CheckCircle2,
  AlertCircle,
  Printer,
  X,
  FileText,
  DollarSign,
  ArrowRight,
} from 'lucide-react';
import { printReceipt } from '../../../../../shared/utils/printReceipt';
import './POSPaymentModal.css';

export interface PresentialSaleOrderInput {
  id_sucursal: number;
  sucursal_nombre?: string;
  items: {
    id_producto_variante: number;
    cantidad: number;
    nombre_producto?: string;
    talla?: string;
    color?: string;
    precio_unitario?: number;
    subtotal?: number;
  }[];
  total: number;
  subtotal: number;
  descuento: number;
  id_cliente?: number;
  cliente_ci?: string;
  cliente_nombre?: string;
}

interface POSPaymentModalProps {
  sale?: PendingSale | null;
  presentialSale?: PresentialSaleOrderInput | null;
  initialReceipt?: PaymentConfirmationResult | null;
  onClose: () => void;
  onPaymentSuccess?: (result: PaymentConfirmationResult) => void;
}

export const POSPaymentModal: React.FC<POSPaymentModalProps> = ({
  sale,
  presentialSale,
  initialReceipt,
  onClose,
  onPaymentSuccess,
}) => {
  const totalPagar = sale ? sale.total : (presentialSale?.total ?? (initialReceipt?.liquidacion?.total ?? 0));
  const clienteNombreInicial = sale?.cliente?.nombre_completo || presentialSale?.cliente_nombre || initialReceipt?.cliente?.nombre_completo || 'Cliente Final';
  const clienteCIInicial = sale?.cliente?.ci || presentialSale?.cliente_ci || initialReceipt?.cliente?.nit_ci || '0';
  const totalArticulos = sale
    ? sale.total_articulos
    : (presentialSale?.items.reduce((s, i) => s + i.cantidad, 0) || (initialReceipt?.items.reduce((s, i) => s + i.cantidad, 0) || 0));

  const [paymentMethod, setPaymentMethod] = useState<
    'efectivo' | 'tarjeta' | 'qr' | 'transferencia'
  >('efectivo');

  // Efectivo
  const [cashReceived, setCashReceived] = useState<number>(totalPagar);

  // Tarjeta / Transacción
  const [transaccionRef, setTransaccionRef] = useState<string>('');

  // Facturación
  const [nitFactura, setNitFactura] = useState<string>(clienteCIInicial);
  const [razonSocial, setRazonSocial] = useState<string>(clienteNombreInicial);

  // Estados de proceso y resultado
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<PaymentConfirmationResult | null>(initialReceipt || null);

  // Cálculo del cambio
  const cambio = Math.max(0, Math.round((cashReceived - totalPagar) * 100) / 100);
  const faltaDinero = cashReceived < totalPagar;

  // Botones de billetes rápidos
  const addCash = (amount: number) => {
    setCashReceived((prev) => Math.round((prev + amount) * 100) / 100);
  };

  const setExactCash = () => {
    setCashReceived(totalPagar);
  };

  // Confirmar y procesar cobro
  const handleConfirmPayment = async () => {
    setErrorMessage(null);

    if (paymentMethod === 'efectivo' && faltaDinero) {
      setErrorMessage(`El monto recibido en efectivo (${cashReceived.toFixed(2)} Bs) no cubre el total de ${totalPagar.toFixed(2)} Bs.`);
      return;
    }

    try {
      setIsProcessing(true);

      let finalRef = transaccionRef.trim();
      if (!finalRef) {
        if (paymentMethod === 'efectivo') {
          finalRef = `EFECTIVO-CAJA-${Date.now().toString().slice(-6)}`;
        } else if (paymentMethod === 'qr') {
          finalRef = `QR-POS-${Date.now().toString().slice(-6)}`;
        } else if (paymentMethod === 'tarjeta') {
          finalRef = `POS-CARD-${Math.floor(1000 + Math.random() * 9000)}`;
        } else {
          finalRef = `DEP-REF-${Date.now().toString().slice(-6)}`;
        }
      }

      let result: PaymentConfirmationResult;

      if (presentialSale) {
        result = await presentialSaleService.registerSale({
          id_sucursal: presentialSale.id_sucursal,
          items: presentialSale.items.map((i) => ({
            id_producto_variante: i.id_producto_variante,
            cantidad: i.cantidad,
          })),
          metodo_pago: paymentMethod === 'transferencia' ? 'tarjeta' : paymentMethod,
          monto_recibido: paymentMethod === 'efectivo' ? cashReceived : totalPagar,
          transaccion_externa: finalRef,
          nit_factura: nitFactura.trim() || '0',
          razon_social_factura: razonSocial.trim() || 'Cliente Final',
          id_cliente: presentialSale.id_cliente,
          cliente_ci: presentialSale.cliente_ci,
          cliente_nombre: presentialSale.cliente_nombre,
        });
      } else if (sale) {
        const payload = {
          id_venta: sale.id_venta,
          metodo_pago: paymentMethod,
          monto: totalPagar,
          monto_recibido: paymentMethod === 'efectivo' ? cashReceived : totalPagar,
          transaccion_externa: finalRef,
          nit_factura: nitFactura.trim() || '0',
          razon_social_factura: razonSocial.trim() || 'Cliente Final',
        };

        result = await paymentBillingService.processPayment(payload);
      } else {
        throw new Error('No se ha proporcionado ninguna orden para procesar.');
      }

      setReceipt(result);
      if (onPaymentSuccess) {
        onPaymentSuccess(result);
      }
    } catch (err: any) {
      console.error('Error processing payment in modal:', err);
      const msg =
        err.response?.data?.message ||
        'Ocurrió un error al procesar el pago. Verifica los datos e intenta nuevamente.';
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="pos-modal-backdrop" onClick={onClose}>
      <div className="pos-modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Cabecera */}
        <div className="pos-modal-header">
          <div className="pos-header-info">
            <div className="pos-badge-icon">
              <FileText size={18} />
              <span>
                {sale
                  ? `Venta #${sale.id_venta} • ${sale.codigo_factura}`
                  : `Venta Mostrador • ${presentialSale?.sucursal_nombre || 'Tienda Física'}`}
              </span>
            </div>
            <h2>Cobro y Facturación en Caja</h2>
          </div>
          <button
            type="button"
            className="btn-pos-close"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Si el cobro ya fue exitoso, mostramos el Comprobante Fiscal */}
        {receipt ? (
          <div className="pos-modal-success-content">
            <div className="success-banner">
              <div className="success-icon-circle">
                <CheckCircle2 size={36} />
              </div>
              <h3>¡Cobro Procesado y Factura Emitida!</h3>
              <p>La venta ha sido completada y se registró el comprobante fiscal oficial.</p>
            </div>

            {/* Recuadro de Factura / Ticket */}
            <div className="ticket-preview-card">
              <div className="ticket-header-brand">
                <h4>FASHION STORE S.R.L.</h4>
                <p>Casa Matriz: Av. San Martín #450 • Santa Cruz, Bolivia</p>
                <p className="ticket-nit">NIT: 1029384019</p>
                <div className="ticket-divider" />
                <p className="ticket-fac-number">FACTURA: {receipt.codigo_factura}</p>
                <p className="ticket-date">{new Date(receipt.fecha).toLocaleString('es-BO')}</p>
              </div>

              <div className="ticket-client-info">
                <p><strong>SEÑOR(ES):</strong> {receipt.cliente.nombre_completo}</p>
                <p><strong>NIT/CI:</strong> {receipt.cliente.nit_ci}</p>
              </div>

              <div className="ticket-divider" />

              <table className="ticket-items-table">
                <thead>
                  <tr>
                    <th>Cant.</th>
                    <th>Detalle</th>
                    <th className="text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {receipt.items.map((it) => (
                    <tr key={it.id_detalle_venta}>
                      <td>{it.cantidad}</td>
                      <td>{it.nombre_producto} ({it.talla})</td>
                      <td className="text-right">{it.subtotal.toFixed(2)} Bs</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="ticket-divider" />

              <div className="ticket-totals-section">
                <div className="ticket-row">
                  <span>Subtotal:</span>
                  <span>{receipt.liquidacion.subtotal.toFixed(2)} Bs</span>
                </div>
                {receipt.liquidacion.descuento > 0 && (
                  <div className="ticket-row discount">
                    <span>Descuento:</span>
                    <span>-{receipt.liquidacion.descuento.toFixed(2)} Bs</span>
                  </div>
                )}
                <div className="ticket-row total-big">
                  <span>TOTAL PAGADO:</span>
                  <span>{receipt.liquidacion.total.toFixed(2)} Bs</span>
                </div>

                {receipt.pago.metodo_pago === 'efectivo' && (
                  <>
                    <div className="ticket-row">
                      <span>Efectivo Recibido:</span>
                      <span>{receipt.pago.monto_recibido.toFixed(2)} Bs</span>
                    </div>
                    <div className="ticket-row change-highlight">
                      <span>CAMBIO / VUELTO:</span>
                      <span>{receipt.pago.cambio.toFixed(2)} Bs</span>
                    </div>
                  </>
                )}
              </div>

              <div className="ticket-divider" />

              <div className="ticket-fiscal-footer">
                <p><strong>Nº Autorización:</strong> {receipt.factura.numero_autorizacion}</p>
                <p><strong>Código Control:</strong> {receipt.factura.codigo_control}</p>
                <p className="ticket-legend">{receipt.factura.leyenda}</p>
              </div>
            </div>

            {/* Acciones finales */}
            <div className="pos-success-actions">
              <button
                type="button"
                className="btn-print-ticket"
                onClick={() => {
                  printReceipt({
                    codigo_factura: receipt.codigo_factura || receipt.factura?.numero_factura || 'FAC-POS',
                    fecha_venta: receipt.fecha || new Date().toISOString(),
                    cliente: {
                      nombre_completo: receipt.cliente.nombre_completo,
                      ci: receipt.cliente.nit_ci,
                    },
                    tipo_venta: 'presencial',
                    subtotal: receipt.liquidacion.subtotal,
                    descuento: receipt.liquidacion.descuento,
                    total: receipt.liquidacion.total,
                    pago: {
                      metodo_pago: receipt.pago.metodo_pago,
                    },
                    items: receipt.items.map((it) => ({
                      nombre_producto: it.nombre_producto,
                      talla: it.talla,
                      cantidad: it.cantidad,
                      precio_unitario: it.precio_unitario,
                      subtotal: it.subtotal,
                    })),
                  });
                }}
              >
                <Printer size={18} />
                <span>Imprimir Factura / Ticket</span>
              </button>
              <button
                type="button"
                className="btn-finish-modal"
                onClick={onClose}
              >
                <span>Finalizar y Nueva Venta</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        ) : (
          /* Formulario de Cobro */
          <div className="pos-modal-form-content">
            {errorMessage && (
              <div className="pos-error-banner">
                <AlertCircle size={20} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Resumen Superior de la Venta */}
            <div className="sale-summary-strip">
              <div className="summary-col">
                <span className="strip-label">Cliente</span>
                <strong className="strip-val">{clienteNombreInicial}</strong>
              </div>
              <div className="summary-col">
                <span className="strip-label">Artículos</span>
                <strong className="strip-val">{totalArticulos} prendas</strong>
              </div>
              <div className="summary-col highlight-col">
                <span className="strip-label">Total a Cobrar</span>
                <strong className="strip-val total-digits">{totalPagar.toFixed(2)} Bs</strong>
              </div>
            </div>

            {/* Selector de Método de Pago */}
            <div className="pos-payment-methods">
              <span className="pos-section-label">Seleccionar Método de Pago:</span>
              <div className="methods-buttons-grid">
                <button
                  type="button"
                  className={`method-btn ${paymentMethod === 'efectivo' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('efectivo')}
                >
                  <Banknote size={20} />
                  <span>Efectivo</span>
                </button>
                <button
                  type="button"
                  className={`method-btn ${paymentMethod === 'tarjeta' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('tarjeta')}
                >
                  <CreditCard size={20} />
                  <span>Tarjeta POS</span>
                </button>
                <button
                  type="button"
                  className={`method-btn ${paymentMethod === 'qr' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('qr')}
                >
                  <QrCode size={20} />
                  <span>Pago QR</span>
                </button>
                <button
                  type="button"
                  className={`method-btn ${paymentMethod === 'transferencia' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('transferencia')}
                >
                  <Building2 size={20} />
                  <span>Transferencia</span>
                </button>
              </div>
            </div>

            {/* Panel Específico de EFECTIVO con cálculo de cambio */}
            {paymentMethod === 'efectivo' && (
              <div className="cash-panel-box">
                <div className="cash-input-row">
                  <div className="cash-field">
                    <label>Dinero Recibido (Bs) *</label>
                    <div className="cash-input-wrap">
                      <DollarSign size={18} />
                      <input
                        type="number"
                        step="0.50"
                        min="0"
                        value={cashReceived}
                        onChange={(e) => setCashReceived(Number(e.target.value))}
                        className="cash-input font-bold"
                      />
                    </div>
                  </div>

                  <div className={`cash-change-display ${faltaDinero ? 'short' : 'ok'}`}>
                    <span className="change-label">
                      {faltaDinero ? 'Dinero Insuficiente' : 'Cambio a Devolver'}
                    </span>
                    <strong className="change-amount">
                      {faltaDinero
                        ? `Faltan ${(totalPagar - cashReceived).toFixed(2)} Bs`
                        : `${cambio.toFixed(2)} Bs`}
                    </strong>
                  </div>
                </div>

                {/* Billetes rápidos */}
                <div className="quick-bills-strip">
                  <span className="bills-label">Billetes Rápidos:</span>
                  <button type="button" onClick={setExactCash} className="bill-chip exact">
                    Exacto ({totalPagar.toFixed(0)} Bs)
                  </button>
                  <button type="button" onClick={() => addCash(10)} className="bill-chip">
                    +10 Bs
                  </button>
                  <button type="button" onClick={() => addCash(20)} className="bill-chip">
                    +20 Bs
                  </button>
                  <button type="button" onClick={() => addCash(50)} className="bill-chip">
                    +50 Bs
                  </button>
                  <button type="button" onClick={() => addCash(100)} className="bill-chip">
                    +100 Bs
                  </button>
                  <button type="button" onClick={() => addCash(200)} className="bill-chip">
                    +200 Bs
                  </button>
                </div>
              </div>
            )}

            {/* Panel de Tarjeta */}
            {paymentMethod === 'tarjeta' && (
              <div className="other-payment-box">
                <label>Número de Autorización / Lote de la Terminal POS</label>
                <input
                  type="text"
                  placeholder="Ej: AUT-928194 o Tarjeta Stripe"
                  value={transaccionRef}
                  onChange={(e) => setTransaccionRef(e.target.value)}
                  className="form-input font-mono"
                />
              </div>
            )}

            {/* Panel de QR */}
            {paymentMethod === 'qr' && (
              <div className="other-payment-box qr-center-box">
                <QrCode size={120} className="qr-simulated-pic" />
                <p>El cliente debe escanear el código desde su aplicación bancaria.</p>
              </div>
            )}

            {/* Panel de Transferencia */}
            {paymentMethod === 'transferencia' && (
              <div className="other-payment-box">
                <label>Número de Depósito o Comprobante Bancario</label>
                <input
                  type="text"
                  placeholder="Ej: DEP-829104"
                  value={transaccionRef}
                  onChange={(e) => setTransaccionRef(e.target.value)}
                  className="form-input font-mono"
                />
              </div>
            )}

            {/* Datos de Facturación */}
            <div className="pos-billing-fields">
              <span className="pos-section-label">Datos en Factura Oficial:</span>
              <div className="billing-grid">
                <div className="form-group">
                  <label>NIT / CI</label>
                  <input
                    type="text"
                    placeholder="0 para Sin NIT"
                    value={nitFactura}
                    onChange={(e) => setNitFactura(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Razón Social / Nombre</label>
                  <input
                    type="text"
                    placeholder="Cliente Final o Empresa"
                    value={razonSocial}
                    onChange={(e) => setRazonSocial(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>
            </div>

            {/* Pie de Acción */}
            <div className="pos-modal-footer">
              <button
                type="button"
                className="btn-cancel-payment"
                onClick={onClose}
                disabled={isProcessing}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-submit-payment"
                onClick={handleConfirmPayment}
                disabled={isProcessing || (paymentMethod === 'efectivo' && faltaDinero)}
              >
                {isProcessing ? (
                  <span>Procesando Cobro...</span>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    <span>Confirmar Cobro • {totalPagar.toFixed(2)} Bs</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default POSPaymentModal;
