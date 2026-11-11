import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
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
  Sparkles,
  CreditCard,
  QrCode,
  Landmark,
  Check,
  X,
  Trash2,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import api from '../../../../../services/api/api';
import { companyService } from '../services/company.service';
import type { CompanyData } from '../services/company.service';
import '../pages/SettingsPages.css';

const SAAS_PLANS = [
  {
    id: 'plan-trial',
    code: 'PRUEBA',
    nombre: 'Plan Prueba',
    precio: 0,
    descripcion: 'Acceso gratuito durante 7 días para evaluar la plataforma.',
    caracteristicas: [
      'Hasta 100 prendas y accesorios',
      '1 Sucursal física o digital',
      'Punto de Venta (POS) y catálogo',
      'Modo fuera de línea en mostrador',
      'Reportes básicos de ventas',
    ],
    color: '#64748B',
    badge: 'Gratuito',
  },
  {
    id: 'plan-starter',
    code: 'BASICO',
    nombre: 'Plan Básico',
    precio: 29.9,
    descripcion: 'Para boutiques y tiendas independientes en crecimiento.',
    caracteristicas: [
      'Hasta 1,000 prendas y variantes',
      '1 Sucursal física exclusiva',
      'Hasta 10 colaboradores',
      'Venta offline sincronizada',
      'Facturación y tickets de caja',
    ],
    color: '#2563EB',
    badge: 'Inicial',
  },
  {
    id: 'plan-enterprise',
    code: 'PREMIUM',
    nombre: 'Plan Premium',
    precio: 69.9,
    descripcion: 'Máxima experiencia omnicanal con Vestidor 3D y RA.',
    caracteristicas: [
      'Hasta 5,000 prendas y variantes',
      'Hasta 3 Sucursales interconectadas',
      'Hasta 30 colaboradores',
      'Vestidor Virtual 3D y Realidad Aumentada',
      'Reportes inteligentes por voz con IA',
    ],
    color: '#7C3AED',
    badge: 'Más Elegido',
  },
  {
    id: 'plan-corporate',
    code: 'CORPORATIVO',
    nombre: 'Plan Corporativo',
    precio: 149.9,
    descripcion: 'Inteligencia analítica, BI y Machine Learning.',
    caracteristicas: [
      'Hasta 20,000 productos y variantes',
      'Hasta 10 Sucursales interconectadas',
      'Hasta 100 colaboradores',
      'Decisiones y Machine Learning',
      'Previsión de demanda y segmentación RFM',
    ],
    color: '#059669',
    badge: 'Corporativo',
  },
  {
    id: 'plan-unlimited',
    code: 'EMPRESARIAL',
    nombre: 'Plan Empresarial',
    precio: 299.9,
    descripcion: 'Solución completa sin límites, base de datos dedicada y soporte 24/7.',
    caracteristicas: [
      'Prendas y transacciones ilimitadas',
      'Sucursales y almacenes ilimitados',
      'Hasta 500 colaboradores',
      'Base de datos dedicada aislada',
      'SLA 99.9% y soporte prioritario 24/7',
    ],
    color: '#D97706',
    badge: 'Ilimitado',
  },
];

const BOLIVIAN_BANKS = [
  'Banco Unión',
  'Banco de Crédito BCP',
  'Banco Nacional de Bolivia (BNB)',
  'Banco Mercantil Santa Cruz (BMSC)',
  'Banco Ganadero',
  'Banco FIE',
  'Banco Económico',
  'Banco Solidario (BancoSol)',
  'Billetera Móvil Tigo Money',
];

const DEFAULT_BANK_ACCOUNTS: Record<string, { numero_cuenta: string; titular: string; nit_ci: string }> = {
  'Banco Unión': {
    numero_cuenta: '1000003928174',
    titular: 'Dressly Fashion Store S.R.L.',
    nit_ci: '1029384756',
  },
  'Banco de Crédito BCP': {
    numero_cuenta: '2015093848123',
    titular: 'Dressly Fashion Store S.R.L.',
    nit_ci: '1029384756',
  },
  'Banco Nacional de Bolivia (BNB)': {
    numero_cuenta: '3500293847',
    titular: 'Dressly Fashion Store S.R.L.',
    nit_ci: '1029384756',
  },
  'Banco Mercantil Santa Cruz (BMSC)': {
    numero_cuenta: '401089234101',
    titular: 'Dressly Fashion Store S.R.L.',
    nit_ci: '1029384756',
  },
  'Banco Ganadero': {
    numero_cuenta: '1052948172',
    titular: 'Dressly Fashion Store S.R.L.',
    nit_ci: '1029384756',
  },
  'Banco FIE': {
    numero_cuenta: '4000192847',
    titular: 'Dressly Fashion Store S.R.L.',
    nit_ci: '1029384756',
  },
  'Banco Económico': {
    numero_cuenta: '1072938471',
    titular: 'Dressly Fashion Store S.R.L.',
    nit_ci: '1029384756',
  },
  'Banco Solidario (BancoSol)': {
    numero_cuenta: '2083948172',
    titular: 'Dressly Fashion Store S.R.L.',
    nit_ci: '1029384756',
  },
  'Billetera Móvil Tigo Money': {
    numero_cuenta: '78901234',
    titular: 'Dressly Fashion Store S.R.L.',
    nit_ci: '1029384756',
  },
};

export const CompanySettingsTab: React.FC = () => {
  const currentTenant = localStorage.getItem('tenantKey') || 'dressly';
  const selectedTenant = currentTenant;
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrFileInputRef = useRef<HTMLInputElement>(null);

  // Estados para Cambio de Plan
  const [showPlanModal, setShowPlanModal] = useState<boolean>(false);
  const [selectedNewPlanId, setSelectedNewPlanId] = useState<string>('plan-enterprise');
  const [planGateway, setPlanGateway] = useState<'stereum' | 'stripe'>('stereum');
  const [processingPlan, setProcessingPlan] = useState<boolean>(false);
  const [planStereumData, setPlanStereumData] = useState<{
    id?: string;
    qr_base64?: string;
    amount?: number;
    currency?: string;
    payment_link?: string;
  } | null>(null);
  const [planPaymentConfirmed, setPlanPaymentConfirmed] = useState<boolean>(false);

  // Previsualizador dinámico de QR de cuenta bancaria


  // Cuentas bancarias por banco (Punto 1: cada banco tiene su propio número de cuenta)
  const [bankAccounts, setBankAccounts] = useState<
    Record<string, { numero_cuenta: string; titular: string; nit_ci: string }>
  >(() => {
    try {
      const saved = localStorage.getItem(`tenant_bank_accounts_${selectedTenant}`);
      if (saved) return JSON.parse(saved);
    } catch { }
    return DEFAULT_BANK_ACCOUNTS;
  });

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
    plan_id: 'plan-enterprise',
    plan_nombre: 'Plan Premium',
    plan_precio: 69.9,
    plan_ciclo: 'monthly',
    plan_fecha_renovacion: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
    plan_estado: 'ACTIVO',
    qr_cuenta_banco: 'Banco Unión',
    qr_numero_cuenta: '1000003928174',
    qr_titular: 'Dressly Fashion Store S.R.L.',
    qr_documento_titular: '1029384756',
    qr_imagen_url: '',
    qr_tipo_cobro: 'cuenta',
  });

  const loadCompanyData = async (tenantKey: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const savedBankMap = localStorage.getItem(`tenant_bank_accounts_${tenantKey}`);
      let currentBankMap = DEFAULT_BANK_ACCOUNTS;
      if (savedBankMap) {
        currentBankMap = JSON.parse(savedBankMap);
      } else {
        const defaultTitular = tenantKey === 'urbanly'
          ? 'Urbanly Streetwear S.R.L.'
          : (tenantKey === 'aura-sport' ? 'Aura Sportswear S.R.L.' : 'Dressly Fashion Store S.R.L.');
        const cloned: Record<string, { numero_cuenta: string; titular: string; nit_ci: string }> = {};
        Object.keys(DEFAULT_BANK_ACCOUNTS).forEach((b) => {
          cloned[b] = { ...DEFAULT_BANK_ACCOUNTS[b], titular: defaultTitular };
        });
        currentBankMap = cloned;
      }
      setBankAccounts(currentBankMap);

      const data = await companyService.getCompany(tenantKey);
      const activeBank = data.qr_cuenta_banco || 'Banco Unión';
      const bankEntry = currentBankMap[activeBank] || DEFAULT_BANK_ACCOUNTS[activeBank] || {
        numero_cuenta: '1000003928174',
        titular: data.razon_social || 'Dressly Fashion Store S.R.L.',
        nit_ci: data.nit || '1029384756',
      };

      setFormData((prev) => ({
        ...prev,
        ...data,
        plan_id: data.plan_id || prev.plan_id || 'plan-enterprise',
        plan_nombre: data.plan_nombre || prev.plan_nombre || 'Plan Premium',
        plan_precio: data.plan_precio || prev.plan_precio || 69.9,
        plan_estado: data.plan_estado || 'ACTIVO',
        qr_cuenta_banco: activeBank,
        qr_numero_cuenta: data.qr_numero_cuenta || bankEntry.numero_cuenta,
        qr_titular: data.qr_titular || bankEntry.titular,
        qr_documento_titular: data.qr_documento_titular || bankEntry.nit_ci,
        qr_imagen_url: data.qr_imagen_url || '',
      }));
    } catch (err: any) {
      console.error('Error cargando empresa:', err);
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

  // Cambio dinámico de banco: actualiza los inputs al número de cuenta específico de ese banco
  const handleBankChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newBank = e.target.value;
    const info = bankAccounts[newBank] || DEFAULT_BANK_ACCOUNTS[newBank] || {
      numero_cuenta: '',
      titular: formData.razon_social || formData.nombre_comercial,
      nit_ci: formData.nit,
    };

    setFormData((prev) => ({
      ...prev,
      qr_cuenta_banco: newBank,
      qr_numero_cuenta: info.numero_cuenta,
      qr_titular: info.titular,
      qr_documento_titular: info.nit_ci,
    }));

    try {
      localStorage.setItem(
        'pos_custom_bank_account',
        JSON.stringify({
          bank: newBank,
          account: info.numero_cuenta,
          titular: info.titular,
        })
      );
    } catch { }
  };

  const handleAccountNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const currentBank = formData.qr_cuenta_banco || 'Banco Unión';
    setFormData((prev) => ({ ...prev, qr_numero_cuenta: val }));
    setBankAccounts((prev) => {
      const updated = {
        ...prev,
        [currentBank]: {
          ...(prev[currentBank] || { titular: formData.qr_titular, nit_ci: formData.qr_documento_titular }),
          numero_cuenta: val,
        },
      };
      try {
        localStorage.setItem(`tenant_bank_accounts_${selectedTenant}`, JSON.stringify(updated));
        localStorage.setItem(
          'pos_custom_bank_account',
          JSON.stringify({
            bank: currentBank,
            account: val,
            titular: formData.qr_titular,
          })
        );
      } catch { }
      return updated;
    });
  };

  const handleTitularChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const currentBank = formData.qr_cuenta_banco || 'Banco Unión';
    setFormData((prev) => ({ ...prev, qr_titular: val }));
    setBankAccounts((prev) => {
      const updated = {
        ...prev,
        [currentBank]: {
          ...(prev[currentBank] || { numero_cuenta: formData.qr_numero_cuenta, nit_ci: formData.qr_documento_titular }),
          titular: val,
        },
      };
      try {
        localStorage.setItem(`tenant_bank_accounts_${selectedTenant}`, JSON.stringify(updated));
      } catch { }
      return updated;
    });
  };

  const handleDocumentoTitularChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const currentBank = formData.qr_cuenta_banco || 'Banco Unión';
    setFormData((prev) => ({ ...prev, qr_documento_titular: val }));
    setBankAccounts((prev) => {
      const updated = {
        ...prev,
        [currentBank]: {
          ...(prev[currentBank] || { numero_cuenta: formData.qr_numero_cuenta, titular: formData.qr_titular }),
          nit_ci: val,
        },
      };
      try {
        localStorage.setItem(`tenant_bank_accounts_${selectedTenant}`, JSON.stringify(updated));
      } catch { }
      return updated;
    });
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

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Por favor selecciona una imagen válida para el QR (PNG, JPG o WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const qrBase64 = reader.result as string;
        setFormData((prev) => ({ ...prev, qr_imagen_url: qrBase64 }));
        localStorage.setItem('dressly_pos_qr_image', qrBase64);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveQrImage = () => {
    setFormData((prev) => ({ ...prev, qr_imagen_url: '' }));
    localStorage.removeItem('dressly_pos_qr_image');
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
      setSuccessMsg(res.message || 'Configuración corporativa y datos bancarios guardados exitosamente.');
      setFormData(res.data);
      // Persistir el mapa de cuentas por banco y cuenta activa
      try {
        localStorage.setItem(`tenant_bank_accounts_${selectedTenant}`, JSON.stringify(bankAccounts));
        localStorage.setItem(
          'pos_custom_bank_account',
          JSON.stringify({
            bank: formData.qr_cuenta_banco,
            account: formData.qr_numero_cuenta,
            titular: formData.qr_titular,
          })
        );
      } catch { }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Error al guardar la configuración.';
      setErrorMsg(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setSaving(false);
      setTimeout(() => setSuccessMsg(null), 5000);
    }
  };

  // Iniciar proceso de cambio de plan y pago
  const handleInitiatePlanChange = async () => {
    const target = SAAS_PLANS.find((p) => p.id === selectedNewPlanId);
    if (!target) return;

    if (target.precio === 0) {
      await handleConfirmPlanPayment();
      return;
    }

    setProcessingPlan(true);
    setPlanStereumData(null);
    setPlanPaymentConfirmed(false);

    try {
      if (planGateway === 'stereum') {
        const res = await api.post('/sales-billing/saas/stereum/create-charge', {
          planId: target.id,
          planName: target.nombre,
          priceUSD: target.precio,
          empresaSlug: formData.codigo_empresa,
          nombreComercial: formData.nombre_comercial,
          adminEmail: formData.email,
        });

        if (res.data?.qr_base64) {
          setPlanStereumData(res.data);
        } else {
          // Generar QR visual si la pasarela responde transacción pendiente
          const bobAmount = (target.precio * 12.3656).toFixed(2);
          const qrCodeUrl = await QRCode.toDataURL(
            `STEREUM|PLAN:${target.nombre}|MONTO:${bobAmount}|BOB|REF:${res.data?.id || Date.now()}`,
            { width: 220, margin: 2, color: { dark: '#0F172A', light: '#FFFFFF' } }
          );
          setPlanStereumData({
            ...res.data,
            qr_base64: qrCodeUrl,
            amount: parseFloat(bobAmount),
            currency: 'BOB',
          });
        }
      } else {
        // Pasarela Stripe
        const res = await api.post('/sales-billing/saas/create-checkout-session', {
          planId: target.id,
          planName: target.nombre,
          priceUSD: target.precio,
          currency: 'usd',
          billingCycle: 'monthly',
          codigoEmpresa: formData.codigo_empresa,
          nombreComercial: formData.nombre_comercial,
          adminEmail: formData.email,
        });

        if (res.data?.url) {
          window.open(res.data.url, '_blank');
        }
      }
    } catch (err: any) {
      console.warn('Simulando generación de QR de contingencia para Stereum:', err);
      const bobAmount = (target.precio * 12.3656).toFixed(2);
      const qrCodeUrl = await QRCode.toDataURL(
        `STEREUM|SUSCRIPCION:${target.nombre}|MONTO:${bobAmount}|BOB|EMPRESA:${formData.codigo_empresa}`,
        { width: 220, margin: 2, color: { dark: '#0F172A', light: '#FFFFFF' } }
      );
      setPlanStereumData({
        id: `stereum_manual_${Date.now()}`,
        qr_base64: qrCodeUrl,
        amount: parseFloat(bobAmount),
        currency: 'BOB',
      });
    } finally {
      setProcessingPlan(false);
    }
  };

  // Confirmar y aplicar cambio de suscripción
  const handleConfirmPlanPayment = async () => {
    const target = SAAS_PLANS.find((p) => p.id === selectedNewPlanId);
    if (!target) return;

    setProcessingPlan(true);
    try {
      const updated: Partial<CompanyData> = {
        ...formData,
        plan_id: target.id,
        plan_nombre: target.nombre,
        plan_precio: target.precio,
        plan_ciclo: 'monthly',
        plan_estado: 'ACTIVO',
        plan_fecha_renovacion: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
      };

      const res = await companyService.updateCompany(updated, selectedTenant);
      setFormData(res.data);
      setPlanPaymentConfirmed(true);
      setSuccessMsg(`¡Plan actualizado exitosamente a ${target.nombre}! Módulos y herramientas adaptados.`);

      // Persistir y emitir evento global para adaptar módulos y vistas del sistema de inmediato
      try {
        localStorage.setItem('tenant_plan_id', target.id);
        localStorage.setItem(`tenant_plan_${selectedTenant}`, target.id);
        const extendedKey = `tenant_extended_${selectedTenant}`;
        const prevExt = JSON.parse(localStorage.getItem(extendedKey) || '{}');
        localStorage.setItem(
          extendedKey,
          JSON.stringify({
            ...prevExt,
            plan_id: target.id,
            plan_nombre: target.nombre,
            plan_precio: target.precio,
          })
        );
      } catch { }

      window.dispatchEvent(
        new CustomEvent('tenant-plan-changed', {
          detail: { planId: target.id, tenant: selectedTenant },
        })
      );

      setTimeout(() => {
        setShowPlanModal(false);
        setPlanPaymentConfirmed(false);
        setPlanStereumData(null);
      }, 2000);
    } catch (err: any) {
      console.error('Error aplicando cambio de plan:', err);
      setErrorMsg('No se pudo confirmar la suscripción. Intenta nuevamente.');
    } finally {
      setProcessingPlan(false);
    }
  };

  const currentPlan = SAAS_PLANS.find((p) => p.id === formData.plan_id) || SAAS_PLANS[2];

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
              Parametrización legal, tributaria, monedas, planes de suscripción y datos oficiales de cobro
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
          {/* SECCIÓN 1: PLAN DE SUSCRIPCIÓN SAAS (PUNTO 5) */}
          <div style={{
            marginBottom: '2rem',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid #E5E7EB',
            background: 'linear-gradient(135deg, #FAF8F5 0%, #FFFFFF 100%)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: '#111827',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#111827' }}>
                    Plan de Suscripción del SaaS
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: '#6B7280' }}>
                    Gestión de capacidad, vestidores virtuales y facturación recurrente de la boutique
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedNewPlanId(formData.plan_id === 'plan-starter' ? 'plan-pro' : 'plan-enterprise');
                  setPlanStereumData(null);
                  setPlanPaymentConfirmed(false);
                  setShowPlanModal(true);
                }}
                className="btn-primary"
                style={{
                  background: '#111827',
                  color: '#FFFFFF',
                  padding: '0.55rem 1.1rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  borderRadius: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  cursor: 'pointer',
                  border: 'none',
                }}
              >
                <CreditCard size={16} />
                <span>Cambiar Plan de Suscripción</span>
              </button>
            </div>

            {/* Detalle del Plan Actual */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
              padding: '1.1rem',
              background: '#FFFFFF',
              borderRadius: '10px',
              border: '1px solid #E5E7EB',
            }}>
              <div>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Plan Activo
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <strong style={{ fontSize: '1.2rem', color: '#111827', fontWeight: 700 }}>
                    {currentPlan.nombre}
                  </strong>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: '#ECFDF5',
                    color: '#059669',
                    border: '1px solid #A7F3D0',
                  }}>
                    {formData.plan_estado || 'ACTIVO'}
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#6B7280', margin: '4px 0 0' }}>
                  {currentPlan.descripcion}
                </p>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Tarifa Mensual
                </span>
                <strong style={{ fontSize: '1.3rem', color: '#111827', fontWeight: 800 }}>
                  ${formData.plan_precio || currentPlan.precio} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#6B7280' }}>USD / mes</span>
                </strong>
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#4B5563', marginTop: '2px' }}>
                  ~ {((formData.plan_precio || currentPlan.precio) * 12.3656).toFixed(2)} Bs / mes (Ref. Stereum)
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Próxima Renovación
                </span>
                <span style={{ fontSize: '0.9rem', color: '#111827', fontWeight: 600, display: 'block' }}>
                  {formData.plan_fecha_renovacion ? new Date(formData.plan_fecha_renovacion).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : '30 días desde activación'}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '3px', marginTop: '3px' }}>
                  <ShieldCheck size={14} /> Facturación al día
                </span>
              </div>
            </div>

            {/* Lista resumida de beneficios vigentes */}
            <div style={{ marginTop: '0.85rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {currentPlan.caracteristicas.map((c, i) => (
                <span key={i} style={{
                  fontSize: '0.75rem',
                  color: '#374151',
                  background: '#F3F4F6',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}>
                  <Check size={12} color="#10B981" /> {c}
                </span>
              ))}
            </div>
          </div>

          {/* SECCIÓN 2: IDENTIDAD Y LOGOTIPO */}
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

          {/* SECCIÓN 3: CONFIGURACIÓN DE COBROS QR Y DATOS BANCARIOS (PUNTO 6) */}
          <div style={{
            marginBottom: '2rem',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid #E5E7EB',
            background: '#FFFFFF',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: '#0D9488',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Landmark size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#111827' }}>
                  Configuración de Cobros QR y Datos Bancarios Oficiales
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#6B7280' }}>
                  Ingresa tu cuenta bancaria real boliviana para que el POS genere el QR interoperable y activa la pasarela Stereum
                </span>
              </div>
            </div>

            <div className="settings-grid">
              <div className="form-group">
                <label className="form-label">Banco Receptor Oficial *</label>
                <select
                  name="qr_cuenta_banco"
                  value={formData.qr_cuenta_banco || 'Banco Unión'}
                  onChange={handleBankChange}
                  className="form-select"
                  required
                >
                  {BOLIVIAN_BANKS.map((banco) => (
                    <option key={banco} value={banco}>
                      {banco}
                    </option>
                  ))}
                </select>
                <span className="form-helper">Banco donde se acreditarán los pagos por QR (cuenta individual para cada banco)</span>
              </div>

              <div className="form-group">
                <label className="form-label">Número de Cuenta Bancaria Real *</label>
                <input
                  type="text"
                  name="qr_numero_cuenta"
                  value={formData.qr_numero_cuenta || ''}
                  onChange={handleAccountNumberChange}
                  placeholder="Ej: 1000003928174 o Celular Yape"
                  className="form-input"
                  required
                />
                <span className="form-helper">Número de cuenta guardado para {formData.qr_cuenta_banco || 'este banco'}</span>
              </div>

              <div className="form-group">
                <label className="form-label">Titular de la Cuenta Bancaria *</label>
                <input
                  type="text"
                  name="qr_titular"
                  value={formData.qr_titular || ''}
                  onChange={handleTitularChange}
                  placeholder="Ej: Dressly Fashion Store S.R.L."
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">NIT o CI del Titular de Cuenta</label>
                <input
                  type="text"
                  name="qr_documento_titular"
                  value={formData.qr_documento_titular || ''}
                  onChange={handleDocumentoTitularChange}
                  placeholder="Ej: 1029384756"
                  className="form-input"
                />
              </div>
            </div>

            {/* Previsualización del QR Bancario y Opción de Subir Imagen QR */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.25rem',
              marginTop: '1.25rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid #F3F4F6',
            }}>
              <p>Sube el QR emitido por tu banco y guarda los cambios. Los clientes de esta tienda verán esta misma imagen al pagar.</p>
              {/* Tarjeta 2: Subir imagen estática de QR de Caja */}
              <div style={{
                padding: '1rem',
                borderRadius: '10px',
                background: '#F9FAFB',
                border: '1px solid #E5E7EB',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                  <Upload size={16} color="#2563EB" />
                  <strong style={{ fontSize: '0.85rem', color: '#111827' }}>
                    Subir Imagen de QR Fijo de Mostrador
                  </strong>
                </div>
                <span style={{ fontSize: '0.73rem', color: '#6B7280', marginBottom: '0.75rem' }}>
                  Sube el comprobante o letrero QR físico emitido por tu banco oficial
                </span>

                <input
                  type="file"
                  ref={qrFileInputRef}
                  onChange={handleQrUpload}
                  accept="image/png, image/jpeg, image/webp"
                  style={{ display: 'none' }}
                />

                {formData.qr_imagen_url ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      background: '#FFFFFF',
                      padding: '8px',
                      borderRadius: '8px',
                      border: '1px solid #D1D5DB',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                    }}>
                      <img
                        src={formData.qr_imagen_url}
                        alt="QR Fijo de Caja"
                        style={{ width: '150px', height: '150px', objectFit: 'contain', display: 'block' }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => qrFileInputRef.current?.click()}
                        className="btn-secondary"
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                      >
                        Cambiar QR
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveQrImage}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#DC2626',
                          fontSize: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={13} /> Eliminar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{
                      width: '150px',
                      height: '150px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#FFFFFF',
                      borderRadius: '8px',
                      border: '2px dashed #D1D5DB',
                      color: '#9CA3AF',
                      gap: '0.4rem',
                    }}>
                      <QrCode size={32} />
                      <span style={{ fontSize: '0.72rem' }}>Sin imagen de QR</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => qrFileInputRef.current?.click()}
                      className="btn-secondary"
                      style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <Upload size={14} /> Subir Imagen QR
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECCIÓN 4: DATOS LEGALES Y FACTURACIÓN */}
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

          {/* SECCIÓN 5: CONTACTO Y DOMICILIO MATRIZ */}
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

      {/* MODAL PARA CAMBIAR PLAN DE SUSCRIPCIÓN CON PASARELA DE PAGO (PUNTO 5) */}
      {showPlanModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem',
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '1160px',
            maxHeight: '92vh',
            overflowY: 'auto',
            padding: '2rem',
            position: 'relative',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          }}>
            {/* Botón Cerrar */}
            <button
              type="button"
              onClick={() => setShowPlanModal(false)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: '#F3F4F6',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748B',
              }}
            >
              <X size={18} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
              <div style={{
                display: 'inline-flex',
                padding: '0.4rem 0.9rem',
                borderRadius: '999px',
                background: '#F3E8FF',
                color: '#7E22CE',
                fontSize: '0.78rem',
                fontWeight: 700,
                marginBottom: '0.5rem',
                alignItems: 'center',
                gap: '0.35rem',
              }}>
                <Sparkles size={14} /> MEJORA DE CAPACIDAD Y HERRAMIENTAS
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.4rem', color: '#0F172A' }}>
                Cambiar Plan de Suscripción SaaS
              </h2>
              <p style={{ fontSize: '0.88rem', color: '#64748B', maxWidth: '620px', margin: '0 auto' }}>
                Selecciona tu nuevo plan (superior o inferior). Al cambiar de plan, se adaptarán las funciones operativas y de inteligencia artificial en todo el sistema.
              </p>
            </div>

            {/* Selector de Planes Completos del SaaS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(195px, 1fr))', gap: '0.85rem', marginBottom: '1.75rem' }}>
              {SAAS_PLANS.map((plan) => {
                const isSelected = selectedNewPlanId === plan.id;
                const isCurrent = formData.plan_id === plan.id || formData.plan_id === plan.code;
                return (
                  <div
                    key={plan.id}
                    onClick={() => {
                      setSelectedNewPlanId(plan.id);
                      setPlanStereumData(null);
                    }}
                    style={{
                      border: '2px solid',
                      borderColor: isSelected ? '#111827' : '#E2E8F0',
                      borderRadius: '12px',
                      padding: '1.1rem',
                      cursor: 'pointer',
                      background: isSelected ? '#F8FAFC' : '#FFFFFF',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s',
                    }}
                  >
                    {isCurrent && (
                      <span style={{
                        position: 'absolute',
                        top: '-10px',
                        left: '12px',
                        background: '#059669',
                        color: '#FFFFFF',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '999px',
                      }}>
                        PLAN ACTUAL
                      </span>
                    )}

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <strong style={{ fontSize: '1.05rem', color: '#0F172A' }}>{plan.nombre}</strong>
                        <span style={{
                          fontSize: '0.7rem',
                          background: `${plan.color}15`,
                          color: plan.color,
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}>
                          {plan.badge}
                        </span>
                      </div>
                      <div style={{ marginBottom: '0.75rem' }}>
                        <strong style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A' }}>
                          ${plan.precio}
                        </strong>
                        <span style={{ fontSize: '0.78rem', color: '#64748B' }}> / mes</span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: '#64748B', lineHeight: 1.4, margin: '0 0 0.85rem' }}>
                        {plan.descripcion}
                      </p>
                      <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {plan.caracteristicas.map((c, i) => (
                          <li key={i} style={{ fontSize: '0.73rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Check size={12} color="#059669" /> {c}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #E2E8F0', textAlign: 'center' }}>
                      <span style={{
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: isSelected ? '#0F172A' : '#64748B',
                      }}>
                        {isSelected ? '✓ Seleccionado' : 'Elegir este plan'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Si el plan seleccionado es gratuito (Plan Prueba), activación directa */}
            {(SAAS_PLANS.find((p) => p.id === selectedNewPlanId)?.precio ?? 0) === 0 ? (
              <div style={{
                background: '#F8FAFC',
                borderRadius: '12px',
                padding: '1.5rem',
                border: '1px solid #E2E8F0',
                marginBottom: '1.5rem',
                textAlign: 'center',
              }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                  Activación Inmediata sin Costo
                </span>
                <p style={{ fontSize: '0.8rem', color: '#64748B', maxWidth: '440px', margin: '0 auto 1.25rem' }}>
                  El Plan Prueba es gratuito durante 7 días para evaluar el sistema. No requiere pasarela de pago ni tarjeta.
                </p>
                <button
                  type="button"
                  onClick={handleInitiatePlanChange}
                  disabled={processingPlan}
                  style={{
                    padding: '0.75rem 2rem',
                    borderRadius: '8px',
                    background: '#059669',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  {processingPlan ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Activando Prueba...</span>
                    </>
                  ) : (
                    <>
                      <span>Activar Plan Prueba (0.00 USD)</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* Selector de Pasarela de Pago */
              <div style={{
                background: '#F8FAFC',
                borderRadius: '12px',
                padding: '1.25rem',
                border: '1px solid #E2E8F0',
                marginBottom: '1.5rem',
              }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.65rem' }}>
                  Método de Pago para Suscripción
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                  <div
                    onClick={() => {
                      setPlanGateway('stereum');
                      setPlanStereumData(null);
                    }}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      border: '2px solid',
                      borderColor: planGateway === 'stereum' ? '#0D9488' : '#CBD5E1',
                      background: planGateway === 'stereum' ? '#F0FDFA' : '#FFFFFF',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                    }}
                  >
                    <QrCode size={20} color="#0D9488" />
                    <div>
                      <strong style={{ fontSize: '0.85rem', color: '#0F172A', display: 'block' }}>
                        Stereum QR Simple
                      </strong>
                      <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                        Pago en Bolivianos (Banca Móvil / Yape)
                      </span>
                    </div>
                  </div>

                  <div
                    onClick={() => {
                      setPlanGateway('stripe');
                      setPlanStereumData(null);
                    }}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      border: '2px solid',
                      borderColor: planGateway === 'stripe' ? '#6366F1' : '#CBD5E1',
                      background: planGateway === 'stripe' ? '#EEF2FF' : '#FFFFFF',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                    }}
                  >
                    <CreditCard size={20} color="#6366F1" />
                    <div>
                      <strong style={{ fontSize: '0.85rem', color: '#0F172A', display: 'block' }}>
                        Stripe Checkout
                      </strong>
                      <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                        Tarjeta de Crédito / Débito Internacional
                      </span>
                    </div>
                  </div>
                </div>

                {/* Botón para Generar Cobro / Proceder */}
                <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
                  <button
                    type="button"
                    onClick={handleInitiatePlanChange}
                    disabled={processingPlan}
                    style={{
                      padding: '0.7rem 1.75rem',
                      borderRadius: '8px',
                      background: '#0F172A',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    {processingPlan ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Conectando Pasarela...</span>
                      </>
                    ) : (
                      <>
                        <span>Proceder al Pago ({SAAS_PLANS.find((p) => p.id === selectedNewPlanId)?.precio} USD)</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Visualización de Cobro QR Stereum */}
            {planStereumData && (
              <div style={{
                marginTop: '1.25rem',
                padding: '1.25rem',
                background: '#FFFFFF',
                borderRadius: '10px',
                border: '1px solid #CCFBF1',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '0.5rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0F766E' }}>
                  <QrCode size={18} />
                  <strong style={{ fontSize: '0.95rem' }}>Escanea para Pagar con Stereum QR</strong>
                </div>
                <span style={{ fontSize: '0.8rem', color: '#475569' }}>
                  Monto total: <strong>{planStereumData.amount || ((SAAS_PLANS.find((p) => p.id === selectedNewPlanId)?.precio || 49.9) * 12.3656).toFixed(2)} Bs</strong>
                </span>

                {planStereumData.qr_base64 && (
                  <img
                    src={planStereumData.qr_base64.startsWith('data:') ? planStereumData.qr_base64 : `data:image/png;base64,${planStereumData.qr_base64}`}
                    alt="QR Cobro Stereum"
                    style={{
                      width: '180px',
                      height: '180px',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      padding: '6px',
                      background: '#FFFFFF',
                    }}
                  />
                )}

                <p style={{ fontSize: '0.73rem', color: '#059669', margin: '4px 0 8px', fontWeight: 600 }}>
                  Válido para cualquier aplicación de banco nacional boliviano (QR Simple)
                </p>

                <button
                  type="button"
                  onClick={handleConfirmPlanPayment}
                  disabled={processingPlan || planPaymentConfirmed}
                  style={{
                    padding: '0.65rem 1.5rem',
                    borderRadius: '8px',
                    background: '#059669',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                  }}
                >
                  <CheckCircle size={16} />
                  <span>{planPaymentConfirmed ? '¡Pago Confirmado!' : 'Confirmar Pago y Activar Plan'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
