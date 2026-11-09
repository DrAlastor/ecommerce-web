import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  Save,
  Globe,
  MapPin,
  CheckCircle,
  AlertCircle,
  Upload,
  RefreshCw,
  Store,
} from 'lucide-react';
import { companyService } from '../services/company.service';
import type { CompanyData } from '../services/company.service';
import '../pages/SettingsPages.css';

export const CompanySettingsTab: React.FC = () => {
  const currentTenant = localStorage.getItem('tenantKey') || 'dressly';
  const selectedTenant = currentTenant;
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<CompanyData>({
    codigo_empresa: 'dressly',
    razon_social: 'Dressly Fashion Store S.R.L.',
    nombre_comercial: 'Dressly Fashion Store',
    nit: '1029384756',
    pais: 'Bolivia',
    moneda_principal: 'BOB',
    moneda_secundaria: 'USD',
    email: 'contacto@dressly.com',
    telefono: '+591 3 3456789',
    ciudad_nombre: 'Santa Cruz de la Sierra',
    direccion: 'Av. San Martín #450, Equipetrol',
    estado: 'ACTIVO',
    logo_url: '/logo.jpg',
  });

  const loadCompanyData = async (tenantKey: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await companyService.getCompany(tenantKey);
      setFormData(data);
    } catch (err: any) {
      console.error('Error cargando empresa:', err);
      // Fallback a defaults coherentes según el tenant
      if (tenantKey === 'aura-sport') {
        setFormData({
          codigo_empresa: 'aura-sport',
          razon_social: 'Aura Athletics Ropa Deportiva S.R.L.',
          nombre_comercial: 'Aura Athletics',
          nit: '2049581023',
          pais: 'Bolivia',
          moneda_principal: 'BOB',
          moneda_secundaria: 'USD',
          email: 'soporte@aura-athletics.com',
          telefono: '+591 3 3998877',
          ciudad_nombre: 'Santa Cruz de la Sierra',
          direccion: 'Av. Cristobal de Mendoza #820',
          estado: 'ACTIVO',
          logo_url: '/logo-aura.jpg',
        });
      } else if (tenantKey === 'urbanly') {
        setFormData({
          codigo_empresa: 'urbanly',
          razon_social: 'Urbanly Streetwear Bolivia S.A.',
          nombre_comercial: 'Urbanly',
          nit: '3058492014',
          pais: 'Bolivia',
          moneda_principal: 'BOB',
          moneda_secundaria: 'USD',
          email: 'contacto@urbanly.com',
          telefono: '+591 3 3112233',
          ciudad_nombre: 'Santa Cruz de la Sierra',
          direccion: 'Calle René Moreno #320',
          estado: 'ACTIVO',
          logo_url: '/logo-urbanly.jpg',
        });
      } else {
        setFormData({
          codigo_empresa: 'dressly',
          razon_social: 'Dressly Fashion Store S.R.L.',
          nombre_comercial: 'Dressly Fashion Store',
          nit: '1029384756',
          pais: 'Bolivia',
          moneda_principal: 'BOB',
          moneda_secundaria: 'USD',
          email: 'contacto@dressly.com',
          telefono: '+591 3 3456789',
          ciudad_nombre: 'Santa Cruz de la Sierra',
          direccion: 'Av. San Martín #450, Equipetrol',
          estado: 'ACTIVO',
          logo_url: '/logo.jpg',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanyData(selectedTenant);
  }, [selectedTenant]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('El archivo seleccionado debe ser una imagen válida (JPG, PNG o WEBP).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('El archivo de logotipo excede el tamaño máximo permitido (2 MB).');
      return;
    }

    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormData((prev) => ({ ...prev, logo_url: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!formData.nit || formData.nit.length < 5) {
      setErrorMsg('El NIT ingresado no cumple con el formato tributario legal (mínimo 5 caracteres).');
      return;
    }

    setSaving(true);
    try {
      const res = await companyService.updateCompany(formData, selectedTenant);
      setSuccessMsg(res.message || 'Configuración corporativa guardada exitosamente.');
      setFormData(res.data);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Error al guardar la configuración.';
      setErrorMsg(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setSaving(false);
      setTimeout(() => setSuccessMsg(null), 5000);
    }
  };

  return (
    <div className="settings-card">
      {/* Header & Tenant Switcher */}
      <div className="settings-header">
        <div className="settings-header-info">
          <div className="settings-header-icon">
            <Building2 size={24} />
          </div>
          <div>
            <div className="settings-title-row">
              <h2 className="settings-title">Configuración de la Empresa</h2>
              <span className="settings-status-badge">{formData.estado}</span>
            </div>
            <p className="settings-subtitle">
              Parametrización legal, tributaria, monedas y datos oficiales del inquilino comercial
            </p>
          </div>
        </div>

        {/* Indicador de Inquilino Activo */}
        <div className="current-tenant-badge">
          <Store size={16} />
          <span>Inquilino: <strong>{formData.nombre_comercial || 'Dressly Fashion Store'}</strong></span>
        </div>
      </div>

      {/* Alertas */}
      {errorMsg && (
        <div className="settings-alert settings-alert-error">
          <AlertCircle size={20} />
          <div>{errorMsg}</div>
        </div>
      )}

      {successMsg && (
        <div className="settings-alert settings-alert-success">
          <CheckCircle size={20} />
          <div>{successMsg}</div>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', gap: '0.75rem', color: '#736B63' }}>
          <RefreshCw size={24} className="animate-spin" />
          <span>Cargando datos corporativos...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {/* Sección 1: Logotipo y Marca */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 className="settings-section-title">
              <Store size={18} />
              Identidad de Marca y Logotipo Oficial
            </h3>
            <div className="logo-uploader-card">
              <div className="logo-preview-box">
                {formData.logo_url ? (
                  <img
                    src={formData.logo_url}
                    alt="Logo oficial"
                    className="logo-preview-img"
                  />
                ) : (
                  <span style={{ fontSize: '0.8rem', color: '#8C827A' }}>Sin Logotipo</span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: '220px' }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                  accept="image/png, image/jpeg, image/webp"
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-secondary"
                  style={{ marginBottom: '0.5rem' }}
                >
                  <Upload size={16} />
                  Subir Nuevo Logotipo (JPG / PNG)
                </button>
                <div className="form-helper">
                  Recomendado: Formato JPG o PNG, fondo transparente o blanco, resolución 400x120px, máx. 2MB.
                </div>
              </div>
            </div>
          </div>

          {/* Sección 2: Identificación Legal y Tributaria */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 className="settings-section-title">
              <Globe size={18} />
              Datos Legales y Facturación
            </h3>
            <div className="settings-grid">
              <div className="form-group">
                <label className="form-label">Razón Social</label>
                <input
                  type="text"
                  name="razon_social"
                  value={formData.razon_social}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nombre Comercial</label>
                <input
                  type="text"
                  name="nombre_comercial"
                  value={formData.nombre_comercial}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">NIT / Identificación Tributaria</label>
                <input
                  type="text"
                  name="nit"
                  value={formData.nit}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
                <span className="form-helper">Requerido para la emisión de facturas y notas de crédito</span>
              </div>

              <div className="form-group">
                <label className="form-label">País Sede</label>
                <select
                  name="pais"
                  value={formData.pais}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="Bolivia">Bolivia</option>
                  <option value="Chile">Chile</option>
                  <option value="Perú">Perú</option>
                  <option value="Colombia">Colombia</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Moneda Principal (Catálogo y POS)</label>
                <select
                  name="moneda_principal"
                  value={formData.moneda_principal}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="BOB">BOB — Bolivianos (Bs.)</option>
                  <option value="USD">USD — Dólares Americanos ($)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Moneda Secundaria (Stripe / Conversión)</label>
                <select
                  name="moneda_secundaria"
                  value={formData.moneda_secundaria}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="USD">USD — Dólares Americanos ($)</option>
                  <option value="BOB">BOB — Bolivianos (Bs.)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sección 3: Contacto y Dirección Matriz */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h3 className="settings-section-title">
              <MapPin size={18} />
              Contacto y Domicilio Matriz
            </h3>
            <div className="settings-grid">
              <div className="form-group">
                <label className="form-label">Correo Electrónico Oficial</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Teléfono / WhatsApp de Atención</label>
                <input
                  type="text"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Ciudad Principal</label>
                <input
                  type="text"
                  name="ciudad_nombre"
                  value={formData.ciudad_nombre}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Dirección Matriz</label>
                <input
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
            </div>
          </div>

          {/* Barra de Guardado */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color, #E5E0D8)' }}>
            <button
              type="button"
              onClick={() => loadCompanyData(selectedTenant)}
              className="btn-secondary"
              disabled={saving}
            >
              <RefreshCw size={16} />
              Restablecer
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={saving}
            >
              <Save size={16} />
              {saving ? 'Guardando Cambios...' : 'Guardar Configuración'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
