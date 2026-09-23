import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../users-security/shared/components/AuthContext';
import { paymentBillingService } from '../../../services/payment-billing.service';
import { presentialSaleService } from '../../../services/presential-sale.service';
import type {
  PendingSale,
  PaymentConfirmationResult,
  PendingSaleItem,
} from '../../../types/payment-billing.types';
import type {
  POSBranch,
  POSProduct,
  POSProductVariant,
  POSCartItem,
  POSClientResult,
  POSSaleHistoryItem,
} from '../../../types/presential-sale.types';
import {
  POSPaymentModal,
  type PresentialSaleOrderInput,
} from '../components/POSPaymentModal';
import {
  Search,
  RefreshCw,
  Store,
  User,
  Clock,
  CheckCircle2,
  DollarSign,
  ArrowLeft,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Tag,
  UserCheck,
  X,
  Layers,
  FileText,
  CreditCard,
  Banknote,
  QrCode,
  Eye,
  Check,
} from 'lucide-react';
import { useConfirm } from '../../../../../shared/components/ConfirmModal';
import './POSPage.css';

export const POSPage: React.FC = () => {
  const { user, rol } = useAuth();
  const { confirm } = useConfirm();
  const navigate = useNavigate();

  // Modo de operación: 'mostrador' (CU24), 'pendientes' (CU23) o 'historial'
  const [activeTab, setActiveTab] = useState<'mostrador' | 'pendientes' | 'historial'>('mostrador');

  // Sucursales
  const [branches, setBranches] = useState<POSBranch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);

  // Catálogo de mostrador
  const [posProducts, setPosProducts] = useState<POSProduct[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState<boolean>(false);
  const [productSearch, setProductSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  // Canasta / Orden de mostrador
  const [counterCart, setCounterCart] = useState<POSCartItem[]>([]);

  // Modal selector de variante de prenda
  const [productForVariant, setProductForVariant] = useState<POSProduct | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<POSProductVariant | null>(null);
  const [variantQuantity, setVariantQuantity] = useState<number>(1);

  // Cliente de mostrador
  const [clientSearchCI, setClientSearchCI] = useState<string>('');
  const [foundClient, setFoundClient] = useState<POSClientResult | null>(null);
  const [isSearchingClient, setIsSearchingClient] = useState<boolean>(false);
  const [clientNameInput, setClientNameInput] = useState<string>('');
  const [clientCIInput, setClientCIInput] = useState<string>('');

  // Cola de ventas pendientes (CU23)
  const [pendingSales, setPendingSales] = useState<PendingSale[]>([]);
  const [isPendingLoading, setIsPendingLoading] = useState<boolean>(false);
  const [pendingSearchQuery, setPendingSearchQuery] = useState<string>('');

  // Historial de Ventas
  const [salesHistory, setSalesHistory] = useState<POSSaleHistoryItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(false);
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');
  const [historyChannelFilter, setHistoryChannelFilter] = useState<'todos' | 'tienda_fisica' | 'digital'>('todos');

  // Modal de cobro y comprobante
  const [selectedPendingSaleToPay, setSelectedPendingSaleToPay] = useState<PendingSale | null>(null);
  const [presentialOrderToPay, setPresentialOrderToPay] = useState<PresentialSaleOrderInput | null>(null);
  const [historicalReceiptToView, setHistoricalReceiptToView] = useState<PaymentConfirmationResult | null>(null);

  // 1. Cargar Sucursales del Cajero
  const loadBranches = async () => {
    try {
      const data = await presentialSaleService.getBranches();
      setBranches(data || []);
      if (data && data.length > 0 && !selectedBranchId) {
        setSelectedBranchId(data[0].id_sucursal);
      }
    } catch (err) {
      console.error('Error cargando sucursales para el POS:', err);
    }
  };

  // 2. Cargar Catálogo de Mostrador con stock de la sucursal seleccionada
  const loadPOSProducts = async () => {
    if (!selectedBranchId) return;
    try {
      setIsProductsLoading(true);
      const data = await presentialSaleService.getProducts({
        id_sucursal: selectedBranchId,
        search: productSearch,
        id_categoria: selectedCategory || undefined,
      });
      setPosProducts(data || []);
    } catch (err) {
      console.error('Error cargando productos de mostrador:', err);
    } finally {
      setIsProductsLoading(false);
    }
  };

  // 3. Cargar Ventas Pendientes de Cobro (CU23)
  const loadPendingSales = async () => {
    try {
      setIsPendingLoading(true);
      const data = await paymentBillingService.getPendingSales();
      setPendingSales(data || []);
    } catch (err) {
      console.error('Error cargando ventas pendientes:', err);
    } finally {
      setIsPendingLoading(false);
    }
  };

  // 4. Cargar Historial General de Ventas
  const loadSalesHistory = async () => {
    try {
      setIsHistoryLoading(true);
      const data = await presentialSaleService.getSalesHistory({
        id_sucursal: selectedBranchId || undefined,
        search: historySearchQuery || undefined,
        tipo_venta: historyChannelFilter !== 'todos' ? historyChannelFilter : undefined,
      });
      setSalesHistory(data || []);
    } catch (err) {
      console.error('Error cargando historial de ventas:', err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
    loadPendingSales();
    loadSalesHistory();
  }, []);

  useEffect(() => {
    if (selectedBranchId) {
      loadPOSProducts();
    }
  }, [selectedBranchId, productSearch, selectedCategory]);

  useEffect(() => {
    if (activeTab === 'historial') {
      loadSalesHistory();
    }
  }, [selectedBranchId, historySearchQuery, historyChannelFilter, activeTab]);

  // Formatear venta histórica para visualización de ticket fiscal
  const formatHistoricalReceipt = (sale: POSSaleHistoryItem): PaymentConfirmationResult => {
    const mainPago = sale.pago && sale.pago.length > 0 ? sale.pago[0] : null;
    const currentBranch = branches.find((b) => b.id_sucursal === selectedBranchId) || branches[0];
    return {
      success: true,
      mensaje: 'Comprobante Fiscal de Venta',
      id_venta: sale.id_venta,
      codigo_factura: sale.codigo_factura,
      estado_venta: sale.estado,
      fecha: sale.fecha_venta,
      sucursal: {
        id_sucursal: currentBranch?.id_sucursal || 1,
        nombre: currentBranch?.nombre || 'FashionStore Matriz',
        ciudad: currentBranch?.ciudad?.nombre || 'Santa Cruz',
      },
      cliente: {
        id_cliente: sale.cliente.id_cliente,
        nombre_completo: sale.cliente.nombre_completo,
        nit_ci: sale.cliente.ci || '0',
      },
      pago: {
        metodo_pago: (mainPago?.metodo_pago as any) || 'efectivo',
        monto_pagado: sale.total,
        monto_recibido: sale.total,
        cambio: 0,
        transaccion: mainPago?.referencia_transaccion || 'N/A',
        fecha_pago: mainPago?.fecha_pago || sale.fecha_venta,
      },
      liquidacion: {
        subtotal: sale.subtotal,
        descuento: sale.descuento,
        total: sale.total,
      },
      factura: {
        numero_factura: sale.codigo_factura,
        numero_autorizacion: `AUT-POS-${sale.id_venta}-9941`,
        codigo_control: `CF-POS-${sale.id_venta}-${String(sale.codigo_factura).slice(-4)}`,
        leyenda: 'ESTA FACTURA CONTRIBUYE AL DESARROLLO DEL PAÍS. EL USO ILÍCITO SERÁ SANCIONADO PENALMENTE DE ACUERDO A LEY.',
      },
      items: sale.items.map((it) => ({
        id_detalle_venta: it.id_detalle,
        id_producto: it.id_producto_variante,
        id_producto_variante: it.id_producto_variante,
        nombre_producto: it.nombre_producto,
        sku: it.sku,
        talla: it.talla,
        color: it.color,
        imagen: null,
        cantidad: it.cantidad,
        precio_unitario: it.precio_unitario,
        subtotal: it.subtotal,
      })),
    };
  };

  // Abrir selector de variante
  const handleOpenVariantModal = (product: POSProduct) => {
    setProductForVariant(product);
    const firstWithStock = product.variantes.find((v) => v.stock_disponible > 0) || product.variantes[0];
    setSelectedVariant(firstWithStock || null);
    setVariantQuantity(1);
  };

  // Añadir ítem a la orden de mostrador
  const handleAddVariantToCart = () => {
    if (!productForVariant || !selectedVariant) return;

    if (selectedVariant.stock_disponible <= 0) {
      alert('La variante seleccionada no cuenta con existencias en esta sucursal.');
      return;
    }

    setCounterCart((prev) => {
      const existing = prev.find((it) => it.id_producto_variante === selectedVariant.id_producto_variante);
      if (existing) {
        const newQty = Math.min(existing.cantidad + variantQuantity, selectedVariant.stock_disponible);
        return prev.map((it) =>
          it.id_producto_variante === selectedVariant.id_producto_variante
            ? {
                ...it,
                cantidad: newQty,
                subtotal: Math.round(newQty * it.precio_unitario * 100) / 100,
              }
            : it,
        );
      }

      const newItem: POSCartItem = {
        id_producto_variante: selectedVariant.id_producto_variante,
        id_producto: productForVariant.id_producto,
        nombre_producto: productForVariant.nombre,
        imagen: productForVariant.imagen,
        sku: selectedVariant.sku,
        talla: selectedVariant.talla,
        color: selectedVariant.color,
        color_hex: selectedVariant.color_hex,
        cantidad: variantQuantity,
        precio_regular: selectedVariant.precio_regular,
        precio_unitario: selectedVariant.precio_final,
        descuento_unitario: Math.max(0, selectedVariant.precio_regular - selectedVariant.precio_final),
        subtotal: Math.round(variantQuantity * selectedVariant.precio_final * 100) / 100,
        stock_max: selectedVariant.stock_disponible,
      };

      return [...prev, newItem];
    });

    setProductForVariant(null);
  };

  // Modificar cantidad en carrito
  const updateCartItemQuantity = (idVariante: number, delta: number) => {
    setCounterCart((prev) =>
      prev
        .map((it) => {
          if (it.id_producto_variante === idVariante) {
            const nextQty = it.cantidad + delta;
            if (nextQty <= 0) return null;
            const validQty = Math.min(nextQty, it.stock_max);
            return {
              ...it,
              cantidad: validQty,
              subtotal: Math.round(validQty * it.precio_unitario * 100) / 100,
            };
          }
          return it;
        })
        .filter(Boolean) as POSCartItem[],
    );
  };

  // Eliminar ítem del carrito
  const removeCartItem = (idVariante: number) => {
    setCounterCart((prev) => prev.filter((it) => it.id_producto_variante !== idVariante));
  };

  // Vaciar carrito
  const clearCounterCart = async () => {
    if (counterCart.length === 0) return;
    const ok = await confirm({
      title: 'Vaciar Orden de Mostrador',
      message: '¿Estás seguro de que deseas vaciar todos los artículos cargados en la orden actual?',
      confirmText: 'Sí, vaciar',
      cancelText: 'Cancelar',
      type: 'warning',
    });
    if (ok) {
      setCounterCart([]);
    }
  };

  // Búsqueda ágil de cliente por CI
  const handleSearchClient = async () => {
    if (!clientSearchCI.trim()) return;
    try {
      setIsSearchingClient(true);
      const results = await presentialSaleService.searchClients(clientSearchCI.trim());
      if (results && results.length > 0) {
        const c = results[0];
        setFoundClient(c);
        setClientNameInput(c.nombre_completo);
        setClientCIInput(c.ci || clientSearchCI.trim());
      } else {
        setFoundClient(null);
        setClientCIInput(clientSearchCI.trim());
      }
    } catch (err) {
      console.error('Error buscando cliente:', err);
    } finally {
      setIsSearchingClient(false);
    }
  };

  // Totales de mostrador
  const subtotalRegular = counterCart.reduce((sum, it) => sum + it.precio_regular * it.cantidad, 0);
  const totalCobrar = counterCart.reduce((sum, it) => sum + it.subtotal, 0);
  const descuentoTotal = Math.max(0, Math.round((subtotalRegular - totalCobrar) * 100) / 100);
  const totalItemsCount = counterCart.reduce((sum, it) => sum + it.cantidad, 0);

  // Iniciar cobro de orden presencial
  const handleProceedToPayCounterOrder = () => {
    if (counterCart.length === 0) {
      alert('Agrega al menos una prenda a la orden para cobrar.');
      return;
    }
    if (!selectedBranchId) {
      alert('Selecciona una sucursal para registrar la venta.');
      return;
    }

    const currentBranch = branches.find((b) => b.id_sucursal === selectedBranchId);

    const orderInput: PresentialSaleOrderInput = {
      id_sucursal: selectedBranchId,
      sucursal_nombre: currentBranch ? currentBranch.nombre : 'Sucursal',
      items: counterCart.map((it) => ({
        id_producto_variante: it.id_producto_variante,
        cantidad: it.cantidad,
        nombre_producto: it.nombre_producto,
        talla: it.talla,
        color: it.color,
        precio_unitario: it.precio_unitario,
        subtotal: it.subtotal,
      })),
      total: Math.round(totalCobrar * 100) / 100,
      subtotal: Math.round(subtotalRegular * 100) / 100,
      descuento: descuentoTotal,
      id_cliente: foundClient?.id_cliente,
      cliente_ci: clientCIInput.trim() || '0',
      cliente_nombre: clientNameInput.trim() || 'Cliente Final',
    };

    setPresentialOrderToPay(orderInput);
  };

  // Éxito al procesar pago
  const handlePaymentSuccess = () => {
    // Si fue venta presencial, vaciar mostrador y recargar catálogo
    if (presentialOrderToPay) {
      setCounterCart([]);
      setFoundClient(null);
      setClientCIInput('');
      setClientNameInput('');
      setClientSearchCI('');
      setPresentialOrderToPay(null);
      loadPOSProducts();
    }
    // Si fue pedido pendiente, recargar pendientes
    if (selectedPendingSaleToPay) {
      setSelectedPendingSaleToPay(null);
      loadPendingSales();
    }
    // Recargar historial
    loadSalesHistory();
  };

  // Categorías de los productos cargados
  const categoriesList = Array.from(
    new Set(posProducts.map((p) => JSON.stringify({ id: p.id_categoria, name: p.categoria }))),
  ).map((s) => JSON.parse(s));

  // Filtrado de ventas pendientes (CU23)
  const filteredPendingSales = pendingSales.filter((s) => {
    if (!pendingSearchQuery.trim()) return true;
    const q = pendingSearchQuery.toLowerCase().trim();
    return (
      (s.codigo_factura || '').toLowerCase().includes(q) ||
      (s.cliente?.nombre_completo || '').toLowerCase().includes(q) ||
      String(s.id_venta).includes(q)
    );
  });

  const totalPendienteCobro = pendingSales.reduce((acc, s) => acc + s.total, 0);

  // Estadísticas para el historial
  const totalVentasHistorial = salesHistory.length;
  const montoTotalHistorial = salesHistory.reduce((acc, s) => acc + s.total, 0);
  const ventasMostradorCount = salesHistory.filter((s) => s.tipo_venta === 'tienda_fisica').length;
  const ventasDigitalesCount = salesHistory.filter((s) => s.tipo_venta !== 'tienda_fisica').length;

  return (
    <div className="pos-page-layout">
      {/* Topbar del Cajero */}
      <header className="pos-topbar">
        <div className="pos-topbar-left">
          <button
            type="button"
            className="btn-back-store"
            onClick={() => navigate('/admin')}
            title="Volver al Panel Administrativo"
          >
            <ArrowLeft size={18} />
            <span>Panel Admin</span>
          </button>
          <button
            type="button"
            className="btn-back-store"
            onClick={() => navigate('/')}
            title="Volver a la tienda pública"
          >
            <span>Tienda</span>
          </button>
          <div className="pos-brand">
            <span className="pos-logo-text">DRESSLY POS</span>
            <span className="pos-subtag">Punto de Venta & Caja</span>
          </div>

          {/* Selector de Sucursal */}
          <div className="pos-branch-selector-wrap">
            <Store size={16} className="branch-icon" />
            <select
              className="pos-branch-select"
              value={selectedBranchId || ''}
              onChange={(e) => setSelectedBranchId(Number(e.target.value))}
              disabled={branches.length <= 1}
            >
              {branches.map((b) => (
                <option key={b.id_sucursal} value={b.id_sucursal}>
                  {b.nombre} {b.ciudad ? `(${b.ciudad.nombre})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Pestañas de Modo */}
        <div className="pos-mode-tabs">
          <button
            type="button"
            className={`pos-mode-btn ${activeTab === 'mostrador' ? 'active' : ''}`}
            onClick={() => setActiveTab('mostrador')}
          >
            <ShoppingBag size={16} />
            <span>Venta Mostrador</span>
          </button>
          <button
            type="button"
            className={`pos-mode-btn ${activeTab === 'pendientes' ? 'active' : ''}`}
            onClick={() => setActiveTab('pendientes')}
          >
            <Clock size={16} />
            <span>Pedidos Pendientes</span>
            {pendingSales.length > 0 && (
              <span className="pending-badge-count">{pendingSales.length}</span>
            )}
          </button>
          <button
            type="button"
            className={`pos-mode-btn ${activeTab === 'historial' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('historial');
              loadSalesHistory();
            }}
          >
            <FileText size={16} />
            <span>Historial de Ventas</span>
          </button>
        </div>

        <div className="pos-topbar-right">
          <div className="cashier-badge">
            <User size={15} />
            <span>
              Cajero:{' '}
              <strong>{user?.empleado?.nombre || user?.email.split('@')[0]}</strong> (
              {rol?.nombre || 'Personal'})
            </span>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MODO 1: VENTA DE MOSTRADOR EN TIENDA (CU24)                               */}
      {/* ========================================================================= */}
      {activeTab === 'mostrador' ? (
        <main className="pos-presential-main">
          {/* Columna Izquierda: Catálogo de Productos y Existencias */}
          <section className="pos-catalog-section">
            {/* Barra de Filtros y Búsqueda */}
            <div className="catalog-toolbar">
              <div className="catalog-search-box">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Buscar prenda por nombre o código SKU..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
                {productSearch && (
                  <button
                    type="button"
                    className="btn-clear-search"
                    onClick={() => setProductSearch('')}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Categorías */}
              <div className="catalog-categories-bar">
                <button
                  type="button"
                  className={`cat-pill ${selectedCategory === null ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(null)}
                >
                  Todas
                </button>
                {categoriesList.map((cat: any) => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`cat-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid de Prendas */}
            {isProductsLoading ? (
              <div className="pos-catalog-loading">
                <RefreshCw size={28} className="spin" />
                <p>Consultando existencias de la sucursal...</p>
              </div>
            ) : posProducts.length === 0 ? (
              <div className="pos-catalog-empty">
                <ShoppingBag size={48} />
                <h4>No se encontraron prendas en esta sucursal</h4>
                <p>Verifica el término de búsqueda o cambia la categoría seleccionada.</p>
              </div>
            ) : (
              <div className="pos-products-grid">
                {posProducts.map((p) => {
                  const hasStock = p.stock_sucursal_total > 0;
                  const firstWithPromo = p.variantes.find((v) => v.tiene_descuento);
                  const minFinalPrice = Math.min(...p.variantes.map((v) => v.precio_final));
                  const minRegularPrice = Math.min(...p.variantes.map((v) => v.precio_regular));

                  return (
                    <div
                      key={p.id_producto}
                      className={`pos-product-card ${!hasStock ? 'out-of-stock' : ''}`}
                      onClick={() => handleOpenVariantModal(p)}
                    >
                      <div className="product-card-img-wrap">
                        {p.imagen ? (
                          <img
                            src={p.imagen}
                            alt={p.nombre}
                            className="product-card-img"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <ShoppingBag size={44} className="product-img-fallback" />
                        )}
                        {firstWithPromo && (
                          <span className="promo-badge">
                            <Tag size={12} />
                            -{firstWithPromo.promocion?.descuento_porcentaje || 15}%
                          </span>
                        )}
                        <span className={`stock-badge ${hasStock ? 'in-stock' : 'no-stock'}`}>
                          {hasStock ? `${p.stock_sucursal_total} en tienda` : 'Sin existencias'}
                        </span>
                      </div>

                      <div className="product-card-info">
                        <span className="product-card-cat">{p.categoria}</span>
                        <h4 className="product-card-title">{p.nombre}</h4>
                        <div className="product-card-price-row">
                          <div className="price-digits-block">
                            {minFinalPrice < minRegularPrice && (
                              <span className="regular-strike">
                                {minRegularPrice.toFixed(2)} Bs
                              </span>
                            )}
                            <span className="final-price">{minFinalPrice.toFixed(2)} Bs</span>
                          </div>
                          <button
                            type="button"
                            className="btn-select-variant"
                            title="Seleccionar talla y color"
                            disabled={!hasStock}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenVariantModal(p);
                            }}
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Columna Derecha: Canasta / Orden de Mostrador */}
          <aside className="pos-order-sidebar">
            <div className="order-sidebar-header">
              <div className="order-title-wrap">
                <ShoppingBag size={20} />
                <h3>Venta Mostrador</h3>
                <span className="order-items-badge">{totalItemsCount} prendas</span>
              </div>
              {counterCart.length > 0 && (
                <button
                  type="button"
                  className="btn-clear-cart"
                  onClick={clearCounterCart}
                  title="Vaciar orden"
                >
                  <Trash2 size={15} />
                  <span>Vaciar</span>
                </button>
              )}
            </div>

            {/* Identificación Rápida del Cliente */}
            <div className="pos-client-fast-box">
              <div className="client-box-header">
                <span className="client-box-label">Cliente en Mostrador:</span>
                {!foundClient && (
                  <button
                    type="button"
                    className="btn-casual-client"
                    onClick={() => {
                      setClientNameInput('Cliente Final / S/N');
                      setClientCIInput('0');
                    }}
                  >
                    Cliente Ocasional (Sin NIT)
                  </button>
                )}
              </div>

              {foundClient ? (
                <div className="found-client-banner">
                  <UserCheck size={18} />
                  <div className="found-client-text">
                    <strong>{foundClient.nombre_completo}</strong>
                    <span>
                      CI: {foundClient.ci || 'Sin CI'} • {foundClient.puntos_fidelidad} pts fidelidad
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn-clear-client"
                    onClick={() => {
                      setFoundClient(null);
                      setClientSearchCI('');
                      setClientNameInput('');
                      setClientCIInput('');
                    }}
                  >
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="client-search-row">
                    <input
                      type="text"
                      placeholder="Buscar por CI o NIT..."
                      value={clientSearchCI}
                      onChange={(e) => setClientSearchCI(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSearchClient();
                      }}
                    />
                    <button
                      type="button"
                      className="btn-search-client"
                      onClick={handleSearchClient}
                      disabled={isSearchingClient}
                    >
                      {isSearchingClient ? 'Buscando...' : 'Buscar'}
                    </button>
                  </div>

                  <div className="client-name-field">
                    <input
                      type="text"
                      placeholder="Nombre o Razón Social para Factura..."
                      value={clientNameInput}
                      onChange={(e) => setClientNameInput(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Lista de Prendas Agregadas */}
            <div className="order-items-scroll">
              {counterCart.length === 0 ? (
                <div className="empty-order-state">
                  <Layers size={36} />
                  <p>Orden vacía</p>
                  <span>Haz clic en una prenda del catálogo para agregarla a la venta.</span>
                </div>
              ) : (
                counterCart.map((item) => (
                  <div key={item.id_producto_variante} className="order-item-row">
                    <div className="item-details-left">
                      <span className="item-name">{item.nombre_producto}</span>
                      <div className="item-tags">
                        <span className="item-spec-tag">Talla: {item.talla}</span>
                        <span className="item-spec-tag">{item.color}</span>
                        {item.descuento_unitario > 0 && (
                          <span className="item-discount-tag">Promo</span>
                        )}
                      </div>
                      <div className="item-price-each">
                        {item.descuento_unitario > 0 && (
                          <span className="item-strike">{item.precio_regular.toFixed(2)}</span>
                        )}
                        <span className="item-unit">{item.precio_unitario.toFixed(2)} Bs c/u</span>
                      </div>
                    </div>

                    <div className="item-controls-right">
                      <div className="qty-counter-pills">
                        <button
                          type="button"
                          onClick={() => updateCartItemQuantity(item.id_producto_variante, -1)}
                        >
                          <Minus size={14} />
                        </button>
                        <span className="qty-number">{item.cantidad}</span>
                        <button
                          type="button"
                          onClick={() => updateCartItemQuantity(item.id_producto_variante, 1)}
                          disabled={item.cantidad >= item.stock_max}
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <span className="item-subtotal-val">{item.subtotal.toFixed(2)} Bs</span>

                      <button
                        type="button"
                        className="btn-trash-item"
                        onClick={() => removeCartItem(item.id_producto_variante)}
                        title="Quitar"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Resumen de Liquidación y Cobro */}
            <div className="order-sidebar-footer">
              <div className="totals-breakdown">
                <div className="totals-row">
                  <span>Subtotal Regular:</span>
                  <span>{subtotalRegular.toFixed(2)} Bs</span>
                </div>
                {descuentoTotal > 0 && (
                  <div className="totals-row discount-row">
                    <span>Descuentos / Promociones:</span>
                    <span>-{descuentoTotal.toFixed(2)} Bs</span>
                  </div>
                )}
                <div className="totals-row total-highlight">
                  <span>Total Liquidación:</span>
                  <span className="grand-total">{totalCobrar.toFixed(2)} Bs</span>
                </div>
              </div>

              <button
                type="button"
                className="btn-checkout-pos"
                onClick={handleProceedToPayCounterOrder}
                disabled={counterCart.length === 0}
              >
                <DollarSign size={20} />
                <span>Cobrar y Facturar ({totalCobrar.toFixed(2)} Bs)</span>
              </button>
            </div>
          </aside>
        </main>
      ) : activeTab === 'pendientes' ? (
        /* ========================================================================= */
        /* MODO 2: PEDIDOS PENDIENTES DE COBRO (CU23)                                */
        /* ========================================================================= */
        <main className="pos-main-content">
          {/* Métricas de Cobro */}
          <div className="pos-kpi-bar">
            <div className="kpi-card">
              <span className="kpi-label">Ventas Pendientes</span>
              <strong className="kpi-val">{pendingSales.length}</strong>
              <span className="kpi-sub">Listas para liquidación en mostrador</span>
            </div>
            <div className="kpi-card highlight">
              <span className="kpi-label">Monto por Recaudar</span>
              <strong className="kpi-val">{totalPendienteCobro.toFixed(2)} Bs</strong>
              <span className="kpi-sub">Total en cola de cobranza</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Sucursal Activa</span>
              <strong className="kpi-val" style={{ fontSize: '1.25rem' }}>
                {branches.find((b) => b.id_sucursal === selectedBranchId)?.nombre || 'Tienda Matriz'}
              </strong>
              <span className="kpi-sub">Punto de Cobranza y Emisión Fiscal</span>
            </div>
          </div>

          {/* Barra de Búsqueda y Recarga */}
          <div className="pos-search-strip">
            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Buscar venta por código de factura, nombre de cliente o ID..."
                value={pendingSearchQuery}
                onChange={(e) => setPendingSearchQuery(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="btn-refresh"
              onClick={loadPendingSales}
              disabled={isPendingLoading}
            >
              <RefreshCw size={16} className={isPendingLoading ? 'spin' : ''} />
              <span>Actualizar Cola</span>
            </button>
          </div>

          {/* Listado de Ventas Pendientes */}
          {isPendingLoading ? (
            <div className="pos-loading-state">
              <RefreshCw size={36} className="spin" />
              <p>Consultando ventas pendientes de pago...</p>
            </div>
          ) : filteredPendingSales.length === 0 ? (
            <div className="pos-empty-state">
              <CheckCircle2 size={48} color="#059669" />
              <h3>¡No hay ventas pendientes de cobro!</h3>
              <p>
                {pendingSearchQuery
                  ? 'No se encontraron resultados para la búsqueda ingresada.'
                  : 'Todas las operaciones comerciales están liquidadas y al día.'}
              </p>
            </div>
          ) : (
            <div className="pos-sales-grid">
              {filteredPendingSales.map((sale) => (
                <div key={sale.id_venta} className="pos-sale-card">
                  <div className="sale-card-header">
                    <span className="sale-order-code">
                      {sale.codigo_factura || `Orden #${sale.id_venta}`}
                    </span>
                    <span className="sale-state-badge pending">Pendiente de Pago</span>
                  </div>

                  <div className="sale-client-box">
                    <div className="client-avatar">
                      <User size={18} />
                    </div>
                    <div className="client-data">
                      <strong className="client-name">
                        {sale.cliente?.nombre_completo || 'Cliente Mostrador'}
                      </strong>
                      <span className="client-ci">CI: {sale.cliente?.ci || '0'}</span>
                    </div>
                  </div>

                  <div className="sale-items-preview-box">
                    <span className="items-qty-label">
                      {sale.total_articulos} prendas en la orden:
                    </span>
                    <ul className="items-simple-list">
                      {sale.items.slice(0, 3).map((it: PendingSaleItem) => (
                        <li key={it.id_detalle_venta}>
                          • {it.cantidad}x {it.nombre} ({it.talla || 'U'})
                        </li>
                      ))}
                      {sale.items.length > 3 && (
                        <li className="more-items">+ {sale.items.length - 3} prendas más...</li>
                      )}
                    </ul>
                  </div>

                  <div className="sale-card-bottom">
                    <div className="amount-block">
                      <span className="amount-label">Importe a Cobrar</span>
                      <strong className="amount-val">{sale.total.toFixed(2)} Bs</strong>
                    </div>

                    <button
                      type="button"
                      className="btn-pay-action"
                      onClick={() => setSelectedPendingSaleToPay(sale)}
                    >
                      <DollarSign size={18} />
                      <span>Cobrar Orden</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      ) : (
        /* ========================================================================= */
        /* MODO 3: HISTORIAL DE VENTAS (FÍSICAS Y DIGITALES)                          */
        /* ========================================================================= */
        <main className="pos-history-main">
          {/* Métricas de Historial */}
          <div className="history-stats-bar">
            <div className="history-stat-card">
              <div className="history-stat-icon">
                <FileText size={22} />
              </div>
              <div className="history-stat-info">
                <span className="history-stat-label">Total Ventas Registradas</span>
                <strong className="history-stat-value">{totalVentasHistorial}</strong>
              </div>
            </div>

            <div className="history-stat-card">
              <div className="history-stat-icon" style={{ background: '#ECFDF5', color: '#059669' }}>
                <DollarSign size={22} />
              </div>
              <div className="history-stat-info">
                <span className="history-stat-label">Recaudación Total</span>
                <strong className="history-stat-value">{montoTotalHistorial.toFixed(2)} Bs</strong>
              </div>
            </div>

            <div className="history-stat-card">
              <div className="history-stat-icon" style={{ background: '#F4ECE1', color: '#8C5E35' }}>
                <Store size={22} />
              </div>
              <div className="history-stat-info">
                <span className="history-stat-label">Ventas en Mostrador</span>
                <strong className="history-stat-value">{ventasMostradorCount}</strong>
              </div>
            </div>

            <div className="history-stat-card">
              <div className="history-stat-icon" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>
                <ShoppingBag size={22} />
              </div>
              <div className="history-stat-info">
                <span className="history-stat-label">Ventas Online / Digital</span>
                <strong className="history-stat-value">{ventasDigitalesCount}</strong>
              </div>
            </div>
          </div>

          {/* Barra de Filtros y Búsqueda */}
          <div className="history-toolbar">
            <div className="history-search-input-wrap">
              <Search size={18} />
              <input
                type="text"
                placeholder="Buscar por Nro de Factura, cliente o CI..."
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
              />
            </div>

            <div className="history-filters-group">
              <button
                type="button"
                className={`history-filter-pill ${historyChannelFilter === 'todos' ? 'active' : ''}`}
                onClick={() => setHistoryChannelFilter('todos')}
              >
                Todos los Canales
              </button>
              <button
                type="button"
                className={`history-filter-pill ${historyChannelFilter === 'tienda_fisica' ? 'active' : ''}`}
                onClick={() => setHistoryChannelFilter('tienda_fisica')}
              >
                Tienda Física (Mostrador)
              </button>
              <button
                type="button"
                className={`history-filter-pill ${historyChannelFilter === 'digital' ? 'active' : ''}`}
                onClick={() => setHistoryChannelFilter('digital')}
              >
                Digital / Online
              </button>

              <button
                type="button"
                className="btn-refresh"
                onClick={loadSalesHistory}
                disabled={isHistoryLoading}
                title="Actualizar Historial"
              >
                <RefreshCw size={16} className={isHistoryLoading ? 'spin' : ''} />
                <span>Actualizar</span>
              </button>
            </div>
          </div>

          {/* Tabla de Resultados */}
          {isHistoryLoading ? (
            <div className="pos-loading-state">
              <RefreshCw size={36} className="spin" />
              <p>Consultando historial de ventas...</p>
            </div>
          ) : salesHistory.length === 0 ? (
            <div className="pos-empty-state">
              <FileText size={48} color="#8C5E35" />
              <h3>No se encontraron registros de ventas</h3>
              <p>Realiza una venta en el mostrador o ajusta los filtros de búsqueda.</p>
            </div>
          ) : (
            <div className="history-table-container">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Factura / Ticket</th>
                    <th>Fecha & Hora</th>
                    <th>Canal</th>
                    <th>Cliente</th>
                    <th>Atendido Por</th>
                    <th>Método de Pago</th>
                    <th>Total Liquidado</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {salesHistory.map((sale) => {
                    const isPresential = sale.tipo_venta === 'tienda_fisica';
                    const mainPayment = sale.pago && sale.pago.length > 0 ? sale.pago[0] : null;

                    return (
                      <tr key={sale.id_venta}>
                        <td>
                          <span className="fac-code-badge">{sale.codigo_factura}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span>{new Date(sale.fecha_venta).toLocaleDateString('es-BO')}</span>
                            <span style={{ fontSize: '0.72rem', color: '#8C827A' }}>
                              {new Date(sale.fecha_venta).toLocaleTimeString('es-BO', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className={`channel-pill ${isPresential ? 'mostrador' : 'digital'}`}>
                            {isPresential ? <Store size={12} /> : <ShoppingBag size={12} />}
                            {isPresential ? 'Mostrador' : 'Online'}
                          </span>
                        </td>
                        <td>
                          <div className="client-cell">
                            <strong>{sale.cliente.nombre_completo}</strong>
                            <span>CI: {sale.cliente.ci || '0'}</span>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.82rem', color: '#4A3E34' }}>
                            {sale.empleado ? sale.empleado.nombre_completo : 'Venta en Línea'}
                          </span>
                        </td>
                        <td>
                          <span className="payment-method-tag">
                            {mainPayment?.metodo_pago === 'efectivo' ? (
                              <Banknote size={14} color="#059669" />
                            ) : mainPayment?.metodo_pago === 'tarjeta' ? (
                              <CreditCard size={14} color="#1D4ED8" />
                            ) : mainPayment?.metodo_pago === 'qr' ? (
                              <QrCode size={14} color="#8C5E35" />
                            ) : (
                              <DollarSign size={14} />
                            )}
                            {mainPayment?.metodo_pago || 'No registrado'}
                          </span>
                        </td>
                        <td>
                          <span className="sale-total-cell">{sale.total.toFixed(2)} Bs</span>
                        </td>
                        <td>
                          <span className={`sale-status-badge ${sale.estado.toLowerCase()}`}>
                            <Check size={12} />
                            {sale.estado}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn-view-receipt-action"
                            onClick={() => {
                              const receiptFormatted = formatHistoricalReceipt(sale);
                              setHistoricalReceiptToView(receiptFormatted);
                            }}
                            title="Ver Comprobante Oficial y Reimprimir Ticket"
                          >
                            <Eye size={14} />
                            <span>Ver Ticket</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </main>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SELECTOR DE VARIANTE (TALLA / COLOR)                               */}
      {/* ========================================================================= */}
      {productForVariant && (
        <div className="pos-variant-modal-backdrop" onClick={() => setProductForVariant(null)}>
          <div className="pos-variant-modal" onClick={(e) => e.stopPropagation()}>
            <div className="variant-modal-header">
              <div className="header-text">
                <h3>{productForVariant.nombre}</h3>
                <span className="cat-subtitle">{productForVariant.categoria}</span>
              </div>
              <button
                type="button"
                className="btn-close-variant-modal"
                onClick={() => setProductForVariant(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="variant-modal-body">
              <span className="selector-label">Selecciona Talla y Color disponibles:</span>
              <div className="variants-options-grid">
                {productForVariant.variantes.map((v) => {
                  const isSelected = selectedVariant?.id_producto_variante === v.id_producto_variante;
                  const hasStock = v.stock_disponible > 0;

                  return (
                    <button
                      key={v.id_producto_variante}
                      type="button"
                      className={`variant-option-chip ${isSelected ? 'selected' : ''} ${
                        !hasStock ? 'disabled' : ''
                      }`}
                      onClick={() => {
                        if (hasStock) setSelectedVariant(v);
                      }}
                      disabled={!hasStock}
                    >
                      <div className="chip-top">
                        <span
                          className="chip-color-circle"
                          style={{ backgroundColor: v.color_hex || '#CCC' }}
                        />
                        <strong className="chip-size">Talla: {v.talla}</strong>
                        <span className="chip-color-name">({v.color})</span>
                      </div>
                      <div className="chip-bottom">
                        <span className="chip-stock">
                          {hasStock ? `${v.stock_disponible} disp.` : 'Agotado'}
                        </span>
                        <span className="chip-price">{v.precio_final.toFixed(2)} Bs</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selector de Cantidad */}
              <div className="variant-quantity-picker">
                <span className="qty-picker-label">Cantidad a Facturar:</span>
                <div className="qty-picker-controls">
                  <button
                    type="button"
                    onClick={() => setVariantQuantity((q) => Math.max(1, q - 1))}
                    disabled={variantQuantity <= 1}
                  >
                    <Minus size={16} />
                  </button>
                  <span className="qty-picker-val">{variantQuantity}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setVariantQuantity((q) =>
                        Math.min(q + 1, selectedVariant?.stock_disponible || 1),
                      )
                    }
                    disabled={variantQuantity >= (selectedVariant?.stock_disponible || 1)}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                {selectedVariant && (
                  <span className="qty-subtotal-calc">
                    Subtotal: {(variantQuantity * selectedVariant.precio_final).toFixed(2)} Bs
                  </span>
                )}
              </div>
            </div>

            <div className="variant-modal-footer">
              <button
                type="button"
                className="btn-cancel-variant"
                onClick={() => setProductForVariant(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-confirm-add-cart"
                onClick={handleAddVariantToCart}
                disabled={!selectedVariant || selectedVariant.stock_disponible <= 0}
              >
                <Plus size={18} />
                <span>Añadir a la Venta</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE COBRO Y FACTURACIÓN FISCAL / REIMPRESIÓN (CU23 & CU24)           */}
      {/* ========================================================================= */}
      {(selectedPendingSaleToPay || presentialOrderToPay || historicalReceiptToView) && (
        <POSPaymentModal
          sale={selectedPendingSaleToPay}
          presentialSale={presentialOrderToPay}
          initialReceipt={historicalReceiptToView}
          onClose={() => {
            setSelectedPendingSaleToPay(null);
            setPresentialOrderToPay(null);
            setHistoricalReceiptToView(null);
          }}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default POSPage;
