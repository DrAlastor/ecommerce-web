/**
 * @caso-de-uso Módulo heredado — Gestión de devoluciones
 * @subsistema Ventas, Pagos y Compras
 * @capa Boundary — Frontend web
 * @responsabilidad Representa la pantalla principal de Frontend web; compone la interfaz e inicia las acciones del caso de uso.
 * @secuencia Usuario autorizado -> vista de devoluciones -> controlador -> servicio de devoluciones -> Devolución/DetalleDevolución/Venta/Inventario.
 * Nota: módulo heredado; su numeración no corresponde al catálogo oficial de CU del informe.
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Building2,
  ShoppingBag,
  AlertCircle,
  Eye,
  RefreshCw,
  Store,
  Calendar,
  FileText,
  Package,
} from 'lucide-react';
import { returnsApi } from '../services/returns.api';
import type {
  ReturnRecord,
  SaleLookupResult,
  BranchOption,
} from '../types/returns.types';
import './ManageReturnsPage.css';

export const ManageReturnsPage: React.FC = () => {
  // Navigation Tabs: 'requests' | 'store'
  const [activeTab, setActiveTab] = useState<'requests' | 'store'>('requests');

  // Tab 1: Requests state
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modals state
  const [detailModal, setDetailModal] = useState<ReturnRecord | null>(null);
  const [approveModal, setApproveModal] = useState<ReturnRecord | null>(null);
  const [rejectModal, setRejectModal] = useState<ReturnRecord | null>(null);
  
  // Action form state
  const [selectedBranchId, setSelectedBranchId] = useState<number>(1);
  const [actionNote, setActionNote] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Tab 2: Store / In-person return state
  const [storeSearchInput, setStoreSearchInput] = useState<string>('');
  const [storeSearching, setStoreSearching] = useState<boolean>(false);
  const [foundSale, setFoundSale] = useState<SaleLookupResult | null>(null);
  const [availableBranches, setAvailableBranches] = useState<BranchOption[]>([]);
  const [storeReturnBranchId, setStoreReturnBranchId] = useState<number>(1);
  const [storeReason, setStoreReason] = useState<string>('Cambio de talla / modelo');
  const [storeObservation, setStoreObservation] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<Record<number, { selected: boolean; qty: number }>>({});
  const [storeSubmitting, setStoreSubmitting] = useState<boolean>(false);

  // Load all returns on mount
  const fetchReturns = async () => {
    setLoading(true);
    try {
      const response = await returnsApi.getAllReturns({
        estado: statusFilter === 'todos' ? undefined : statusFilter,
        search: searchQuery.trim() || undefined,
      });
      setReturns(response.data || []);
    } catch (err: any) {
      console.error('Error al cargar devoluciones:', err);
      showNotification('error', err.response?.data?.message || 'Error al obtener la lista de devoluciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, [statusFilter]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = returns.length;
    const pendientes = returns.filter((r) => r.estado.toLowerCase() === 'pendiente').length;
    const procesadas = returns.filter((r) => r.estado.toLowerCase() === 'procesada').length;
    const rechazadas = returns.filter((r) => r.estado.toLowerCase() === 'rechazada').length;
    return { total, pendientes, procesadas, rechazadas };
  }, [returns]);

  // Client-side filtering for fast interactive search
  const filteredReturns = useMemo(() => {
    return returns.filter((item) => {
      const matchesFilter =
        statusFilter === 'todos' || item.estado.toLowerCase() === statusFilter.toLowerCase();

      if (!matchesFilter) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const invoice = item.venta?.codigo_factura?.toLowerCase() || '';
      const clientName = item.venta?.cliente?.nombre?.toLowerCase() || '';
      const clientCi = item.venta?.cliente?.ci?.toLowerCase() || '';
      const idDev = String(item.id_devolucion);
      const idSale = String(item.id_venta);

      return (
        invoice.includes(q) ||
        clientName.includes(q) ||
        clientCi.includes(q) ||
        idDev.includes(q) ||
        idSale.includes(q)
      );
    });
  }, [returns, statusFilter, searchQuery]);

  // Handle Approve return request
  const handleConfirmApprove = async () => {
    if (!approveModal) return;
    setActionLoading(true);
    try {
      await returnsApi.updateReturnStatus(approveModal.id_devolucion, {
        estado: 'procesada',
        observacion: actionNote.trim() || undefined,
        id_sucursal_reingreso: selectedBranchId,
      });
      showNotification('success', `Devolución #${approveModal.id_devolucion} aprobada con éxito. Stock reingresado a inventario.`);
      setApproveModal(null);
      setActionNote('');
      fetchReturns();
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Error al aprobar la devolución.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Reject return request
  const handleConfirmReject = async () => {
    if (!rejectModal) return;
    if (!actionNote.trim()) {
      showNotification('error', 'Por favor especifica el motivo del rechazo para informar al cliente.');
      return;
    }
    setActionLoading(true);
    try {
      await returnsApi.updateReturnStatus(rejectModal.id_devolucion, {
        estado: 'rechazada',
        observacion: actionNote.trim(),
      });
      showNotification('success', `Devolución #${rejectModal.id_devolucion} rechazada correctamente.`);
      setRejectModal(null);
      setActionNote('');
      fetchReturns();
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Error al rechazar la devolución.');
    } finally {
      setActionLoading(false);
    }
  };

  // Tab 2: Search sale for store return
  const handleSearchSale = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!storeSearchInput.trim()) return;

    setStoreSearching(true);
    setFoundSale(null);
    setSelectedItems({});

    try {
      const res = await returnsApi.lookupSale(storeSearchInput.trim());
      if (res.ventas && res.ventas.length > 0) {
        const sale = res.ventas[0];
        setFoundSale(sale);
        setAvailableBranches(res.sucursales || []);

        const initialBranch =
          sale.sucursal_origen?.id_sucursal ||
          (res.sucursales.length > 0 ? res.sucursales[0].id_sucursal : 1);
        setStoreReturnBranchId(initialBranch);

        // Pre-fill selection state
        const initialSelections: Record<number, { selected: boolean; qty: number }> = {};
        sale.items.forEach((item) => {
          initialSelections[item.id_detalle_venta] = {
            selected: item.cantidad_disponible > 0,
            qty: item.cantidad_disponible > 0 ? 1 : 0,
          };
        });
        setSelectedItems(initialSelections);

        if (!sale.tiene_items_disponibles) {
          showNotification('error', 'Esta venta no tiene productos disponibles para devolución (ya fueron devueltos).');
        }
      } else {
        showNotification('error', `No se encontró ninguna venta con el código o ID: "${storeSearchInput.trim()}"`);
      }
    } catch (err: any) {
      console.error(err);
      showNotification('error', err.response?.data?.message || 'Error al buscar comprobante de venta.');
    } finally {
      setStoreSearching(false);
    }
  };

  // Toggle item selection in Tab 2
  const toggleItemSelection = (idDetalle: number) => {
    setSelectedItems((prev) => {
      const current = prev[idDetalle] || { selected: false, qty: 1 };
      const nextSelected = !current.selected;
      return {
        ...prev,
        [idDetalle]: {
          selected: nextSelected,
          qty: nextSelected ? (current.qty > 0 ? current.qty : 1) : 0,
        },
      };
    });
  };

  // Adjust item quantity in Tab 2
  const changeItemQty = (idDetalle: number, delta: number, maxQty: number) => {
    setSelectedItems((prev) => {
      const current = prev[idDetalle] || { selected: true, qty: 1 };
      const nextQty = Math.max(1, Math.min(maxQty, current.qty + delta));
      return {
        ...prev,
        [idDetalle]: {
          ...current,
          qty: nextQty,
        },
      };
    });
  };

  // Calculate totals for store return
  const storeSummary = useMemo(() => {
    if (!foundSale) return { totalQty: 0, totalAmount: 0 };
    let totalQty = 0;
    let totalAmount = 0;

    foundSale.items.forEach((item) => {
      const sel = selectedItems[item.id_detalle_venta];
      if (sel && sel.selected && sel.qty > 0) {
        totalQty += sel.qty;
        totalAmount += sel.qty * item.precio_unitario;
      }
    });

    return { totalQty, totalAmount };
  }, [foundSale, selectedItems]);

  // Submit in-store return (instant processing)
  const handleSubmitStoreReturn = async () => {
    if (!foundSale) return;
    if (storeSummary.totalQty === 0) {
      showNotification('error', 'Selecciona al menos un artículo a devolver con cantidad mayor a 0.');
      return;
    }

    const payloadItems = Object.entries(selectedItems)
      .filter(([, val]) => val.selected && val.qty > 0)
      .map(([idDetalle, val]) => ({
        id_detalle_venta: Number(idDetalle),
        cantidad: val.qty,
        motivo: storeReason,
      }));

    setStoreSubmitting(true);
    try {
      await returnsApi.createReturn({
        id_venta: foundSale.id_venta,
        motivo: storeReason,
        observacion: storeObservation.trim() || 'Devolución directa procesada en mostrador',
        id_sucursal_reingreso: storeReturnBranchId,
        auto_procesar: true,
        items: payloadItems,
      });

      showNotification('success', `¡Devolución en tienda completada! Se reingresaron ${storeSummary.totalQty} unidades al inventario.`);
      // Reset form
      setFoundSale(null);
      setStoreSearchInput('');
      setSelectedItems({});
      setStoreObservation('');
      // Refresh list
      fetchReturns();
      // Switch to list to see recorded return
      setActiveTab('requests');
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Error al procesar la devolución en tienda.');
    } finally {
      setStoreSubmitting(false);
    }
  };

  return (
    <div className="manage-returns-container">
      {/* Toast Notification */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 10000,
            padding: '1rem 1.5rem',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.95rem',
            fontWeight: 600,
            background: notification.type === 'success' ? '#DEF7EC' : '#FEE2E2',
            color: notification.type === 'success' ? '#03543F' : '#991B1B',
            border: `1px solid ${notification.type === 'success' ? '#BCF0DA' : '#FCA5A5'}`,
          }}
        >
          {notification.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="returns-header-banner">
        <div className="returns-header-info">
          <h1>
            <RotateCcw size={28} />
            Gestión de Devoluciones
            <span className="returns-header-badge">Ventas y Facturación</span>
          </h1>
          <p>
            Revisa y aprueba solicitudes de devolución con reingreso automático al stock de sucursal, o registra devoluciones inmediatas en mostrador.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="returns-tab-nav">
          <button
            type="button"
            className={`returns-tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            <FileText size={18} />
            Solicitudes de Clientes
            {stats.pendientes > 0 && <span className="tab-badge">{stats.pendientes}</span>}
          </button>
          <button
            type="button"
            className={`returns-tab-btn ${activeTab === 'store' ? 'active' : ''}`}
            onClick={() => setActiveTab('store')}
          >
            <Store size={18} />
            Nueva Devolución en Tienda
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SOLICITUDES DE CLIENTES */}
      {/* ========================================================================= */}
      {activeTab === 'requests' && (
        <>
          {/* Stats Ribbon */}
          <div className="returns-stats-grid">
            <div className="returns-stat-card">
              <div className="stat-icon-wrapper total">
                <ShoppingBag size={24} />
              </div>
              <div className="stat-details">
                <span className="stat-value">{stats.total}</span>
                <span className="stat-label">Total Solicitudes</span>
              </div>
            </div>

            <div className="returns-stat-card">
              <div className="stat-icon-wrapper pending">
                <Clock size={24} />
              </div>
              <div className="stat-details">
                <span className="stat-value">{stats.pendientes}</span>
                <span className="stat-label">Pendientes de Revisión</span>
              </div>
            </div>

            <div className="returns-stat-card">
              <div className="stat-icon-wrapper processed">
                <CheckCircle2 size={24} />
              </div>
              <div className="stat-details">
                <span className="stat-value">{stats.procesadas}</span>
                <span className="stat-label">Aprobadas / Procesadas</span>
              </div>
            </div>

            <div className="returns-stat-card">
              <div className="stat-icon-wrapper rejected">
                <XCircle size={24} />
              </div>
              <div className="stat-details">
                <span className="stat-value">{stats.rechazadas}</span>
                <span className="stat-label">Rechazadas</span>
              </div>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="returns-control-bar">
            <div className="returns-search-wrapper">
              <Search size={18} />
              <input
                type="text"
                className="returns-search-input"
                placeholder="Buscar por # venta, factura, cliente o cédula..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="returns-filter-pills">
              {['todos', 'pendiente', 'procesada', 'rechazada'].map((status) => (
                <button
                  key={status}
                  type="button"
                  className={`filter-pill ${statusFilter === status ? 'active' : ''}`}
                  onClick={() => setStatusFilter(status)}
                >
                  {status === 'todos'
                    ? 'Todas'
                    : status.charAt(0).toUpperCase() + status.slice(1) + 's'}
                </button>
              ))}

              <button
                type="button"
                className="filter-refresh-btn"
                onClick={fetchReturns}
                title="Actualizar listado"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                <span>Refrescar</span>
              </button>
            </div>
          </div>

          {/* Table of Returns */}
          <div className="returns-table-wrapper">
            {loading ? (
              <div className="returns-empty-state">
                <RefreshCw size={36} className="animate-spin" />
                <h3>Cargando devoluciones...</h3>
                <p>Consultando el registro del sistema...</p>
              </div>
            ) : filteredReturns.length === 0 ? (
              <div className="returns-empty-state">
                <RotateCcw size={48} />
                <h3>No se encontraron devoluciones</h3>
                <p>
                  {searchQuery
                    ? 'No hay registros que coincidan con los criterios de búsqueda ingresados.'
                    : 'Aún no hay solicitudes de devolución registradas en esta categoría.'}
                </p>
              </div>
            ) : (
              <table className="returns-table">
                <thead>
                  <tr>
                    <th>ID / Factura</th>
                    <th>Cliente</th>
                    <th>Artículos</th>
                    <th>Motivo</th>
                    <th>Monto Estimado</th>
                    <th>Estado</th>
                    <th style={{ textAlign: 'right', minWidth: '240px' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReturns.map((ret) => (
                    <tr key={ret.id_devolucion}>
                      <td>
                        <div className="return-code-cell">
                          <span className="return-id">Devolución #{ret.id_devolucion}</span>
                          <span className="return-invoice-badge">
                            <ShoppingBag size={12} />
                            {ret.venta?.codigo_factura || `Venta #${ret.id_venta}`}
                          </span>
                          <span className="return-date-sub">
                            <Calendar size={11} style={{ display: 'inline', marginRight: 3 }} />
                            {new Date(ret.fecha_hora).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="client-name">
                          {ret.venta?.cliente?.nombre || 'Cliente General'}
                        </div>
                        {ret.venta?.cliente?.ci && (
                          <div className="client-ci">CI: {ret.venta.cliente.ci}</div>
                        )}
                        <div className="return-date-sub">
                          <Building2 size={11} style={{ display: 'inline', marginRight: 3 }} />
                          {ret.venta?.sucursal?.nombre || 'Tienda Online'}
                        </div>
                      </td>

                      <td>
                        <div className="return-items-summary">
                          {ret.items && ret.items[0]?.producto?.imagen_url ? (
                            <img
                              src={ret.items[0].producto.imagen_url}
                              alt="Producto"
                              className="return-item-thumb"
                            />
                          ) : (
                            <div className="return-item-thumb-placeholder">
                              <Package size={18} />
                            </div>
                          )}
                          <div>
                            <div className="return-items-count">
                              {ret.total_items} {ret.total_items === 1 ? 'artículo' : 'artículos'}
                            </div>
                            <span style={{ fontSize: '0.75rem', color: '#78716C' }}>
                              {ret.items?.[0]?.producto?.nombre || 'Prenda'}
                              {ret.items.length > 1 ? ` (+${ret.items.length - 1} más)` : ''}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span style={{ fontWeight: 600, color: '#1C1510', fontSize: '0.85rem' }}>
                          {ret.motivo}
                        </span>
                        {ret.observacion && (
                          <div
                            style={{
                              fontSize: '0.75rem',
                              color: '#78716C',
                              maxWidth: '220px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            "{ret.observacion}"
                          </div>
                        )}
                      </td>

                      <td>
                        <span style={{ fontWeight: 700, color: '#8C5E35', fontSize: '0.95rem' }}>
                          {Number(ret.monto_estimado).toFixed(2)} Bs
                        </span>
                      </td>

                      <td>
                        <span className={`return-status-badge ${ret.estado.toLowerCase()}`}>
                          {ret.estado.toLowerCase() === 'pendiente' && <Clock size={12} />}
                          {ret.estado.toLowerCase() === 'procesada' && <CheckCircle2 size={12} />}
                          {ret.estado.toLowerCase() === 'rechazada' && <XCircle size={12} />}
                          {ret.estado}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div className="return-actions-cell" style={{ justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="btn-return-action-view"
                            onClick={() => setDetailModal(ret)}
                            title="Ver detalles completos"
                          >
                            <Eye size={15} />
                            <span>Detalle</span>
                          </button>

                          {ret.estado.toLowerCase() === 'pendiente' && (
                            <>
                              <button
                                type="button"
                                className="btn-return-action-approve"
                                onClick={() => {
                                  setApproveModal(ret);
                                  setSelectedBranchId(ret.venta?.sucursal?.id_sucursal || 1);
                                  setActionNote('');
                                }}
                                title="Aprobar y reingresar stock"
                              >
                                <CheckCircle2 size={15} />
                                <span>Aprobar</span>
                              </button>

                              <button
                                type="button"
                                className="btn-return-action-reject"
                                onClick={() => {
                                  setRejectModal(ret);
                                  setActionNote('');
                                }}
                                title="Rechazar solicitud"
                              >
                                <XCircle size={15} />
                                <span>Rechazar</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: NUEVA DEVOLUCIÓN EN TIENDA (POS / CAJERO) */}
      {/* ========================================================================= */}
      {activeTab === 'store' && (
        <div className="store-return-card">
          <div className="store-return-search-section">
            <label htmlFor="sale-search-input">
              Buscar Venta por Código de Factura, Comprobante o ID:
            </label>
            <form onSubmit={handleSearchSale} className="store-search-box">
              <input
                id="sale-search-input"
                type="text"
                placeholder="Ejemplo: FAC-0001, o ID de venta..."
                value={storeSearchInput}
                onChange={(e) => setStoreSearchInput(e.target.value)}
              />
              <button
                type="submit"
                className="store-search-btn"
                disabled={storeSearching || !storeSearchInput.trim()}
              >
                {storeSearching ? <RefreshCw size={18} className="animate-spin" /> : <Search size={18} />}
                Consultar
              </button>
            </form>
          </div>

          {/* Sale details found */}
          {foundSale && (
            <div>
              {/* Sale Info Summary Card */}
              <div className="found-sale-card">
                <div className="sale-meta-group">
                  <h4>
                    <ShoppingBag size={20} color="#8C5E35" />
                    Factura #{foundSale.codigo_factura || foundSale.id_venta}
                  </h4>
                  <div className="sale-meta-row">
                    <span>
                      Cliente: <strong>{foundSale.cliente?.nombre || 'Consumidor Final'}</strong>
                    </span>
                    {foundSale.cliente?.ci && (
                      <span>
                        CI: <strong>{foundSale.cliente.ci}</strong>
                      </span>
                    )}
                    <span>
                      Fecha:{' '}
                      <strong>
                        {new Date(foundSale.fecha_venta).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </strong>
                    </span>
                    <span>
                      Sucursal Origen:{' '}
                      <strong>{foundSale.sucursal_origen?.nombre || 'Tienda Principal'}</strong>
                    </span>
                  </div>
                </div>

                <div className="sale-total-box">
                  <span className="sale-total-label">Total Venta</span>
                  <div className="sale-total-amount">{foundSale.total.toFixed(2)} Bs</div>
                </div>
              </div>

              {/* Items Selection Table */}
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1rem 0' }}>
                Selecciona los artículos y cantidades a devolver:
              </h3>

              <table className="store-items-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}></th>
                    <th>Producto</th>
                    <th>Precio Unit.</th>
                    <th>Compradas</th>
                    <th>Ya Devueltas</th>
                    <th>Disponibles</th>
                    <th>Cant. a Devolver</th>
                    <th>Subtotal Devolución</th>
                  </tr>
                </thead>
                <tbody>
                  {foundSale.items.map((item) => {
                    const sel = selectedItems[item.id_detalle_venta] || {
                      selected: false,
                      qty: 0,
                    };
                    const isAvailable = item.cantidad_disponible > 0;

                    return (
                      <tr
                        key={item.id_detalle_venta}
                        className={sel.selected ? 'selected' : ''}
                        style={{ opacity: isAvailable ? 1 : 0.5 }}
                      >
                        <td>
                          <input
                            type="checkbox"
                            checked={sel.selected}
                            disabled={!isAvailable}
                            onChange={() =>
                              toggleItemSelection(item.id_detalle_venta)
                            }
                            style={{ width: 18, height: 18, accentColor: '#8C5E35', cursor: 'pointer' }}
                          />
                        </td>

                        <td>
                          <div className="store-product-info">
                            {item.producto?.imagen_url ? (
                              <img
                                src={item.producto.imagen_url}
                                alt="Prenda"
                                className="store-product-img"
                              />
                            ) : (
                              <div
                                className="store-product-img"
                                style={{
                                  background: '#F0EAE1',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#8C5E35',
                                }}
                              >
                                <Package size={20} />
                              </div>
                            )}
                            <div>
                              <strong style={{ color: '#1C1510', fontSize: '0.9rem' }}>
                                {item.producto.nombre}
                              </strong>
                              <div style={{ fontSize: '0.75rem', color: '#78716C' }}>
                                {item.producto.color && `Color: ${item.producto.color} | `}
                                {item.producto.talla && `Talla: ${item.producto.talla} | `}
                                SKU: {item.producto.sku || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td>{item.precio_unitario.toFixed(2)} Bs</td>
                        <td>{item.cantidad_comprada}</td>
                        <td>
                          <span style={{ color: item.cantidad_devuelta > 0 ? '#EF4444' : '#78716C', fontWeight: 600 }}>
                            {item.cantidad_devuelta}
                          </span>
                        </td>
                        <td>
                          <strong style={{ color: '#0E9F6E' }}>{item.cantidad_disponible}</strong>
                        </td>

                        <td>
                          {isAvailable && sel.selected ? (
                            <div className="qty-control">
                              <button
                                type="button"
                                className="qty-btn"
                                onClick={() =>
                                  changeItemQty(
                                    item.id_detalle_venta,
                                    -1,
                                    item.cantidad_disponible,
                                  )
                                }
                                disabled={sel.qty <= 1}
                              >
                                -
                              </button>
                              <span className="qty-display">{sel.qty}</span>
                              <button
                                type="button"
                                className="qty-btn"
                                onClick={() =>
                                  changeItemQty(
                                    item.id_detalle_venta,
                                    1,
                                    item.cantidad_disponible,
                                  )
                                }
                                disabled={sel.qty >= item.cantidad_disponible}
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: '#A8A29E', fontSize: '0.85rem' }}>-</span>
                          )}
                        </td>

                        <td>
                          <strong style={{ color: '#8C5E35' }}>
                            {(sel.selected ? sel.qty * item.precio_unitario : 0).toFixed(2)} Bs
                          </strong>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Form details: Reason, Branch, Notes */}
              <div className="store-return-form-grid">
                <div className="form-group-custom">
                  <label htmlFor="store-reason-select">Motivo de la Devolución *</label>
                  <select
                    id="store-reason-select"
                    className="form-control-custom"
                    value={storeReason}
                    onChange={(e) => setStoreReason(e.target.value)}
                  >
                    <option value="Cambio de talla / modelo">Cambio de talla / modelo</option>
                    <option value="Defecto o falla de fábrica">Defecto o falla de fábrica</option>
                    <option value="Producto no coincide con la descripción">Producto no coincide con la descripción</option>
                    <option value="Arrepentimiento o no conformidad">Arrepentimiento o no conformidad</option>
                    <option value="Artículo dañado en entrega">Artículo dañado en entrega</option>
                    <option value="Otro motivo">Otro motivo</option>
                  </select>
                </div>

                <div className="form-group-custom">
                  <label htmlFor="store-branch-select">Sucursal de Reingreso de Stock *</label>
                  <select
                    id="store-branch-select"
                    className="form-control-custom"
                    value={storeReturnBranchId}
                    onChange={(e) => setStoreReturnBranchId(Number(e.target.value))}
                  >
                    {availableBranches.map((b) => (
                      <option key={b.id_sucursal} value={b.id_sucursal}>
                        {b.nombre} {b.direccion ? `(${b.direccion})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group-custom" style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="store-obs-input">Observación / Detalle de la Devolución (Opcional):</label>
                  <input
                    id="store-obs-input"
                    type="text"
                    className="form-control-custom"
                    placeholder="Ej. Prenda recibida en perfecto estado con etiquetas intactas..."
                    value={storeObservation}
                    onChange={(e) => setStoreObservation(e.target.value)}
                  />
                </div>
              </div>

              {/* Bottom action summary */}
              <div className="store-return-summary-card">
                <div className="summary-figures">
                  <div>
                    <div className="summary-metric-label">Unidades a Devolver</div>
                    <div className="summary-metric-value">{storeSummary.totalQty} unds</div>
                  </div>
                  <div>
                    <div className="summary-metric-label">Monto a Devolver / Nota Crédito</div>
                    <div className="summary-metric-value highlight">
                      {storeSummary.totalAmount.toFixed(2)} Bs
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-process-instant-return"
                  disabled={storeSummary.totalQty === 0 || storeSubmitting}
                  onClick={handleSubmitStoreReturn}
                >
                  {storeSubmitting ? (
                    <RefreshCw size={20} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={20} />
                  )}
                  {storeSubmitting
                    ? 'Procesando Reingreso...'
                    : 'Registrar Devolución y Reingresar a Stock'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VER DETALLE DE DEVOLUCIÓN */}
      {/* ========================================================================= */}
      {detailModal && (
        <div className="return-modal-backdrop" onClick={() => setDetailModal(null)}>
          <div className="return-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="return-modal-header">
              <h3>
                <RotateCcw size={22} color="#8C5E35" />
                Detalle de Devolución #{detailModal.id_devolucion}
              </h3>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setDetailModal(null)}
              >
                ✕
              </button>
            </div>

            <div className="return-modal-body">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.25rem',
                  paddingBottom: '1rem',
                  borderBottom: '1px solid #EFEAE3',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#78716C', textTransform: 'uppercase' }}>
                    Estado
                  </span>
                  <div>
                    <span className={`return-status-badge ${detailModal.estado.toLowerCase()}`}>
                      {detailModal.estado}
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.8rem', color: '#78716C', textTransform: 'uppercase' }}>
                    Monto Estimado
                  </span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#8C5E35' }}>
                    {Number(detailModal.monto_estimado).toFixed(2)} Bs
                  </div>
                </div>
              </div>

              {/* Venta & Cliente */}
              <div
                style={{
                  background: '#FAF7F2',
                  padding: '1rem',
                  borderRadius: '12px',
                  marginBottom: '1.5rem',
                  fontSize: '0.85rem',
                }}
              >
                <div style={{ marginBottom: '0.35rem' }}>
                  <strong>Factura:</strong> {detailModal.venta?.codigo_factura} (Venta #{detailModal.id_venta})
                </div>
                <div style={{ marginBottom: '0.35rem' }}>
                  <strong>Cliente:</strong> {detailModal.venta?.cliente?.nombre || 'Cliente General'}
                </div>
                <div style={{ marginBottom: '0.35rem' }}>
                  <strong>Fecha de Solicitud:</strong>{' '}
                  {new Date(detailModal.fecha_hora).toLocaleString('es-ES')}
                </div>
                <div>
                  <strong>Motivo:</strong> {detailModal.motivo}
                </div>
                {detailModal.observacion && (
                  <div style={{ marginTop: '0.35rem', color: '#57534E' }}>
                    <strong>Comentarios:</strong> "{detailModal.observacion}"
                  </div>
                )}
              </div>

              {/* Items List */}
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.75rem 0' }}>
                Prendas a Devolver ({detailModal.items.length}):
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {detailModal.items.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem',
                      border: '1px solid #EFEAE3',
                      borderRadius: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {item.producto?.imagen_url ? (
                        <img
                          src={item.producto.imagen_url}
                          alt="Prenda"
                          style={{ width: 42, height: 42, borderRadius: 8, objectFit: 'cover' }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: 8,
                            background: '#F0EAE1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#8C5E35',
                          }}
                        >
                          <Package size={20} />
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                          {item.producto?.nombre}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#78716C' }}>
                          {item.producto?.color && `Color: ${item.producto.color} | `}
                          {item.producto?.talla && `Talla: ${item.producto.talla} | `}
                          Cant: <strong>{item.cantidad}</strong>
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: '#8C5E35' }}>
                        {((item.precio_unitario || 0) * item.cantidad).toFixed(2)} Bs
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#A8A29E' }}>
                        {Number(item.precio_unitario || 0).toFixed(2)} Bs c/u
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="return-modal-footer">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setDetailModal(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: APROBAR DEVOLUCIÓN */}
      {/* ========================================================================= */}
      {approveModal && (
        <div className="return-modal-backdrop" onClick={() => setApproveModal(null)}>
          <div className="return-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="return-modal-header">
              <h3>
                <CheckCircle2 size={22} color="#0E9F6E" />
                Aprobar Devolución #{approveModal.id_devolucion}
              </h3>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setApproveModal(null)}
              >
                ✕
              </button>
            </div>

            <div className="return-modal-body">
              <div
                style={{
                  background: '#DEF7EC',
                  border: '1px solid #BCF0DA',
                  color: '#03543F',
                  padding: '1rem',
                  borderRadius: '12px',
                  marginBottom: '1.25rem',
                  fontSize: '0.85rem',
                  lineHeight: 1.5,
                }}
              >
                <strong>Acción automática:</strong> Al aprobar esta devolución, las{' '}
                <strong>{approveModal.total_items} unidades</strong> serán reingresadas
                automáticamente al inventario de la sucursal seleccionada y se registrará un
                movimiento de inventario oficial de tipo <em>'devolucion'</em>.
              </div>

              <div className="form-group-custom" style={{ marginBottom: '1.25rem' }}>
                <label htmlFor="approve-branch-id">Sucursal donde reingresará el stock:</label>
                <select
                  id="approve-branch-id"
                  className="form-control-custom"
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(Number(e.target.value))}
                >
                  <option value={1}>Sucursal Principal (Centro Comercial)</option>
                  <option value={2}>Sucursal Norte</option>
                  <option value={3}>Sucursal Sur</option>
                </select>
              </div>

              <div className="form-group-custom">
                <label htmlFor="approve-note">Nota de Aprobación (Opcional):</label>
                <textarea
                  id="approve-note"
                  className="form-control-custom"
                  rows={3}
                  placeholder="Ej. Artículos verificados en buenas condiciones..."
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                />
              </div>
            </div>

            <div className="return-modal-footer">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setApproveModal(null)}
                disabled={actionLoading}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-modal-confirm-approve"
                onClick={handleConfirmApprove}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={16} />
                )}
                {actionLoading ? 'Procesando...' : 'Confirmar Aprobación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RECHAZAR DEVOLUCIÓN */}
      {/* ========================================================================= */}
      {rejectModal && (
        <div className="return-modal-backdrop" onClick={() => setRejectModal(null)}>
          <div className="return-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="return-modal-header">
              <h3>
                <XCircle size={22} color="#EF4444" />
                Rechazar Devolución #{rejectModal.id_devolucion}
              </h3>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setRejectModal(null)}
              >
                ✕
              </button>
            </div>

            <div className="return-modal-body">
              <div
                style={{
                  background: '#FEE2E2',
                  border: '1px solid #FCA5A5',
                  color: '#991B1B',
                  padding: '1rem',
                  borderRadius: '12px',
                  marginBottom: '1.25rem',
                  fontSize: '0.85rem',
                }}
              >
                Indica claramente la razón por la cual la solicitud no puede ser aceptada (por
                ejemplo: plazo vencido, prenda con signos de uso o sin etiqueta original).
              </div>

              <div className="form-group-custom">
                <label htmlFor="reject-note">Motivo del Rechazo *:</label>
                <textarea
                  id="reject-note"
                  className="form-control-custom"
                  rows={4}
                  placeholder="Explica la razón del rechazo..."
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                />
              </div>
            </div>

            <div className="return-modal-footer">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setRejectModal(null)}
                disabled={actionLoading}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-modal-confirm-reject"
                onClick={handleConfirmReject}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <XCircle size={16} />
                )}
                {actionLoading ? 'Rechazando...' : 'Confirmar Rechazo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageReturnsPage;
