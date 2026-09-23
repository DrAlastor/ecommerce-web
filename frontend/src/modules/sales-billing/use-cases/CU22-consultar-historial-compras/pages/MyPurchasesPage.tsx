import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { purchasesService } from '../../../services/purchases.service';
import type {
  PurchaseSummary,
  PurchaseDetail,
} from '../../../types/purchases.types';
import { Navbar } from '../../../../../components/layout/Navbar';
import {
  ShoppingBag,
  Search,
  Calendar,
  CreditCard,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Printer,
  X,
  ChevronRight,
  Package,
  ArrowRight,
  RefreshCw,
  Store,
  RotateCcw,
} from 'lucide-react';
import { returnsApi } from '../../CU26-gestionar-devoluciones/services/returns.api';
import { RequestReturnModal } from '../../CU26-gestionar-devoluciones/components/RequestReturnModal';
import type { ReturnRecord } from '../../CU26-gestionar-devoluciones/types/returns.types';
import { printReceipt } from '../../../../../shared/utils/printReceipt';
import './MyPurchasesPage.css';

export const MyPurchasesPage: React.FC = () => {
  const navigate = useNavigate();

  // Estados
  const [purchases, setPurchases] = useState<PurchaseSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filtros
  const [selectedStatus, setSelectedStatus] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal de Detalle
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<number | null>(null);
  const [purchaseDetail, setPurchaseDetail] = useState<PurchaseDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Devoluciones
  const [myReturns, setMyReturns] = useState<ReturnRecord[]>([]);
  const [returnTargetPurchase, setReturnTargetPurchase] = useState<{
    idVenta: number;
    codigoFactura: string;
    items: any[];
  } | null>(null);

  // Cargar compras
  const fetchPurchases = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const [res, returnsList] = await Promise.all([
        purchasesService.getPurchases(),
        returnsApi.getMyReturns().catch(() => []),
      ]);
      setPurchases(res.data || []);
      setMyReturns(returnsList || []);
    } catch (err: any) {
      console.error('Error fetching customer purchases:', err);
      setErrorMessage(
        err.response?.data?.message ||
          'No fue posible cargar tu historial de compras. Por favor intenta más tarde.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  // Abrir detalle
  const handleOpenDetail = async (idVenta: number) => {
    setSelectedPurchaseId(idVenta);
    setIsLoadingDetail(true);
    setDetailError(null);
    try {
      const detail = await purchasesService.getPurchaseById(idVenta);
      setPurchaseDetail(detail);
    } catch (err: any) {
      console.error('Error loading purchase detail:', err);
      setDetailError(
        err.response?.data?.message ||
          'No se pudo obtener el detalle de la compra solicitada.',
      );
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedPurchaseId(null);
    setPurchaseDetail(null);
    setDetailError(null);
  };

  // Filtrado en memoria
  const filteredPurchases = useMemo(() => {
    return purchases.filter((item) => {
      // Filtro de estado
      if (selectedStatus !== 'todos') {
        if (item.estado.toLowerCase() !== selectedStatus.toLowerCase()) {
          return false;
        }
      }

      // Filtro de búsqueda
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesInvoice = item.codigo_factura.toLowerCase().includes(q);
        const matchesProduct = item.items.some((it) =>
          it.nombre_producto.toLowerCase().includes(q) ||
          it.sku.toLowerCase().includes(q)
        );
        if (!matchesInvoice && !matchesProduct) {
          return false;
        }
      }

      return true;
    });
  }, [purchases, selectedStatus, searchQuery]);

  // Totales acumulados
  const totalInvertido = useMemo(() => {
    return purchases.reduce((sum, p) => sum + p.total, 0);
  }, [purchases]);

  const totalPrendas = useMemo(() => {
    return purchases.reduce((sum, p) => sum + p.total_articulos, 0);
  }, [purchases]);

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat('es-BO', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    } catch {
      return isoString;
    }
  };

  const formatShortDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat('es-BO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(d);
    } catch {
      return isoString;
    }
  };

  return (
    <div className="purchases-page-wrapper">
      <Navbar />

      <main className="purchases-main">
        <div className="purchases-container">
          {/* Header */}
          <div className="purchases-page-header">
            <div className="header-titles">
              <span className="header-kicker">Portal del Cliente</span>
              <h1 className="page-title">Mis Compras</h1>
              <p className="page-subtitle">
                Historial completo de tus pedidos adquiridos en FashionStore, estado de entrega y comprobantes fiscales oficiales.
              </p>
            </div>

            {/* Tarjetas de Estadísticas */}
            {purchases.length > 0 && (
              <div className="purchases-kpi-grid">
                <div className="kpi-card">
                  <span className="kpi-label">Pedidos Registrados</span>
                  <strong className="kpi-value">{purchases.length}</strong>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">Prendas Adquiridas</span>
                  <strong className="kpi-value">{totalPrendas} unid.</strong>
                </div>
                <div className="kpi-card highlight">
                  <span className="kpi-label">Inversión Total</span>
                  <strong className="kpi-value">{totalInvertido.toFixed(2)} Bs</strong>
                </div>
              </div>
            )}
          </div>

          {/* Barra de Filtros y Búsqueda */}
          <div className="purchases-toolbar">
            <div className="status-tabs-group">
              <button
                type="button"
                className={`status-tab-btn ${selectedStatus === 'todos' ? 'active' : ''}`}
                onClick={() => setSelectedStatus('todos')}
              >
                Todas ({purchases.length})
              </button>
              <button
                type="button"
                className={`status-tab-btn ${selectedStatus === 'pagada' ? 'active' : ''}`}
                onClick={() => setSelectedStatus('pagada')}
              >
                Pagadas
              </button>
              <button
                type="button"
                className={`status-tab-btn ${selectedStatus === 'pendiente' ? 'active' : ''}`}
                onClick={() => setSelectedStatus('pendiente')}
              >
                Pendientes
              </button>
            </div>

            <div className="search-box-wrapper">
              <Search size={17} className="search-icon" />
              <input
                type="text"
                placeholder="Buscar por código de factura o nombre de prenda..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="btn-clear-search"
                  onClick={() => setSearchQuery('')}
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <button
              type="button"
              className="btn-refresh-list"
              onClick={fetchPurchases}
              disabled={isLoading}
              title="Actualizar historial"
            >
              <RefreshCw size={16} className={isLoading ? 'spinning' : ''} />
              <span>Actualizar</span>
            </button>
          </div>

          {/* Estado de Carga */}
          {isLoading && (
            <div className="purchases-loading-state">
              <div className="spinner-dots" />
              <p>Cargando tus compras...</p>
            </div>
          )}

          {/* Mensaje de Error */}
          {!isLoading && errorMessage && (
            <div className="purchases-error-card">
              <AlertCircle size={24} />
              <div>
                <h3>No pudimos cargar tus compras</h3>
                <p>{errorMessage}</p>
                <button type="button" onClick={fetchPurchases} className="btn-retry">
                  Reintentar
                </button>
              </div>
            </div>
          )}

          {/* Estado Vacío: Sin compras registradas */}
          {!isLoading && !errorMessage && purchases.length === 0 && (
            <div className="purchases-empty-state">
              <div className="empty-state-icon">
                <ShoppingBag size={48} />
              </div>
              <h2>Aún no has realizado ninguna compra</h2>
              <p>
                Descubre las últimas tendencias de nuestra colección de temporada y adquiere tus piezas exclusivas hoy mismo.
              </p>
              <button
                type="button"
                className="btn-go-catalog"
                onClick={() => navigate('/catalog')}
              >
                <span>Explorar Catálogo Exclusivo</span>
                <ArrowRight size={18} />
              </button>
            </div>
          )}

          {/* Estado Vacío: Búsqueda sin resultados */}
          {!isLoading && !errorMessage && purchases.length > 0 && filteredPurchases.length === 0 && (
            <div className="purchases-no-results">
              <Package size={36} />
              <h3>No se encontraron pedidos con ese criterio</h3>
              <p>Intenta buscando con otro término o limpiando los filtros.</p>
              <button
                type="button"
                className="btn-reset-filters"
                onClick={() => {
                  setSelectedStatus('todos');
                  setSearchQuery('');
                }}
              >
                Limpiar Filtros
              </button>
            </div>
          )}

          {/* Lista de Compras */}
          {!isLoading && !errorMessage && filteredPurchases.length > 0 && (
            <div className="purchases-list">
              {filteredPurchases.map((purchase) => {
                const isPaid = purchase.estado.toLowerCase() === 'pagada';
                return (
                  <div key={purchase.id_venta} className="purchase-card">
                    {/* Encabezado de la Tarjeta */}
                    <div className="purchase-card-header">
                      <div className="header-meta">
                        <div className="invoice-code-badge">
                          <FileText size={15} />
                          <strong>{purchase.codigo_factura}</strong>
                        </div>
                        <span className="purchase-date">
                          <Calendar size={14} />
                          {formatDate(purchase.fecha_venta)}
                        </span>
                      </div>

                      <div className="header-status">
                        {(() => {
                          const ret = myReturns.find((r) => r.id_venta === purchase.id_venta);
                          if (ret) {
                            return (
                              <span className={`return-status-badge ${ret.estado.toLowerCase()}`}>
                                <RotateCcw size={12} />
                                <span>Devolución {ret.estado}</span>
                              </span>
                            );
                          }
                          return (
                            <span className={`status-badge ${isPaid ? 'paid' : 'pending'}`}>
                              {isPaid ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                              <span>{purchase.estado}</span>
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Contenido: Prendas */}
                    <div className="purchase-card-body">
                      <div className="items-preview-row">
                        {purchase.items.map((item) => (
                          <div key={item.id_detalle_venta} className="item-preview-thumb-box">
                            <img
                              src={item.imagen}
                              alt={item.nombre_producto}
                              className="item-preview-thumb"
                            />
                            <span className="item-qty-badge">{item.cantidad}</span>
                          </div>
                        ))}

                        <div className="items-summary-text">
                          <p className="primary-item-title">
                            {purchase.items[0]?.nombre_producto}
                            {purchase.items.length > 1 && (
                              <span className="additional-items-tag">
                                {' '}+ {purchase.items.length - 1} más
                              </span>
                            )}
                          </p>
                          <span className="items-count-text">
                            {purchase.total_articulos} {purchase.total_articulos === 1 ? 'prenda' : 'prendas'} en total
                          </span>
                        </div>
                      </div>

                      {/* Detalles rápidos de Pago y Envío */}
                      <div className="order-quick-info">
                        {purchase.pago && (
                          <div className="quick-info-pill">
                            <CreditCard size={14} />
                            <span>
                              {purchase.pago.metodo_pago === 'stripe'
                                ? 'Tarjeta (Stripe)'
                                : purchase.pago.metodo_pago === 'qr'
                                ? 'Pago QR Simple'
                                : 'Transferencia Bancaria'}
                            </span>
                          </div>
                        )}

                        {purchase.envio ? (
                          <div className="quick-info-pill">
                            <Truck size={14} />
                            <span>Envío: {purchase.envio.numero_guia}</span>
                          </div>
                        ) : (
                          <div className="quick-info-pill">
                            <Store size={14} />
                            <span>Retiro en Sucursal</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pie de Tarjeta: Total y Botón */}
                    <div className="purchase-card-footer">
                      <div className="footer-total-box">
                        <span className="total-label">Total Facturado</span>
                        <strong className="total-value">{purchase.total.toFixed(2)} Bs</strong>
                      </div>

                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          {purchase.estado.toLowerCase() === 'completada' &&
                            !myReturns.some((r) => r.id_venta === purchase.id_venta) && (
                              <button
                                type="button"
                                className="btn-card-return"
                                onClick={() =>
                                  setReturnTargetPurchase({
                                    idVenta: purchase.id_venta,
                                    codigoFactura: purchase.codigo_factura,
                                    items: purchase.items.map((it: any) => ({
                                      id_detalle_venta: it.id_detalle_venta,
                                      cantidad: it.cantidad,
                                      precio_unitario: 0,
                                      subtotal: 0,
                                      nombre_producto: it.nombre_producto,
                                      sku: it.sku,
                                      imagen_url: it.imagen,
                                    })),
                                  })
                                }
                              >
                                <RotateCcw size={14} />
                                <span>Devolver</span>
                              </button>
                            )}

                          <button
                            type="button"
                            className="btn-view-purchase-detail"
                            onClick={() => handleOpenDetail(purchase.id_venta)}
                          >
                            <span>Ver Detalle y Comprobante</span>
                            <ChevronRight size={17} />
                          </button>
                        </div>
                      </div>
                    </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Modal / Comprobante Completo */}
      {selectedPurchaseId && (
        <div className="modal-backdrop" onClick={handleCloseDetail}>
          <div className="receipt-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-titles">
                <div className="modal-invoice-tag">
                  <FileText size={16} />
                  <span>Comprobante Electrónico</span>
                </div>
                <h2>Detalle de Compra</h2>
              </div>
              <button
                type="button"
                className="btn-close-modal"
                onClick={handleCloseDetail}
                aria-label="Cerrar comprobante"
              >
                <X size={20} />
              </button>
            </div>

            {isLoadingDetail && (
              <div className="modal-loading-body">
                <div className="spinner-dots" />
                <p>Cargando comprobante fiscal...</p>
              </div>
            )}

            {!isLoadingDetail && detailError && (
              <div className="modal-error-body">
                <AlertCircle size={24} />
                <p>{detailError}</p>
                <button type="button" onClick={() => handleOpenDetail(selectedPurchaseId)}>
                  Reintentar
                </button>
              </div>
            )}

            {!isLoadingDetail && purchaseDetail && (
              <div className="modal-scroll-content">
                {/* Cabecera Fiscal Oficial */}
                <div className="receipt-official-header">
                  <div className="company-info-block">
                    <h3 className="company-brand">DRESSLY FASHION STORE</h3>
                    <p className="company-sub">Casa Matriz: Av. San Martín #450 • Santa Cruz, Bolivia</p>
                    <p className="company-nit">NIT: 1029384019 • Teléfono: (+591) 3 345-6789</p>
                  </div>
                  <div className="invoice-badge-box">
                    <span className="invoice-box-label">FACTURA COMERCIAL</span>
                    <strong className="invoice-box-num">{purchaseDetail.codigo_factura}</strong>
                    <span className="invoice-box-date">{formatDate(purchaseDetail.fecha_venta)}</span>
                  </div>
                </div>

                {/* Datos del Cliente y Operación */}
                <div className="receipt-client-info-grid">
                  <div className="info-cell">
                    <span className="cell-label">Cliente / Razón Social:</span>
                    <strong className="cell-value">{purchaseDetail.cliente.nombre_completo || 'Cliente'}</strong>
                  </div>
                  <div className="info-cell">
                    <span className="cell-label">NIT / Documento:</span>
                    <strong className="cell-value">{purchaseDetail.cliente.ci || '0'}</strong>
                  </div>
                  <div className="info-cell">
                    <span className="cell-label">Estado de la Venta:</span>
                    <span className={`cell-status-tag ${purchaseDetail.estado.toLowerCase() === 'pagada' ? 'paid' : 'pending'}`}>
                      {purchaseDetail.estado}
                    </span>
                  </div>
                  <div className="info-cell">
                    <span className="cell-label">Modalidad:</span>
                    <strong className="cell-value">
                      {purchaseDetail.tipo_venta === 'digital' ? 'Tienda Online' : 'Sucursal Física'}
                    </strong>
                  </div>
                </div>

                {/* Tabla de Artículos Comprados */}
                <div className="receipt-items-table-wrapper">
                  <table className="receipt-items-table">
                    <thead>
                      <tr>
                        <th>Prenda</th>
                        <th className="text-center">Variante</th>
                        <th className="text-center">Cant.</th>
                        <th className="text-right">Precio Unit.</th>
                        <th className="text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchaseDetail.items.map((it) => (
                        <tr key={it.id_detalle_venta}>
                          <td>
                            <div className="table-product-cell">
                              <img
                                src={it.imagen}
                                alt={it.nombre_producto}
                                className="table-product-thumb"
                              />
                              <div>
                                <span className="table-product-name">{it.nombre_producto}</span>
                                <span className="table-product-sku">SKU: {it.sku}</span>
                              </div>
                            </div>
                          </td>
                          <td className="text-center">
                            <div className="variant-tag-wrap">
                              <span className="tag-chip">Talla: {it.talla}</span>
                              <span className="tag-chip">Color: {it.color}</span>
                            </div>
                          </td>
                          <td className="text-center font-bold">{it.cantidad}</td>
                          <td className="text-right">{it.precio_unitario.toFixed(2)} Bs</td>
                          <td className="text-right font-bold">{it.subtotal.toFixed(2)} Bs</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totales y Liquidación */}
                <div className="receipt-financial-summary">
                  <div className="summary-row">
                    <span>Subtotal Artículos:</span>
                    <span>{purchaseDetail.subtotal.toFixed(2)} Bs</span>
                  </div>
                  {purchaseDetail.descuento > 0 && (
                    <div className="summary-row discount">
                      <span>Descuento Aplicado:</span>
                      <span>-{purchaseDetail.descuento.toFixed(2)} Bs</span>
                    </div>
                  )}
                  <div className="summary-row">
                    <span>Costo de Envío:</span>
                    <span>{purchaseDetail.envio ? 'Gratis (Promoción)' : '0.00 Bs'}</span>
                  </div>
                  <div className="summary-divider" />
                  <div className="summary-row total-highlight">
                    <span>Total Pagado:</span>
                    <span>{purchaseDetail.total.toFixed(2)} Bs</span>
                  </div>
                </div>

                {/* Información de Pago y Envío */}
                <div className="receipt-logistics-grid">
                  {purchaseDetail.pago && (
                    <div className="logistics-card">
                      <div className="logistics-card-title">
                        <CreditCard size={16} />
                        <span>Detalle del Pago</span>
                      </div>
                      <p>
                        <strong>Método: </strong>
                        {purchaseDetail.pago.metodo_pago === 'stripe'
                          ? 'Tarjeta de Crédito / Débito (Stripe)'
                          : purchaseDetail.pago.metodo_pago === 'qr'
                          ? 'Pago QR Simple'
                          : 'Transferencia Bancaria'}
                      </p>
                      <p className="font-mono text-xs">
                        <strong>Transacción: </strong>{purchaseDetail.pago.transaccion_externa}
                      </p>
                      <p>
                        <strong>Fecha de Pago: </strong>
                        {formatShortDate(purchaseDetail.pago.fecha_pago)}
                      </p>
                    </div>
                  )}

                  {purchaseDetail.envio ? (
                    <div className="logistics-card">
                      <div className="logistics-card-title">
                        <Truck size={16} />
                        <span>Datos de Envío y Destino</span>
                      </div>
                      <p>
                        <strong>Guía: </strong>
                        <span className="font-mono">{purchaseDetail.envio.numero_guia}</span>
                      </p>
                      <p>
                        <strong>Transportista: </strong>{purchaseDetail.envio.transportista}
                      </p>
                      {purchaseDetail.envio.direccion && (
                        <p>
                          <strong>Entrega: </strong>
                          {purchaseDetail.envio.direccion.calle}
                          {purchaseDetail.envio.direccion.detalle ? `, ${purchaseDetail.envio.direccion.detalle}` : ''} ({purchaseDetail.envio.direccion.ciudad})
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="logistics-card">
                      <div className="logistics-card-title">
                        <Store size={16} />
                        <span>Modalidad de Retiro</span>
                      </div>
                      <p>El pedido fue gestionado para retiro en sucursal física autorizada sin costo adicional.</p>
                    </div>
                  )}
                </div>

                {/* Pie de Factura Legal */}
                {purchaseDetail.factura && (
                  <div className="receipt-legal-footer">
                    <div className="legal-row">
                      <span><strong>Nº Autorización:</strong> {purchaseDetail.factura.numero_autorizacion}</span>
                      <span><strong>Código Control:</strong> {purchaseDetail.factura.codigo_control}</span>
                    </div>
                    <p className="legal-legend">{purchaseDetail.factura.leyenda}</p>
                  </div>
                )}

                {/* Botones del Modal */}
                <div className="modal-actions-footer">
                  {purchaseDetail.estado.toLowerCase() === 'completada' && (
                    <button
                      type="button"
                      className="btn-request-return"
                      onClick={() => {
                        setReturnTargetPurchase({
                          idVenta: purchaseDetail.id_venta,
                          codigoFactura: purchaseDetail.codigo_factura,
                          items: purchaseDetail.items.map((it: any) => ({
                            id_detalle_venta: it.id_detalle_venta,
                            cantidad: it.cantidad,
                            precio_unitario: it.precio_unitario,
                            subtotal: it.subtotal,
                            nombre_producto: it.nombre_producto,
                            sku: it.sku,
                            color: it.color,
                            talla: it.talla,
                            imagen_url: it.imagen,
                          })),
                        });
                      }}
                    >
                      <RotateCcw size={16} />
                      <span>Solicitar Devolución</span>
                    </button>
                  )}

                  <button
                    type="button"
                    className="btn-print-receipt"
                    onClick={() => {
                      printReceipt({
                        codigo_factura: purchaseDetail.codigo_factura,
                        fecha_venta: purchaseDetail.fecha_venta,
                        cliente: {
                          nombre_completo: purchaseDetail.cliente.nombre_completo,
                          ci: purchaseDetail.cliente.ci,
                        },
                        tipo_venta: purchaseDetail.tipo_venta,
                        subtotal: purchaseDetail.subtotal,
                        descuento: purchaseDetail.descuento,
                        total: purchaseDetail.total,
                        pago: purchaseDetail.pago,
                        items: purchaseDetail.items.map((it: any) => ({
                          nombre_producto: it.nombre_producto,
                          sku: it.sku,
                          color: it.color,
                          talla: it.talla,
                          cantidad: it.cantidad,
                          precio_unitario: it.precio_unitario,
                          subtotal: it.subtotal,
                        })),
                      });
                    }}
                  >
                    <Printer size={17} />
                    <span>Imprimir Comprobante Fiscal</span>
                  </button>
                  <button
                    type="button"
                    className="btn-close-receipt"
                    onClick={handleCloseDetail}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Modal de Solicitud de Devolución */}
      {returnTargetPurchase && (
        <RequestReturnModal
          idVenta={returnTargetPurchase.idVenta}
          codigoFactura={returnTargetPurchase.codigoFactura}
          items={returnTargetPurchase.items}
          onClose={() => setReturnTargetPurchase(null)}
          onSuccess={() => {
            fetchPurchases();
            handleCloseDetail();
          }}
        />
      )}
    </div>
  );
};

export default MyPurchasesPage;
