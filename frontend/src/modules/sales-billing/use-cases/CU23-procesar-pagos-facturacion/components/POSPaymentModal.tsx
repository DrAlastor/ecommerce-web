/**
 * @caso-de-uso CU23 — Procesar pago electrónico y facturación
 * @subsistema Ventas, Pagos y Compras
 * @capa Boundary — Frontend web
 * @responsabilidad Implementa una parte reutilizable de la interfaz de Frontend web y comunica eventos al controlador de presentación.
 * @secuencia Cliente -> interfaz de pago -> controlador de pagos -> servicio de pago y facturación -> Pasarela de Pago/Pago/Venta/Factura.
 */
import React, { useState } from 'react';
import QRCode from 'qrcode';
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
  Upload,
  Image as ImageIcon,
  Trash2,
  Sparkles,
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

  // Tarjeta POS
  const [selectedCardBrand, setSelectedCardBrand] = useState<'visa' | 'mastercard' | 'amex' | 'debito'>('visa');
  const [cardLast4, setCardLast4] = useState<string>('');

  // Cuentas bancarias y billeteras móviles para QR
  const POS_QR_ACCOUNTS = [
    {
      id: 'yape',
      name: 'Yape / BCP',
      banco: 'Banco de Crédito (BCP)',
      cuenta: 'Cel: 71234567 • Cta: 201-5093821',
      titular: 'FashionStore S.R.L.',
      color: '#7C3AED',
      badge: 'Yape Móvil',
    },
    {
      id: 'bmsc',
      name: 'QR Simple (BMSC)',
      banco: 'Mercantil Santa Cruz',
      cuenta: 'Cta Cte: 4010-892341-01',
      titular: 'FashionStore S.R.L. (NIT: 1029384756)',
      color: '#0D9488',
      badge: 'QR Simple',
    },
    {
      id: 'bnb',
      name: 'BNB Móvil',
      banco: 'Banco Nacional de Bolivia',
      cuenta: 'Cta: 150-0294810-01',
      titular: 'FashionStore Bolivia',
      color: '#2563EB',
      badge: 'BNB',
    },
    {
      id: 'tigo',
      name: 'Tigo Money',
      banco: 'Tigo Money Billetera',
      cuenta: 'Línea: 78901234',
      titular: 'FashionStore Retail',
      color: '#EA580C',
      badge: 'Billetera',
    },
  ];

  const [selectedAccountId, setSelectedAccountId] = useState<string>('yape');
  const [generatedPosQrUrl, setGeneratedPosQrUrl] = useState<string>('');
  const [isQrGenerated, setIsQrGenerated] = useState<boolean>(false);

  // QR de Sucursal guardado en localStorage permanentemente
  const [savedPosQrImage, setSavedPosQrImage] = useState<string | null>(() => {
    return localStorage.getItem('dressly_pos_qr_image') || null;
  });
  const [qrDisplayMode, setQrDisplayMode] = useState<'dinamico' | 'subido'>(() => {
    return localStorage.getItem('dressly_pos_qr_image') ? 'subido' : 'dinamico';
  });

  // Generador de código QR conectado a cuenta y monto
  const handleGenerateQR = () => {
    const acc = POS_QR_ACCOUNTS.find((a) => a.id === selectedAccountId) || POS_QR_ACCOUNTS[0];
    const qrData = `${acc.name.toUpperCase()}|MONTO:${totalPagar.toFixed(2)}|BOB|BANCO:${acc.banco}|CUENTA:${acc.cuenta}|TITULAR:${acc.titular}|GLOSA:POS-VENTA-${Date.now().toString().slice(-6)}`;
    QRCode.toDataURL(qrData, {
      width: 240,
      margin: 2,
      color: { dark: acc.color, light: '#ffffff' },
    })
      .then((url) => {
        setGeneratedPosQrUrl(url);
        setIsQrGenerated(true);
        setTransaccionRef(`QR-${acc.id.toUpperCase()}-${Date.now().toString().slice(-6)}`);
      })
      .catch((err) => console.error('Error generando QR:', err));
  };

  // Simular autorización de terminal física
  const handleSimulateCardAuth = () => {
    const authCode = `AUT-${Math.floor(100000 + Math.random() * 900000)}`;
    setTransaccionRef(authCode);
    setCardLast4('4242');
  };

  // Manejador de subida de imagen de QR de sucursal persistido
  const handleUploadPosQrImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Por favor selecciona una imagen válida (PNG, JPG o WEBP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setSavedPosQrImage(result);
        localStorage.setItem('dressly_pos_qr_image', result);
        setQrDisplayMode('subido');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveSavedPosQr = () => {
    setSavedPosQrImage(null);
    localStorage.removeItem('dressly_pos_qr_image');
    setQrDisplayMode('dinamico');
  };

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

            {/* Panel de Tarjeta POS Mejorado */}
            {paymentMethod === 'tarjeta' && (
              <div className="other-payment-box">
                <div style={{ marginBottom: '0.85rem' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '0.4rem' }}>
                    Tipo de Tarjeta del Cliente:
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {(['visa', 'mastercard', 'amex', 'debito'] as const).map((brand) => (
                      <button
                        key={brand}
                        type="button"
                        onClick={() => setSelectedCardBrand(brand)}
                        style={{
                          padding: '0.4rem 0.85rem',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          border: '1px solid',
                          borderColor: selectedCardBrand === brand ? '#111827' : '#D1D5DB',
                          background: selectedCardBrand === brand ? '#111827' : '#FFFFFF',
                          color: selectedCardBrand === brand ? '#FFFFFF' : '#374151',
                          cursor: 'pointer',
                          textTransform: 'uppercase',
                        }}
                      >
                        {brand === 'debito' ? 'Débito Bancario' : brand}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151', margin: 0 }}>
                      Número de Autorización / Lote de la Terminal POS *
                    </label>
                    <button
                      type="button"
                      onClick={handleSimulateCardAuth}
                      style={{
                        background: '#EEF2FF',
                        border: '1px solid #C7D2FE',
                        color: '#4F46E5',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      <Sparkles size={12} />
                      <span>Simular Aprobación POS</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Ej: AUT-928194 o lote de terminal"
                    value={transaccionRef}
                    onChange={(e) => setTransaccionRef(e.target.value)}
                    className="form-input font-mono"
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '0.35rem' }}>
                    Últimos 4 dígitos de la tarjeta (Opcional):
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="Ej: 4242"
                    value={cardLast4}
                    onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="form-input font-mono"
                    style={{ maxWidth: '160px' }}
                  />
                </div>
              </div>
            )}

            {/* Panel de QR con Conexión a Cuentas de Banco / Yape y Botón Generador */}
            {paymentMethod === 'qr' && (
              <div className="other-payment-box qr-center-box" style={{ textAlign: 'center' }}>
                {/* Selector entre QR Conectado a Banco y QR subido de caja */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', width: '100%' }}>
                  <button
                    type="button"
                    onClick={() => setQrDisplayMode('dinamico')}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      border: '1px solid',
                      borderColor: qrDisplayMode === 'dinamico' ? '#111827' : '#E5E7EB',
                      background: qrDisplayMode === 'dinamico' ? '#111827' : '#F9FAFB',
                      color: qrDisplayMode === 'dinamico' ? '#FFFFFF' : '#374151',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <QrCode size={15} />
                    <span>Generador QR (Banco / Yape)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQrDisplayMode('subido')}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      border: '1px solid',
                      borderColor: qrDisplayMode === 'subido' ? '#111827' : '#E5E7EB',
                      background: qrDisplayMode === 'subido' ? '#111827' : '#F9FAFB',
                      color: qrDisplayMode === 'subido' ? '#FFFFFF' : '#374151',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <ImageIcon size={15} />
                    <span>QR Fijo de Caja Guardado</span>
                  </button>
                </div>

                {qrDisplayMode === 'dinamico' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
                    {/* Selector de Cuentas: Yape, BMSC, BNB, Tigo */}
                    <div style={{ width: '100%', textAlign: 'left' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#4B5563', display: 'block', marginBottom: '0.4rem' }}>
                        Seleccionar Cuenta o Billetera Receptora:
                      </span>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem' }}>
                        {POS_QR_ACCOUNTS.map((acc) => (
                          <div
                            key={acc.id}
                            onClick={() => {
                              setSelectedAccountId(acc.id);
                              setIsQrGenerated(false);
                            }}
                            style={{
                              padding: '0.5rem 0.65rem',
                              borderRadius: '6px',
                              border: '1.5px solid',
                              borderColor: selectedAccountId === acc.id ? acc.color : '#E5E7EB',
                              background: selectedAccountId === acc.id ? `${acc.color}10` : '#FFFFFF',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '2px',
                              transition: 'all 0.15s',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <strong style={{ fontSize: '0.8rem', color: selectedAccountId === acc.id ? acc.color : '#111827' }}>
                                {acc.name}
                              </strong>
                              <span style={{ fontSize: '0.65rem', background: `${acc.color}20`, color: acc.color, padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>
                                {acc.badge}
                              </span>
                            </div>
                            <span style={{ fontSize: '0.7rem', color: '#6B7280' }}>{acc.cuenta}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Botón explícito para Generar el QR */}
                    <button
                      type="button"
                      onClick={handleGenerateQR}
                      style={{
                        width: '100%',
                        padding: '0.7rem',
                        borderRadius: '8px',
                        background: '#111827',
                        color: '#FFFFFF',
                        fontWeight: 600,
                        fontSize: '0.88rem',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'background 0.2s',
                      }}
                    >
                      <Sparkles size={16} />
                      <span>Generar Código QR ({totalPagar.toFixed(2)} Bs)</span>
                    </button>

                    {/* QR Generado en Pantalla */}
                    {isQrGenerated && generatedPosQrUrl && (
                      <div style={{ background: '#FFFFFF', padding: '0.85rem', borderRadius: '10px', border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
                        <img
                          src={generatedPosQrUrl}
                          alt="QR de Pago"
                          style={{
                            width: '190px',
                            height: '190px',
                            borderRadius: '8px',
                            border: '1px solid #E5E7EB',
                            background: '#FFFFFF',
                            padding: '6px',
                          }}
                        />
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#111827' }}>
                          Monto exacto: {totalPagar.toFixed(2)} Bs
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#6B7280' }}>
                          Cuenta vinculada: {POS_QR_ACCOUNTS.find(a => a.id === selectedAccountId)?.cuenta}
                        </span>
                        <p style={{ fontSize: '0.72rem', color: '#059669', margin: 0, fontWeight: 600 }}>
                          ✓ Listo para escanear desde app de {POS_QR_ACCOUNTS.find(a => a.id === selectedAccountId)?.name}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    {savedPosQrImage ? (
                      <>
                        <img
                          src={savedPosQrImage}
                          alt="QR de Caja Guardado"
                          style={{
                            width: '190px',
                            height: '190px',
                            objectFit: 'contain',
                            borderRadius: '8px',
                            border: '1px solid #E5E7EB',
                            background: '#FFFFFF',
                            padding: '6px',
                          }}
                        />
                        <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
                          ✓ QR de sucursal guardado y activo permanentemente
                        </span>
                        <button
                          type="button"
                          onClick={handleRemoveSavedPosQr}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#DC2626',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          <Trash2 size={13} />
                          <span>Eliminar QR de caja</span>
                        </button>
                      </>
                    ) : (
                      <div style={{ padding: '1.5rem', border: '2px dashed #D1D5DB', borderRadius: '8px', width: '100%' }}>
                        <ImageIcon size={36} color="#9CA3AF" style={{ margin: '0 auto 0.4rem' }} />
                        <p style={{ fontSize: '0.8rem', color: '#6B7280', margin: 0 }}>
                          No hay imagen QR de caja subida aún
                        </p>
                      </div>
                    )}

                    {/* Botón persistente para subir el QR de la tienda */}
                    <div style={{ marginTop: '0.5rem' }}>
                      <label
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.45rem 0.9rem',
                          background: '#F3F4F6',
                          border: '1px solid #D1D5DB',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          color: '#374151',
                          cursor: 'pointer',
                        }}
                      >
                        <Upload size={14} />
                        <span>{savedPosQrImage ? 'Cambiar Imagen QR' : 'Subir Imagen QR (Se mantendrá ahí)'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleUploadPosQrImage}
                          style={{ display: 'none' }}
                        />
                      </label>
                    </div>
                  </div>
                )}
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
