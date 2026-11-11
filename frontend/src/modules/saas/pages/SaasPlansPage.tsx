import React, { useEffect, useState } from 'react';
import { saasService } from '../services/saas.service';
import type { CreatePlanPayload, SaasPlanItem, UpdatePlanPayload } from '../types/saas.types';
import {
  CreditCard,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Search,
  Bot,
  Brain,
  WifiOff,
  Package,
  Store,
  Warehouse,
  Users,
  AlertCircle,
  X,
  DollarSign,
  ShieldAlert,
} from 'lucide-react';
import './SaasPlansPage.css';

export const SaasPlansPage: React.FC = () => {
  const [plans, setPlans] = useState<SaasPlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SaasPlanItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form Data
  const [formData, setFormData] = useState<CreatePlanPayload>({
    codigo: '',
    nombre: '',
    tipo_plan: 'BASICO',
    descripcion: '',
    precio_mensual: 29.9,
    precio_anual: 299.0,
    moneda: 'USD',
    duracion_prueba_dias: 0,
    requiere_pago: true,
    limite_usuarios: 5,
    limite_sucursales: 1,
    limite_almacenes: 1,
    limite_productos: 1000,
    permite_offline: true,
    permite_ia_reportes: false,
    permite_ml_analytics: false,
    activo: true,
  });

  // Delete Confirm
  const [deleteConfirmPlan, setDeleteConfirmPlan] = useState<SaasPlanItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const data = await saasService.getPlans();
      setPlans(data);
    } catch (err: any) {
      setErrorMessage('Error al cargar catálogo de planes de suscripción.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleOpenCreate = () => {
    setEditingPlan(null);
    setFormData({
      codigo: '',
      nombre: '',
      tipo_plan: 'BASICO',
      descripcion: '',
      precio_mensual: 29.9,
      precio_anual: 299.0,
      moneda: 'USD',
      duracion_prueba_dias: 0,
      requiere_pago: true,
      limite_usuarios: 10,
      limite_sucursales: 1,
      limite_almacenes: 1,
      limite_productos: 1000,
      permite_offline: true,
      permite_ia_reportes: false,
      permite_ml_analytics: false,
      activo: true,
    });
    setErrorMessage(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (plan: SaasPlanItem) => {
    setEditingPlan(plan);
    setFormData({
      codigo: plan.codigo,
      nombre: plan.nombre,
      tipo_plan: plan.tipo_plan,
      descripcion: plan.descripcion,
      precio_mensual: plan.precio_mensual,
      precio_anual: plan.precio_anual,
      moneda: plan.moneda || 'USD',
      duracion_prueba_dias: plan.duracion_prueba_dias,
      requiere_pago: plan.requiere_pago,
      limite_usuarios: plan.limite_usuarios,
      limite_sucursales: plan.limite_sucursales,
      limite_almacenes: plan.limite_almacenes,
      limite_productos: plan.limite_productos,
      permite_offline: plan.permite_offline,
      permite_ia_reportes: plan.permite_ia_reportes,
      permite_ml_analytics: plan.permite_ml_analytics,
      activo: plan.activo,
    });
    setErrorMessage(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage(null);

    try {
      if (editingPlan) {
        const updatePayload: UpdatePlanPayload = { ...formData };
        await saasService.updatePlan(editingPlan.id, updatePayload);
        setSuccessMessage(`Plan "${formData.nombre}" actualizado exitosamente.`);
      } else {
        await saasService.createPlan(formData);
        setSuccessMessage(`Plan "${formData.nombre}" creado exitosamente.`);
      }
      setModalOpen(false);
      await fetchPlans();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err.message || 'Error guardando datos del plan.');
    } finally {
      setSaving(false);
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  const handleToggleActive = async (plan: SaasPlanItem) => {
    try {
      await saasService.updatePlan(plan.id, { activo: !plan.activo });
      setSuccessMessage(`Estado del plan "${plan.nombre}" actualizado a ${!plan.activo ? 'Activo' : 'Inactivo'}.`);
      await fetchPlans();
    } catch (err: any) {
      setErrorMessage('No se pudo actualizar el estado del plan.');
    } finally {
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmPlan) return;
    setDeleting(true);
    try {
      const res = await saasService.deletePlan(deleteConfirmPlan.id);
      setSuccessMessage(res.message);
      setDeleteConfirmPlan(null);
      await fetchPlans();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || 'Error al eliminar el plan.');
    } finally {
      setDeleting(false);
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  const filteredPlans = plans.filter((p) => {
    const matchesSearch =
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.descripcion.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && p.activo) ||
      (statusFilter === 'INACTIVE' && !p.activo);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="saas-plans-page">
      {/* Toast Notificaciones */}
      {successMessage && (
        <div className="saas-alert-toast success">
          <CheckCircle size={18} />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="saas-alert-toast error">
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
          <button type="button" onClick={() => setErrorMessage(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Encabezado */}
      <div className="saas-page-header">
        <div className="header-left">
          <div className="saas-badge-pill">
            <CreditCard size={15} />
            <span>CATÁLOGO COMERCIAL</span>
          </div>
          <h1 className="saas-page-title">Planes de Suscripción</h1>
          <p className="saas-page-subtitle">
            Definición, precios y límites operativos de los paquetes comerciales disponibles para nuevos inquilinos del SaaS.
          </p>
        </div>

        <div className="header-actions">
          <button type="button" className="btn-primary-action" onClick={handleOpenCreate}>
            <Plus size={16} />
            <span>Crear Nuevo Plan</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="plans-controls-bar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por nombre, código o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="status-filters">
          <button
            type="button"
            className={`filter-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setStatusFilter('ALL')}
          >
            Todos ({plans.length})
          </button>
          <button
            type="button"
            className={`filter-btn ${statusFilter === 'ACTIVE' ? 'active' : ''}`}
            onClick={() => setStatusFilter('ACTIVE')}
          >
            Activos ({plans.filter((p) => p.activo).length})
          </button>
          <button
            type="button"
            className={`filter-btn ${statusFilter === 'INACTIVE' ? 'active' : ''}`}
            onClick={() => setStatusFilter('INACTIVE')}
          >
            Inactivos ({plans.filter((p) => !p.activo).length})
          </button>
        </div>
      </div>

      {/* Grid de Planes */}
      {loading ? (
        <div className="plans-loading-state">
          <div className="spinner" />
          <p>Cargando planes de suscripción...</p>
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="plans-empty-state">
          <CreditCard size={48} className="empty-icon" />
          <h3>No se encontraron planes</h3>
          <p>No hay planes que coincidan con el término de búsqueda o filtro seleccionado.</p>
        </div>
      ) : (
        <div className="plans-grid">
          {filteredPlans.map((plan) => (
            <div key={plan.id} className={`plan-card ${!plan.activo ? 'inactive' : ''}`}>
              <div className="plan-card-header">
                <div className="plan-title-wrap">
                  <span className="plan-code-badge">{plan.codigo}</span>
                  <h3 className="plan-name">{plan.nombre}</h3>
                </div>
                <div className="plan-status-badge">
                  {plan.activo ? (
                    <span className="badge-active">
                      <CheckCircle size={13} /> Activo
                    </span>
                  ) : (
                    <span className="badge-inactive">
                      <XCircle size={13} /> Inactivo
                    </span>
                  )}
                </div>
              </div>

              <p className="plan-description">{plan.descripcion}</p>

              {/* Precios */}
              <div className="plan-pricing-box">
                <div className="price-item">
                  <span className="price-label">Mensual</span>
                  <div className="price-value">
                    <span className="currency">$</span>
                    <span className="amount">{Number(plan.precio_mensual).toFixed(2)}</span>
                    <span className="period">/{plan.moneda}</span>
                  </div>
                </div>
                <div className="price-divider" />
                <div className="price-item">
                  <span className="price-label">Anual (Facturado)</span>
                  <div className="price-value">
                    <span className="currency">$</span>
                    <span className="amount">{Number(plan.precio_anual).toFixed(2)}</span>
                    <span className="period">/año</span>
                  </div>
                </div>
              </div>

              {/* Límites */}
              <div className="plan-limits-section">
                <div className="limit-item" title="Límite máximo de productos en catálogo">
                  <Package size={15} className="limit-icon" />
                  <span>
                    <strong>{plan.limite_productos.toLocaleString()}</strong> productos
                  </span>
                </div>
                <div className="limit-item" title="Sucursales físicas permitidas">
                  <Store size={15} className="limit-icon" />
                  <span>
                    <strong>{plan.limite_sucursales}</strong> sucursales
                  </span>
                </div>
                <div className="limit-item" title="Almacenes de stock independientes">
                  <Warehouse size={15} className="limit-icon" />
                  <span>
                    <strong>{plan.limite_almacenes}</strong> almacén(es)
                  </span>
                </div>
                <div className="limit-item" title="Cuentas de usuario colaboradoras">
                  <Users size={15} className="limit-icon" />
                  <span>
                    <strong>{plan.limite_usuarios}</strong> usuarios
                  </span>
                </div>
              </div>

              {/* Capacidades Especiales */}
              <div className="plan-features-list">
                <div className={`feature-pill ${plan.permite_offline ? 'enabled' : 'disabled'}`}>
                  <WifiOff size={13} />
                  <span>Offline PWA</span>
                </div>
                <div className={`feature-pill ${plan.permite_ia_reportes ? 'enabled' : 'disabled'}`}>
                  <Bot size={13} />
                  <span>Reportes Voz IA</span>
                </div>
                <div className={`feature-pill ${plan.permite_ml_analytics ? 'enabled' : 'disabled'}`}>
                  <Brain size={13} />
                  <span>Predicciones ML</span>
                </div>
              </div>

              {/* Acciones de Tarjeta */}
              <div className="plan-card-footer">
                <button
                  type="button"
                  className="btn-card-action edit"
                  onClick={() => handleOpenEdit(plan)}
                  title="Editar plan"
                >
                  <Edit2 size={14} />
                  <span>Editar</span>
                </button>
                <button
                  type="button"
                  className={`btn-card-action toggle ${plan.activo ? 'pause' : 'activate'}`}
                  onClick={() => handleToggleActive(plan)}
                  title={plan.activo ? 'Pausar plan' : 'Reactivar plan'}
                >
                  {plan.activo ? <XCircle size={14} /> : <CheckCircle size={14} />}
                  <span>{plan.activo ? 'Desactivar' : 'Activar'}</span>
                </button>
                <button
                  type="button"
                  className="btn-card-action delete"
                  onClick={() => setDeleteConfirmPlan(plan)}
                  title="Eliminar plan"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Creación / Edición */}
      {modalOpen && (
        <div className="saas-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="saas-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <CreditCard size={20} className="modal-icon" />
                <h2>{editingPlan ? `Editar Plan: ${editingPlan.nombre}` : 'Crear Nuevo Plan Comercial'}</h2>
              </div>
              <button type="button" className="btn-close-modal" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-grid-2">
                <div className="form-group">
                  <label htmlFor="codigo">Código Identificador (Único)</label>
                  <input
                    id="codigo"
                    type="text"
                    placeholder="EJ: BOUTIQUE_PRO"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                    disabled={!!editingPlan}
                    required
                  />
                  <small>No modificable luego de la creación.</small>
                </div>

                <div className="form-group">
                  <label htmlFor="nombre">Nombre Comercial del Plan</label>
                  <input
                    id="nombre"
                    type="text"
                    placeholder="EJ: Plan Boutique Pro"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label htmlFor="tipo_plan">Categoría de Plan</label>
                  <select
                    id="tipo_plan"
                    value={formData.tipo_plan}
                    onChange={(e) => setFormData({ ...formData, tipo_plan: e.target.value })}
                  >
                    <option value="PRUEBA">PRUEBA (Free Trial)</option>
                    <option value="BASICO">BÁSICO</option>
                    <option value="PREMIUM">PREMIUM</option>
                    <option value="CORPORATIVO">CORPORATIVO</option>
                    <option value="EMPRESARIAL">EMPRESARIAL</option>
                    <option value="PERSONALIZADO">PERSONALIZADO</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="moneda">Moneda</label>
                  <select
                    id="moneda"
                    value={formData.moneda}
                    onChange={(e) => setFormData({ ...formData, moneda: e.target.value })}
                  >
                    <option value="USD">Dólares Estadounidenses (USD)</option>
                    <option value="BOB">Bolivianos (BOB)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="descripcion">Descripción y Propuesta de Valor</label>
                <textarea
                  id="descripcion"
                  rows={2}
                  placeholder="Detalla los beneficios y el perfil de cliente ideal para este plan..."
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  required
                />
              </div>

              {/* Precios */}
              <div className="form-grid-2">
                <div className="form-group">
                  <label htmlFor="precio_mensual">Precio Mensual ($)</label>
                  <div className="input-currency-wrap">
                    <DollarSign size={16} />
                    <input
                      id="precio_mensual"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.precio_mensual}
                      onChange={(e) => setFormData({ ...formData, precio_mensual: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="precio_anual">Precio Anual ($ / Con Descuento)</label>
                  <div className="input-currency-wrap">
                    <DollarSign size={16} />
                    <input
                      id="precio_anual"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.precio_anual}
                      onChange={(e) => setFormData({ ...formData, precio_anual: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Límites Operativos */}
              <div className="form-subheading">Límites de Operación por Inquilino</div>
              <div className="form-grid-4">
                <div className="form-group">
                  <label htmlFor="limite_productos">Máx. Productos</label>
                  <input
                    id="limite_productos"
                    type="number"
                    min="1"
                    value={formData.limite_productos}
                    onChange={(e) => setFormData({ ...formData, limite_productos: parseInt(e.target.value, 10) || 1 })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="limite_sucursales">Máx. Sucursales</label>
                  <input
                    id="limite_sucursales"
                    type="number"
                    min="1"
                    value={formData.limite_sucursales}
                    onChange={(e) => setFormData({ ...formData, limite_sucursales: parseInt(e.target.value, 10) || 1 })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="limite_almacenes">Máx. Almacenes</label>
                  <input
                    id="limite_almacenes"
                    type="number"
                    min="1"
                    value={formData.limite_almacenes}
                    onChange={(e) => setFormData({ ...formData, limite_almacenes: parseInt(e.target.value, 10) || 1 })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="limite_usuarios">Máx. Usuarios</label>
                  <input
                    id="limite_usuarios"
                    type="number"
                    min="1"
                    value={formData.limite_usuarios}
                    onChange={(e) => setFormData({ ...formData, limite_usuarios: parseInt(e.target.value, 10) || 1 })}
                    required
                  />
                </div>
              </div>

              {/* Capacidades & Switches */}
              <div className="form-subheading">Capacidades y Funcionalidades Tecnológicas</div>
              <div className="form-checkboxes-grid">
                <label className="checkbox-card">
                  <input
                    type="checkbox"
                    checked={formData.permite_offline}
                    onChange={(e) => setFormData({ ...formData, permite_offline: e.target.checked })}
                  />
                  <div className="checkbox-text">
                    <span className="checkbox-title">Modo Offline (PWA)</span>
                    <span className="checkbox-desc">Permite ventas y cobranza sin internet</span>
                  </div>
                </label>

                <label className="checkbox-card">
                  <input
                    type="checkbox"
                    checked={formData.permite_ia_reportes}
                    onChange={(e) => setFormData({ ...formData, permite_ia_reportes: e.target.checked })}
                  />
                  <div className="checkbox-text">
                    <span className="checkbox-title">Reportes por Voz (IA)</span>
                    <span className="checkbox-desc">Transcripción Whisper y síntesis</span>
                  </div>
                </label>

                <label className="checkbox-card">
                  <input
                    type="checkbox"
                    checked={formData.permite_ml_analytics}
                    onChange={(e) => setFormData({ ...formData, permite_ml_analytics: e.target.checked })}
                  />
                  <div className="checkbox-text">
                    <span className="checkbox-title">Machine Learning BI</span>
                    <span className="checkbox-desc">Regresión de ingresos y clustering</span>
                  </div>
                </label>

                <label className="checkbox-card">
                  <input
                    type="checkbox"
                    checked={formData.activo}
                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                  />
                  <div className="checkbox-text">
                    <span className="checkbox-title">Plan Activo</span>
                    <span className="checkbox-desc">Visible en landing para contratación</span>
                  </div>
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-submit" disabled={saving}>
                  {saving ? 'Guardando...' : editingPlan ? 'Guardar Cambios' : 'Crear Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {deleteConfirmPlan && (
        <div className="saas-modal-backdrop" onClick={() => setDeleteConfirmPlan(null)}>
          <div className="saas-modal-card delete-confirm" onClick={(e) => e.stopPropagation()}>
            <div className="delete-icon-box">
              <ShieldAlert size={32} />
            </div>
            <h2>¿Eliminar Plan de Suscripción?</h2>
            <p>
              Estás a punto de eliminar el plan <strong>{deleteConfirmPlan.nombre}</strong> ({deleteConfirmPlan.codigo}).
              <br />
              Si existen empresas con este plan activo, el sistema impedirá la pérdida de datos y cambiará su estado a inactivo para proteger la facturación.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setDeleteConfirmPlan(null)}
                disabled={deleting}
              >
                Cancelar
              </button>
              <button type="button" className="btn-confirm-delete" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Eliminando...' : 'Sí, Eliminar Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
