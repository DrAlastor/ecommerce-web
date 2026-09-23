/**
 * @caso-de-uso CU21 — Realizar compra digital
 * @subsistema Ventas, Pagos y Compras
 * @capa Boundary — Frontend web
 * @responsabilidad Representa la pantalla principal de Frontend web; compone la interfaz e inicia las acciones del caso de uso.
 * @secuencia Cliente -> checkout -> controlador de compra -> servicios de compra y pago -> Venta/DetalleVenta/Pago/Inventario.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShop } from '../../../../../context/ShopContext';
import { useAuth } from '../../../../users-security/shared/components/AuthContext';
import { checkoutService } from '../../../services/checkout.service';
import type { OrderReceipt, OrderItemReceipt } from '../../../types/checkout.types';
import { Navbar } from '../../../../../components/layout/Navbar';
import {
  ShieldCheck,
  CreditCard,
  QrCode,
  Building2,
  Truck,
  MapPin,
  CheckCircle2,
  AlertCircle,
  FileText,
  Printer,
  ChevronRight,
  Lock,
  ArrowLeft,
  Store,
  Sparkles,
} from 'lucide-react';
import { printReceipt } from '../../../../../shared/utils/printReceipt';
import './CheckoutPage.css';

export const CheckoutPage: React.FC = () => {
  const { cart, cartTotal, cartItemCount, clearCart, refreshCart } = useShop();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Estados de formulario
  const [deliveryType, setDeliveryType] = useState<'domicilio' | 'retiro_sucursal'>('domicilio');
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'qr' | 'transferencia'>('stripe');

  // Dirección
  const defaultClientName = user?.cliente
    ? `${user.cliente.nombre || ''} ${user.cliente.apellido || ''}`.trim()
    : user?.email.split('@')[0] || '';

  const [destinatario, setDestinatario] = useState(defaultClientName);
  const [telefono, setTelefono] = useState(user?.empleado?.telefono || '');
  const [calle, setCalle] = useState('');
  const [detalle, setDetalle] = useState('');
  const [selectedCityId, setSelectedCityId] = useState<number>(1);
  const [cities, setCities] = useState<any[]>([]);

  // Sucursal de retiro
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);

  // Facturación
  const [nitFactura, setNitFactura] = useState(user?.empleado?.ci || '0');
  const [razonSocial, setRazonSocial] = useState(defaultClientName || 'Sin Nombre');

  // Datos Tarjeta / Stripe
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardHolder, setCardHolder] = useState(defaultClientName);


  // QR
  const [qrConfirmed, setQrConfirmed] = useState(false);
  const [qrSecondsLeft, setQrSecondsLeft] = useState(300);

  // Transferencia
  const [bankReceipt, setBankReceipt] = useState('');

  // Proceso y Recibo
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<OrderReceipt | null>(null);

  // Carga inicial de sucursales y ciudades
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [cList, bList] = await Promise.all([
          checkoutService.getCities(),
          checkoutService.getBranches(),
        ]);
        setCities(cList);
        if (cList.length > 0) setSelectedCityId(cList[0].id_ciudad);

        const bData = Array.isArray(bList) ? bList : bList?.data || [];
        setBranches(bData);
        if (bData.length > 0) setSelectedBranchId(bData[0].id_sucursal);
      } catch (err) {
        console.error('Error loading checkout metadata:', err);
      }
    };
    loadMetadata();
  }, []);

  // Temporizador para QR
  useEffect(() => {
    if (paymentMethod !== 'qr' || qrSecondsLeft <= 0 || qrConfirmed) return;
    const timer = setInterval(() => {
      setQrSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [paymentMethod, qrSecondsLeft, qrConfirmed]);

  // Cálculos de costos
  const freeShippingThreshold = 350.0;
  const shippingCost =
    deliveryType === 'retiro_sucursal' || cartTotal >= freeShippingThreshold || cartTotal === 0
      ? 0
      : 25.0;
  const totalConEnvio = cartTotal + shippingCost;

  // Formateadores automáticos de tarjeta estándar
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  const handleCardExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (cardExpiry.endsWith('/') && value.length === 2) {
      setCardExpiry(value.slice(0, 1));
      return;
    }
    const clean = value.replace(/\D/g, '').slice(0, 4);
    if (clean.length >= 3) {
      setCardExpiry(`${clean.slice(0, 2)}/${clean.slice(2)}`);
    } else if (clean.length === 2 && value.length > cardExpiry.length) {
      setCardExpiry(`${clean}/`);
    } else {
      setCardExpiry(clean);
    }
  };

  const handleCardCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clean = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCardCvc(clean);
  };

  const getCardBrand = (num: string) => {
    const clean = num.replace(/\D/g, '');
    if (clean.startsWith('4')) return 'visa';
    if (/^(5[1-5]|2[2-7])/.test(clean)) return 'mastercard';
    if (/^3[47]/.test(clean)) return 'amex';
    return null;
  };

  // Llenar datos de prueba para Stripe
  const handleFillTestCard = () => {
    setCardNumber('4242 4242 4242 4242');
    setCardExpiry('12/28');
    setCardCvc('123');
    setCardHolder(defaultClientName || 'Ana Rojas');
  };

  // Enviar y procesar la compra
  const handleConfirmPurchase = async () => {
    setErrorMessage(null);

    if (cart.length === 0) {
      setErrorMessage('Tu bolsa de compras está vacía.');
      return;
    }

    if (deliveryType === 'domicilio') {
      if (!destinatario.trim() || !calle.trim() || !telefono.trim()) {
        setErrorMessage(
          'Por favor completa los datos de entrega (destinatario, teléfono y dirección).',
        );
        return;
      }
    }

    if (deliveryType === 'retiro_sucursal' && !selectedBranchId) {
      setErrorMessage('Por favor selecciona la sucursal donde retirarás tu pedido.');
      return;
    }

    if (paymentMethod === 'transferencia' && !bankReceipt.trim()) {
      setErrorMessage('Por favor ingresa el número de comprobante o referencia bancaria.');
      return;
    }

    try {
      setIsProcessing(true);

      let transaccionExterna = '';
      if (paymentMethod === 'stripe') {
        // Inicializar PaymentIntent de Stripe
        const pi = await checkoutService.createPaymentIntent();
        transaccionExterna = pi.paymentIntentId;
      } else if (paymentMethod === 'qr') {
        transaccionExterna = `QR-FASHION-${Date.now()}`;
      } else {
        transaccionExterna = `DEP-${bankReceipt.trim()}`;
      }

      const payload = {
        metodo_pago: paymentMethod,
        tipo_entrega: deliveryType,
        id_sucursal_retiro:
          deliveryType === 'retiro_sucursal' ? Number(selectedBranchId) : undefined,
        nueva_direccion:
          deliveryType === 'domicilio'
            ? {
                destinatario: destinatario.trim(),
                telefono: telefono.trim(),
                calle: calle.trim(),
                detalle: detalle.trim() || undefined,
                id_ciudad: Number(selectedCityId),
              }
            : undefined,
        transaccion_externa: transaccionExterna,
        nit_factura: nitFactura.trim() || '0',
        razon_social_factura: razonSocial.trim() || 'Cliente Final',
      };

      const resultReceipt = await checkoutService.processPurchase(payload);
      setReceipt(resultReceipt);

      // Vaciar el carrito en el estado global
      await clearCart();
      await refreshCart();
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        'Ocurrió un error inesperado al procesar la compra. Por favor intenta nuevamente.';
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="checkout-page-wrapper">
      <Navbar />

      <main className="checkout-page-main">
        <div className="checkout-container">
          {/* Si ya se emitió el comprobante, mostramos la Factura Digital */}
          {receipt ? (
            <div className="receipt-view-card">
              <div className="receipt-status-header">
                <div className="success-badge-icon">
                  <CheckCircle2 size={42} />
                </div>
                <h2>¡Compra Confirmada y Facturada con Éxito!</h2>
                <p>
                  Tu pedido ha sido procesado de forma segura y el comprobante fiscal ha sido emitido.
                </p>
                <div className="invoice-code-tag">Factura N°: {receipt.codigo_factura}</div>
              </div>

              <div className="invoice-details-box" id="printable-invoice">
                <div className="invoice-brand-row">
                  <div>
                    <h3 className="invoice-store-name">FashionStore Bolivia</h3>
                    <p className="invoice-store-subtitle">Alta Moda & Vanguardia Urbana</p>
                    <p className="invoice-store-meta">NIT: 1029384756 • Casa Matriz: Santa Cruz</p>
                  </div>
                  <div className="invoice-meta-col">
                    <span className="meta-label">Comprobante Oficial</span>
                    <span className="meta-value">{receipt.codigo_factura}</span>
                    <span className="meta-date">
                      {new Date(receipt.fecha_venta).toLocaleString('es-BO')}
                    </span>
                  </div>
                </div>

                <div className="invoice-parties-grid">
                  <div className="party-block">
                    <h4>Datos del Comprador</h4>
                    <p>
                      <strong>Cliente:</strong> {receipt.cliente.nombre_completo}
                    </p>
                    <p>
                      <strong>CI / NIT:</strong> {receipt.cliente.ci}
                    </p>
                    <p>
                      <strong>Modalidad:</strong>{' '}
                      {receipt.tipo_venta === 'digital' ? 'Tienda Online Oficial' : 'Presencial'}
                    </p>
                  </div>

                  <div className="party-block">
                    <h4>Información de Entrega y Pago</h4>
                    {receipt.envio ? (
                      <>
                        <p>
                          <strong>Tipo:</strong> Envío a Domicilio ({receipt.envio.transportista})
                        </p>
                        <p>
                          <strong>Destino:</strong> {receipt.envio.direccion.calle},{' '}
                          {receipt.envio.direccion.ciudad}
                        </p>
                        <p>
                          <strong>N° Guía:</strong> {receipt.envio.numero_guia}
                        </p>
                      </>
                    ) : (
                      <p>
                        <strong>Tipo:</strong> Retiro en Sucursal Física
                      </p>
                    )}
                    <p>
                      <strong>Pago:</strong>{' '}
                      {receipt.pago ? receipt.pago.metodo_pago.toUpperCase() : 'N/A'} (Estado:{' '}
                      {receipt.pago?.estado})
                    </p>
                  </div>
                </div>

                {/* Tabla de Artículos Comprados */}
                <div className="invoice-items-table">
                  <div className="invoice-table-header">
                    <span>Prenda</span>
                    <span>SKU / Talla / Color</span>
                    <span className="text-center">Cant.</span>
                    <span className="text-right">P. Unit.</span>
                    <span className="text-right">Subtotal</span>
                  </div>
                  <div className="invoice-table-body">
                    {receipt.articulos.map((art: OrderItemReceipt) => (
                      <div key={art.id_detalle_venta} className="invoice-table-row">
                        <div className="invoice-art-name">
                          {art.imagen && (
                            <img src={art.imagen} alt={art.nombre_producto} className="art-thumb" />
                          )}
                          <span>{art.nombre_producto}</span>
                        </div>
                        <div className="invoice-art-variant">
                          <span>{art.sku}</span>
                          <span className="sub-variant">
                            Talla: {art.talla} | Color: {art.color}
                          </span>
                        </div>
                        <div className="text-center font-bold">{art.cantidad}</div>
                        <div className="text-right">{art.precio_unitario.toFixed(2)} Bs</div>
                        <div className="text-right font-bold">{art.subtotal.toFixed(2)} Bs</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totales de Factura */}
                <div className="invoice-totals-section">
                  <div className="totals-row">
                    <span>Subtotal:</span>
                    <span>{receipt.subtotal.toFixed(2)} Bs</span>
                  </div>
                  {receipt.descuento > 0 && (
                    <div className="totals-row discount-row">
                      <span>Descuento Promocional:</span>
                      <span>-{receipt.descuento.toFixed(2)} Bs</span>
                    </div>
                  )}
                  <div className="totals-row grand-total">
                    <span>Total Pagado:</span>
                    <span>{receipt.total.toFixed(2)} Bs</span>
                  </div>
                </div>

                <div className="invoice-legal-footnote">
                  <p>
                    "ESTE DOCUMENTO ES LA EMISIÓN VÁLIDA DE LA TRANSACCIÓN COMERCIAL REALIZADA DE FORMA
                    SEGURA EN FASHIONSTORE. EL INVENTARIO ASOCIADO HA SIDO DESCONTADO CORRECTAMENTE".
                  </p>
                </div>
              </div>

              {/* Botones de acción del recibo */}
              <div className="receipt-action-buttons">
                <button
                  type="button"
                  className="btn-print-invoice"
                  onClick={() => {
                    printReceipt({
                      codigo_factura: receipt.codigo_factura,
                      fecha_venta: receipt.fecha_venta,
                      cliente: {
                        nombre_completo: receipt.cliente.nombre_completo,
                        ci: receipt.cliente.ci,
                      },
                      tipo_venta: 'digital',
                      subtotal: receipt.subtotal,
                      descuento: receipt.descuento,
                      total: receipt.total,
                      pago: receipt.pago,
                      items: receipt.articulos.map((art) => ({
                        nombre_producto: art.nombre_producto,
                        sku: art.sku,
                        color: art.color,
                        talla: art.talla,
                        cantidad: art.cantidad,
                        precio_unitario: art.precio_unitario,
                        subtotal: art.subtotal,
                      })),
                    });
                  }}
                >
                  <Printer size={18} />
                  <span>Imprimir Comprobante Fiscal</span>
                </button>
                <button
                  type="button"
                  className="btn-return-store"
                  onClick={() => navigate('/catalog')}
                >
                  <span>Volver a Explorar la Tienda</span>
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          ) : (
            /* Flujo normal de Checkout */
            <div className="checkout-content-grid">
              {/* Columna Izquierda: Formulario de Checkout */}
              <div className="checkout-form-column">
                <div className="checkout-header-bar">
                  <button
                    type="button"
                    className="btn-back-to-cart"
                    onClick={() => navigate('/cart')}
                  >
                    <ArrowLeft size={16} />
                    <span>Volver a la bolsa</span>
                  </button>
                  <h1 className="checkout-main-title">Finalizar Compra Segura</h1>
                  <p className="checkout-subtitle">
                    Completa tus datos de despacho, facturación y método de pago para recibir tus prendas.
                  </p>
                </div>

                {errorMessage && (
                  <div className="checkout-error-banner">
                    <AlertCircle size={20} />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Sección 1: Modalidad de Entrega */}
                <div className="checkout-card-box">
                  <h2 className="card-box-title">
                    <MapPin size={20} />
                    <span>1. Modalidad y Destino de Entrega</span>
                  </h2>

                  <div className="delivery-type-selector">
                    <label
                      className={`delivery-option-card ${
                        deliveryType === 'domicilio' ? 'selected' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="deliveryType"
                        value="domicilio"
                        checked={deliveryType === 'domicilio'}
                        onChange={() => setDeliveryType('domicilio')}
                      />
                      <Truck size={24} />
                      <div>
                        <strong>Envío a Domicilio</strong>
                        <span>Entrega directa en tu puerta</span>
                      </div>
                    </label>

                    <label
                      className={`delivery-option-card ${
                        deliveryType === 'retiro_sucursal' ? 'selected' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="deliveryType"
                        value="retiro_sucursal"
                        checked={deliveryType === 'retiro_sucursal'}
                        onChange={() => setDeliveryType('retiro_sucursal')}
                      />
                      <Store size={24} />
                      <div>
                        <strong>Retiro en Sucursal</strong>
                        <span>Sin costo de envío en tienda física</span>
                      </div>
                    </label>
                  </div>

                  {deliveryType === 'domicilio' ? (
                    <div className="form-fields-grid">
                      <div className="form-group col-span-2">
                        <label>Nombre del Destinatario *</label>
                        <input
                          type="text"
                          placeholder="Ej: Ana Rojas"
                          value={destinatario}
                          onChange={(e) => setDestinatario(e.target.value)}
                          className="form-input"
                        />
                      </div>

                      <div className="form-group">
                        <label>Ciudad *</label>
                        <select
                          value={selectedCityId}
                          onChange={(e) => setSelectedCityId(Number(e.target.value))}
                          className="form-select"
                        >
                          {cities.map((c) => (
                            <option key={c.id_ciudad} value={c.id_ciudad}>
                              {c.nombre}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Teléfono de Contacto *</label>
                        <input
                          type="tel"
                          placeholder="Ej: 71234567"
                          value={telefono}
                          onChange={(e) => setTelefono(e.target.value)}
                          className="form-input"
                        />
                      </div>

                      <div className="form-group col-span-2">
                        <label>Dirección / Calle / N° de Casa *</label>
                        <input
                          type="text"
                          placeholder="Ej: Av. San Martín #1234, Barrio Equipetrol"
                          value={calle}
                          onChange={(e) => setCalle(e.target.value)}
                          className="form-input"
                        />
                      </div>

                      <div className="form-group col-span-2">
                        <label>Punto de Referencia / Notas (Opcional)</label>
                        <input
                          type="text"
                          placeholder="Ej: Edificio Los Tajibos, Piso 3, Depto 302"
                          value={detalle}
                          onChange={(e) => setDetalle(e.target.value)}
                          className="form-input"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="branch-pickup-picker">
                      <label>Selecciona la Sucursal de Retiro:</label>
                      <select
                        value={selectedBranchId || ''}
                        onChange={(e) => setSelectedBranchId(Number(e.target.value))}
                        className="form-select"
                      >
                        {branches.map((b) => (
                          <option key={b.id_sucursal} value={b.id_sucursal}>
                            {b.nombre} — {b.direccion}
                          </option>
                        ))}
                      </select>
                      <p className="pickup-hint">
                        Te notificaremos en cuanto tus prendas estén preparadas en el mostrador.
                      </p>
                    </div>
                  )}
                </div>

                {/* Sección 2: Datos de Facturación */}
                <div className="checkout-card-box">
                  <h2 className="card-box-title">
                    <FileText size={20} />
                    <span>2. Datos de Facturación</span>
                  </h2>
                  <div className="form-fields-grid">
                    <div className="form-group">
                      <label>NIT o CI del Comprador</label>
                      <input
                        type="text"
                        placeholder="Ej: 8492019 o 0 para Sin NIT"
                        value={nitFactura}
                        onChange={(e) => setNitFactura(e.target.value)}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Razón Social / Nombre en Factura</label>
                      <input
                        type="text"
                        placeholder="Ej: Ana Rojas o Sin Nombre"
                        value={razonSocial}
                        onChange={(e) => setRazonSocial(e.target.value)}
                        className="form-input"
                      />
                    </div>
                  </div>
                </div>

                {/* Sección 3: Métodos de Pago */}
                <div className="checkout-card-box">
                  <h2 className="card-box-title">
                    <CreditCard size={20} />
                    <span>3. Método de Pago Seguro</span>
                  </h2>

                  {/* Tabs de Selección de Método */}
                  <div className="payment-method-tabs">
                    <button
                      type="button"
                      className={`tab-pay-btn ${paymentMethod === 'stripe' ? 'active' : ''}`}
                      onClick={() => setPaymentMethod('stripe')}
                    >
                      <CreditCard size={18} />
                      <span>Tarjeta de Crédito / Débito (Stripe)</span>
                    </button>

                    <button
                      type="button"
                      className={`tab-pay-btn ${paymentMethod === 'qr' ? 'active' : ''}`}
                      onClick={() => setPaymentMethod('qr')}
                    >
                      <QrCode size={18} />
                      <span>Pago QR Simple</span>
                    </button>

                    <button
                      type="button"
                      className={`tab-pay-btn ${paymentMethod === 'transferencia' ? 'active' : ''}`}
                      onClick={() => setPaymentMethod('transferencia')}
                    >
                      <Building2 size={18} />
                      <span>Transferencia Bancaria</span>
                    </button>
                  </div>

                  {/* Contenido Pestaña: STRIPE */}
                  {paymentMethod === 'stripe' && (
                    <div className="payment-tab-panel stripe-panel">
                      <div className="stripe-header-row">
                        <div className="stripe-secure-label">
                          <Lock size={14} />
                          <span>Pasarela Oficial Stripe • Modo Sandbox</span>
                        </div>
                        <button
                          type="button"
                          className="btn-fill-test-card"
                          onClick={handleFillTestCard}
                        >
                          <Sparkles size={13} />
                          <span>Tarjeta de Prueba</span>
                        </button>
                      </div>

                      <div className="form-fields-grid">
                        <div className="form-group col-span-2">
                          <label>Titular de la Tarjeta</label>
                          <input
                            type="text"
                            placeholder="Nombre tal como figura en la tarjeta"
                            value={cardHolder}
                            onChange={(e) => setCardHolder(e.target.value)}
                            className="form-input"
                          />
                        </div>

                        <div className="form-group col-span-2">
                          <label>Número de Tarjeta</label>
                          <div className="card-input-wrapper">
                            <input
                              type="text"
                              inputMode="numeric"
                              autoComplete="cc-number"
                              maxLength={19}
                              placeholder="4242 4242 4242 4242"
                              value={cardNumber}
                              onChange={handleCardNumberChange}
                              className="form-input font-mono card-number-field"
                            />
                            <div className="card-brand-badge">
                              {getCardBrand(cardNumber) === 'visa' && (
                                <span className="brand-badge-pill visa">VISA</span>
                              )}
                              {getCardBrand(cardNumber) === 'mastercard' && (
                                <span className="brand-badge-pill mastercard">Mastercard</span>
                              )}
                              {getCardBrand(cardNumber) === 'amex' && (
                                <span className="brand-badge-pill amex">AMEX</span>
                              )}
                              {!getCardBrand(cardNumber) && (
                                <CreditCard size={18} className="card-brand-default" />
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="form-group">
                          <label>Vencimiento (MM/AA)</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="cc-exp"
                            maxLength={5}
                            placeholder="MM/AA"
                            value={cardExpiry}
                            onChange={handleCardExpiryChange}
                            className="form-input font-mono field-centered"
                          />
                        </div>

                        <div className="form-group">
                          <label>Código de Seguridad (CVC)</label>
                          <div className="cvc-input-wrapper">
                            <input
                              type="password"
                              inputMode="numeric"
                              autoComplete="cc-csc"
                              maxLength={4}
                              placeholder="123"
                              value={cardCvc}
                              onChange={handleCardCvcChange}
                              className="form-input font-mono field-centered"
                            />
                            <Lock size={15} className="cvc-lock-icon" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Contenido Pestaña: PAGO QR */}
                  {paymentMethod === 'qr' && (
                    <div className="payment-tab-panel qr-panel">
                      <div className="qr-display-card">
                        <div className="qr-image-wrapper">
                          <div className="qr-simulated-code">
                            <QrCode size={160} />
                          </div>
                          <p className="qr-amount-chip">
                            Monto a transferir: <strong>{totalConEnvio.toFixed(2)} Bs</strong>
                          </p>
                        </div>

                        <div className="qr-instructions">
                          <h4>Escanea con tu aplicación bancaria (QR Simple)</h4>
                          <ol>
                            <li>Abre tu app bancaria (BCP, BMSC, BNB, Ganadero, etc.).</li>
                            <li>Selecciona la opción <strong>Pago con QR</strong>.</li>
                            <li>Apunta la cámara a este código y confirma la transferencia.</li>
                          </ol>

                          <div className="qr-countdown-box">
                            <span>Vigencia del QR:</span>
                            <strong>{formatTimer(qrSecondsLeft)}</strong>
                          </div>

                          <button
                            type="button"
                            className={`btn-simulate-qr ${qrConfirmed ? 'confirmed' : ''}`}
                            onClick={() => setQrConfirmed(true)}
                          >
                            {qrConfirmed ? '✓ Pago QR Confirmado en App' : 'Simular Escaneo y Pago Móvil'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Contenido Pestaña: TRANSFERENCIA */}
                  {paymentMethod === 'transferencia' && (
                    <div className="payment-tab-panel bank-panel">
                      <div className="bank-accounts-info">
                        <h4>Cuentas Bancarias Oficiales</h4>
                        <div className="account-item">
                          <strong>Banco Mercantil Santa Cruz (BMSC)</strong>
                          <span>Cta Cte en Bs: 4010-892341-01</span>
                          <span>Titular: FashionStore SRL • NIT: 1029384756</span>
                        </div>
                        <div className="account-item">
                          <strong>Banco Bisa</strong>
                          <span>Cta de Ahorros en Bs: 200-1193842</span>
                          <span>Titular: FashionStore SRL</span>
                        </div>
                      </div>

                      <div className="form-group" style={{ marginTop: '1.25rem' }}>
                        <label>N° de Comprobante / Referencia de Depósito *</label>
                        <input
                          type="text"
                          placeholder="Ej: DEP-948201 o N° de autorización"
                          value={bankReceipt}
                          onChange={(e) => setBankReceipt(e.target.value)}
                          className="form-input"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Columna Derecha: Resumen de Artículos y Botón Final */}
              <div className="checkout-summary-column">
                <div className="checkout-summary-sticky">
                  <h3 className="summary-title">Resumen de tu Pedido</h3>

                  {/* Mini lista de prendas */}
                  <div className="mini-cart-items-list">
                    {cart.map((item) => (
                      <div
                        key={
                          item.variantId
                            ? `mini-${item.variantId}`
                            : `${item.product.id}-${item.selectedSize}`
                        }
                        className="mini-cart-item-row"
                      >
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="mini-cart-thumb"
                        />
                        <div className="mini-cart-info">
                          <h4 className="mini-cart-name">{item.product.name}</h4>
                          <span className="mini-cart-meta">
                            {item.selectedSize ? `Talla ${item.selectedSize}` : ''}
                            {item.selectedColor ? ` • ${item.selectedColor}` : ''}
                          </span>
                          <span className="mini-cart-qty">
                            {item.quantity} × {item.product.price.toFixed(2)} Bs
                          </span>
                        </div>
                        <div className="mini-cart-price">
                          {(item.product.price * item.quantity).toFixed(2)} Bs
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="summary-cost-breakdown">
                    <div className="cost-row">
                      <span>Subtotal ({cartItemCount} artículos):</span>
                      <span>{cartTotal.toFixed(2)} Bs</span>
                    </div>

                    <div className="cost-row">
                      <span>Costo de Despacho:</span>
                      <span>{shippingCost === 0 ? 'Gratis' : `${shippingCost.toFixed(2)} Bs`}</span>
                    </div>

                    <div className="cost-divider" />

                    <div className="cost-row grand-total">
                      <span>Total Final:</span>
                      <span className="total-amount">{totalConEnvio.toFixed(2)} Bs</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-finish-checkout"
                    onClick={handleConfirmPurchase}
                    disabled={isProcessing || cart.length === 0}
                  >
                    {isProcessing ? (
                      <span>Procesando pago y facturación...</span>
                    ) : (
                      <>
                        <ShieldCheck size={20} />
                        <span>Confirmar Compra • {totalConEnvio.toFixed(2)} Bs</span>
                      </>
                    )}
                  </button>

                  <div className="checkout-trust-notice">
                    <Lock size={15} />
                    <span>Conexión encriptada SSL. Facturación y salida de stock inmediata.</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
