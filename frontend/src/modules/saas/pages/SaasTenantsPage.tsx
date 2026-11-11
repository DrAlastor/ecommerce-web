import React, { useEffect, useState } from 'react';
import { saasService } from '../services/saas.service';
import type { EnrichedTenantDetails, UpdateTenantDataPayload } from '../types/saas.types';
import { SaasPagination } from '../components/SaasPagination';
import {
  Building2,
  Edit3,
  Mail,
  Phone,
  MapPin,
  Database,
  Check,
  X,
  AlertCircle,
  KeyRound,
  ExternalLink,
} from 'lucide-react';
import './SaasTenantsPage.css';

const TENANTS_PAGE_SIZE = 6;

export const SaasTenantsPage: React.FC = () => {
  const [tenants, setTenants] = useState<EnrichedTenantDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal de edición
  const [editingTenant, setEditingTenant] = useState<EnrichedTenantDetails | null>(null);
  const [formData, setFormData] = useState<UpdateTenantDataPayload>({
    nombre_comercial: '',
    razon_social: '',
    nit: '',
    email: '',
    telefono: '',
    ciudad_nombre: '',
    direccion: '',
    planId: 'PREMIUM',
    planName: 'Plan Premium',
    estado: 'ACTIVO',
    adminPassword: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const fetchTenants = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await saasService.getAllTenants();
      setTenants(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Error cargando inquilinos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const handleOpenEdit = (tenant: EnrichedTenantDetails) => {
    setEditingTenant(tenant);
    setFormData({
      nombre_comercial: tenant.nombre_comercial,
      razon_social: tenant.razon_social,
      nit: tenant.nit,
      email: tenant.email,
      telefono: tenant.telefono,
      ciudad_nombre: tenant.ciudad_nombre,
      direccion: tenant.direccion,
      planId: tenant.planId,
      planName: tenant.planName,
      estado: tenant.estado,
      adminPassword: '',
    });
  };

  const handleCloseEdit = () => {
    setEditingTenant(null);
  };

  const handlePlanChange = (planId: string) => {
    const planNames: Record<string, string> = {
      PRUEBA: 'Plan Prueba',
      BASICO: 'Plan Básico',
      PREMIUM: 'Plan Premium',
      CORPORATIVO: 'Plan Corporativo',
      EMPRESARIAL: 'Plan Empresarial',
    };
    setFormData((prev) => ({
      ...prev,
      planId,
      planName: planNames[planId] || planId,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant) return;
    setIsSaving(true);
    try {
      const res = await saasService.updateTenant(editingTenant.codigo_empresa, formData);
      showToast('success', res.message);
      handleCloseEdit();
      fetchTenants();
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || err.message || 'Error actualizando inquilino');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading && tenants.length === 0) {
    return (
      <div className="saas-tenants-loading">
        <div className="saas-spinner" />
        <span>Cargando registro consolidado de empresas e inquilinos...</span>
      </div>
    );
  }

  return (
    <div className="saas-tenants-container">
      {toast && (
        <div className={`saas-toast ${toast.type}`}>
          <span>{toast.text}</span>
          <button type="button" onClick={() => setToast(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Encabezado */}
      <div className="saas-tenants-header">
        <div>
          <h1 className="tenants-title">Gestión de Tenants & Modificación de Datos</h1>
          <p className="tenants-subtitle">
            Administra los datos comerciales, fiscales, planes de suscripción, correo y credenciales de acceso de cada tienda virtual del SaaS.
          </p>
        </div>
      </div>

      {error && (
        <div className="saas-error-box">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Grilla de Tenants */}
      <div className="tenants-cards-grid">
        {tenants
          .slice((currentPage - 1) * TENANTS_PAGE_SIZE, currentPage * TENANTS_PAGE_SIZE)
          .map((tenant) => {
          const isSuspended = tenant.estado === 'SUSPENDIDO';
          return (
            <div key={tenant.codigo_empresa} className={`tenant-card ${isSuspended ? 'suspended' : ''}`}>
              <div className="tenant-card-top">
                <div className="tenant-badge-row">
                  <span className={`tenant-status-pill ${tenant.estado.toLowerCase()}`}>
                    {tenant.estado}
                  </span>
                  <span className="tenant-plan-pill">{tenant.planName}</span>
                </div>

                <div className="tenant-main-names">
                  <h3 className="tenant-name">{tenant.nombre_comercial}</h3>
                  <span className="tenant-legal-name">{tenant.razon_social}</span>
                  <span className="tenant-slug-tag">slug: /{tenant.codigo_empresa}</span>
                </div>
              </div>

              <div className="tenant-info-list">
                <div className="info-row">
                  <Mail size={14} className="text-slate" />
                  <span className="info-text">{tenant.email}</span>
                </div>
                {tenant.telefono && (
                  <div className="info-row">
                    <Phone size={14} className="text-slate" />
                    <span className="info-text">{tenant.telefono}</span>
                  </div>
                )}
                <div className="info-row">
                  <MapPin size={14} className="text-slate" />
                  <span className="info-text">{tenant.ciudad_nombre}, {tenant.pais}</span>
                </div>
                {tenant.nit && (
                  <div className="info-row">
                    <span className="info-lbl">NIT:</span>
                    <span className="info-text">{tenant.nit}</span>
                  </div>
                )}
                <div className="info-row">
                  <Database size={14} className="text-blue" />
                  <span className="info-text code">{tenant.databaseName}</span>
                </div>
              </div>

              {/* Estadísticas de Negocio */}
              <div className="tenant-stats-grid">
                <div className="stat-box">
                  <span className="stat-val">{tenant.totalProducts}</span>
                  <span className="stat-lbl">Prendas</span>
                </div>
                <div className="stat-box">
                  <span className="stat-val">{tenant.totalOrders}</span>
                  <span className="stat-lbl">Órdenes</span>
                </div>
                <div className="stat-box">
                  <span className="stat-val">Bs. {tenant.totalRevenue.toLocaleString()}</span>
                  <span className="stat-lbl">Facturación</span>
                </div>
              </div>

              {/* Acciones */}
              <div className="tenant-card-actions">
                <button
                  type="button"
                  className="btn-edit-tenant"
                  onClick={() => handleOpenEdit(tenant)}
                >
                  <Edit3 size={15} />
                  <span>Editar Datos</span>
                </button>

                <button
                  type="button"
                  className="btn-storefront-link"
                  onClick={() => window.open(`/store/${tenant.codigo_empresa}`, '_blank')}
                  title="Abrir tienda en nueva pestaña"
                >
                  <ExternalLink size={14} />
                  <span>Visitar Tienda</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '1.5rem', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <SaasPagination
          currentPage={currentPage}
          totalItems={tenants.length}
          pageSize={TENANTS_PAGE_SIZE}
          onPageChange={(page) => setCurrentPage(page)}
          itemLabel="inquilinos"
        />
      </div>

      {/* Modal de Edición de Datos de Tenant */}
      {editingTenant && (
        <div className="modal-backdrop">
          <div className="modal-container-tenant">
            <div className="modal-header">
              <div className="modal-title-wrap">
                <Building2 size={20} className="text-indigo" />
                <h3 className="modal-title">Editar Datos del Inquilino: {editingTenant.nombre_comercial}</h3>
              </div>
              <button type="button" className="btn-modal-close" onClick={handleCloseEdit}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="modal-form">
              <div className="form-grid-2">
                <div className="form-field">
                  <label>Nombre Comercial</label>
                  <input
                    type="text"
                    value={formData.nombre_comercial}
                    onChange={(e) => setFormData({ ...formData, nombre_comercial: e.target.value })}
                    required
                  />
                </div>

                <div className="form-field">
                  <label>Razón Social (Jurídica)</label>
                  <input
                    type="text"
                    value={formData.razon_social}
                    onChange={(e) => setFormData({ ...formData, razon_social: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-field">
                  <label>Correo Electrónico de Contacto / Admin</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="form-field">
                  <label>Teléfono de Contacto</label>
                  <input
                    type="text"
                    value={formData.telefono || ''}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-field">
                  <label>NIT / Identificación Tributaria</label>
                  <input
                    type="text"
                    value={formData.nit || ''}
                    onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label>Ciudad</label>
                  <input
                    type="text"
                    value={formData.ciudad_nombre || ''}
                    onChange={(e) => setFormData({ ...formData, ciudad_nombre: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-field">
                <label>Dirección Física</label>
                <input
                  type="text"
                  value={formData.direccion || ''}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                />
              </div>

              <div className="form-grid-2">
                <div className="form-field">
                  <label>Plan de Suscripción</label>
                  <select
                    value={formData.planId}
                    onChange={(e) => handlePlanChange(e.target.value)}
                  >
                    <option value="PRUEBA">Plan Prueba ($0 USD)</option>
                    <option value="BASICO">Plan Básico ($29.90 USD)</option>
                    <option value="PREMIUM">Plan Premium ($69.90 USD)</option>
                    <option value="CORPORATIVO">Plan Corporativo ($149.90 USD)</option>
                    <option value="EMPRESARIAL">Plan Empresarial ($299.90 USD)</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Estado del Inquilino</label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value as any })}
                  >
                    <option value="ACTIVO">ACTIVO (En línea)</option>
                    <option value="PRUEBA">PRUEBA (Evaluación)</option>
                    <option value="SUSPENDIDO">SUSPENDIDO (Pausa / Mora)</option>
                  </select>
                </div>
              </div>

              <div className="form-field password-highlight">
                <label>
                  <KeyRound size={14} className="text-amber" />
                  <span>Reestablecer Contraseña Administrador del Tenant (Opcional):</span>
                </label>
                <input
                  type="password"
                  placeholder="Dejar en blanco para mantener contraseña actual"
                  value={formData.adminPassword || ''}
                  onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                />
                <span className="field-hint">
                  Si especificas una contraseña, se actualizará directamente en la base de datos física del tenant.
                </span>
              </div>

              <div className="modal-footer-actions">
                <button type="button" className="btn-cancel" onClick={handleCloseEdit}>
                  Cancelar
                </button>
                <button type="submit" className="btn-save" disabled={isSaving}>
                  <Check size={16} />
                  <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
