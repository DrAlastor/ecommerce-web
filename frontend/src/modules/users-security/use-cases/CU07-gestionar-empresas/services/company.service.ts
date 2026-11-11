import api from '../../../../../services/api/api';

export interface CompanyData {
  codigo_empresa: string;
  razon_social: string;
  nombre_comercial: string;
  nit: string;
  pais: string;
  moneda_principal: string;
  moneda_secundaria: string;
  email: string;
  telefono: string;
  ciudad_nombre: string;
  direccion: string;
  estado: string;
  logo_url: string;
  fecha_modificacion?: string;
  plan_id?: string;
  plan_nombre?: string;
  plan_precio?: number;
  plan_ciclo?: string;
  plan_fecha_renovacion?: string;
  plan_estado?: string;
  qr_cuenta_banco?: string;
  qr_numero_cuenta?: string;
  qr_titular?: string;
  qr_documento_titular?: string;
  qr_imagen_url?: string;
  qr_tipo_cobro?: string;
}

export const companyService = {
  async getCompany(tenant?: string): Promise<CompanyData> {
    const rawTenant = tenant || localStorage.getItem('tenantKey') || 'dressly';
    const activeTenant = rawTenant === 'subversive-urban' || rawTenant === 'subversive'
      ? 'urbanly'
      : (rawTenant === 'aura' ? 'aura-sport' : (rawTenant === 'fashionstore' ? 'dressly' : rawTenant));

    let baseData: CompanyData;
    try {
      const res = await api.get<CompanyData>('/users-security/company', {
        params: { tenant: activeTenant },
      });
      baseData = res.data;
    } catch {
      baseData = {
        codigo_empresa: activeTenant,
        razon_social: activeTenant === 'urbanly' ? 'Urbanly Streetwear Bolivia S.A.' : 'Dressly Fashion Store S.R.L.',
        nombre_comercial: activeTenant === 'urbanly' ? 'Urbanly' : 'Dressly Fashion Store',
        nit: '1029384756',
        pais: 'Bolivia',
        moneda_principal: 'BOB',
        moneda_secundaria: 'USD',
        email: `contacto@${activeTenant}.com`,
        telefono: '+591 3 3456789',
        ciudad_nombre: 'Santa Cruz de la Sierra',
        direccion: 'Av. San Martín #450, Equipetrol',
        estado: 'ACTIVO',
        logo_url: activeTenant === 'urbanly' ? '/logo-urbanly.jpg' : '/logo.jpg',
      };
    }

    // Cargar datos extendidos persistidos localmente (Plan y Cuenta Bancaria / QR)
    let extended: Partial<CompanyData> = {};
    try {
      const savedExtended = localStorage.getItem(`tenant_extended_${activeTenant}`);
      if (savedExtended) {
        extended = JSON.parse(savedExtended);
      }
    } catch {}

    // Fallbacks inteligentes por tenant si no están definidos
    const defaultBank = activeTenant === 'urbanly'
      ? 'Banco Nacional de Bolivia (BNB)'
      : (activeTenant === 'aura-sport' ? 'Banco de Crédito BCP' : 'Banco Unión');

    return {
      plan_id: 'plan-enterprise',
      plan_nombre: 'Plan Premium',
      plan_precio: 69.9,
      plan_ciclo: 'monthly',
      plan_estado: 'ACTIVO',
      qr_cuenta_banco: defaultBank,
      qr_numero_cuenta: '1000003928174',
      qr_titular: baseData.nombre_comercial || 'Fashion Store S.R.L.',
      qr_documento_titular: baseData.nit || '1029384756',
      qr_imagen_url: localStorage.getItem('dressly_pos_qr_image') || '',
      qr_tipo_cobro: 'cuenta',
      ...extended,
      ...baseData,
    };
  },

  async updateCompany(data: Partial<CompanyData>, tenant?: string): Promise<{ success: boolean; message: string; data: CompanyData }> {
    const rawTenant = tenant || data.codigo_empresa || localStorage.getItem('tenantKey') || 'dressly';
    const activeTenant = rawTenant === 'subversive-urban' || rawTenant === 'subversive'
      ? 'urbanly'
      : (rawTenant === 'aura' ? 'aura-sport' : (rawTenant === 'fashionstore' ? 'dressly' : rawTenant));

    // Persistir datos extendidos de Plan y QR en localStorage
    const extendedFields: Partial<CompanyData> = {
      plan_id: data.plan_id,
      plan_nombre: data.plan_nombre,
      plan_precio: data.plan_precio,
      plan_ciclo: data.plan_ciclo,
      plan_fecha_renovacion: data.plan_fecha_renovacion,
      plan_estado: data.plan_estado,
      qr_cuenta_banco: data.qr_cuenta_banco,
      qr_numero_cuenta: data.qr_numero_cuenta,
      qr_titular: data.qr_titular,
      qr_documento_titular: data.qr_documento_titular,
      qr_imagen_url: data.qr_imagen_url,
      qr_tipo_cobro: data.qr_tipo_cobro,
    };

    try {
      const existingStr = localStorage.getItem(`tenant_extended_${activeTenant}`);
      const mergedExtended = {
        ...(existingStr ? JSON.parse(existingStr) : {}),
        ...extendedFields,
      };
      localStorage.setItem(`tenant_extended_${activeTenant}`, JSON.stringify(mergedExtended));
    } catch {}

    // Sincronizar cuenta bancaria con POS para cobros inmediatos
    if (data.qr_numero_cuenta) {
      localStorage.setItem(
        'pos_custom_bank_account',
        JSON.stringify({
          bank: data.qr_cuenta_banco || 'Banco Unión',
          account: data.qr_numero_cuenta,
          titular: data.qr_titular || data.nombre_comercial,
        })
      );
    }
    if (data.qr_imagen_url) {
      localStorage.setItem('dressly_pos_qr_image', data.qr_imagen_url);
    }

    // Filtrar estrictamente solo las claves base permitidas por el backend en Azure
    // para evitar el error de ValidationPipe ("property ... should not exist")
    const ALLOWED_BACKEND_KEYS: (keyof CompanyData)[] = [
      'codigo_empresa',
      'razon_social',
      'nombre_comercial',
      'nit',
      'pais',
      'moneda_principal',
      'moneda_secundaria',
      'email',
      'telefono',
      'ciudad_nombre',
      'direccion',
      'logo_url',
      'qr_imagen_url',
      'qr_cuenta_banco',
      'qr_numero_cuenta',
      'qr_titular',
      'qr_documento_titular',
      'qr_tipo_cobro',
    ];

    const backendPayload: Record<string, any> = {};
    for (const key of ALLOWED_BACKEND_KEYS) {
      if (data[key] !== undefined && data[key] !== null) {
        backendPayload[key] = data[key];
      }
    }

    let returnedCompany: CompanyData;
    try {
      const res = await api.put<{ success: boolean; message: string; data: CompanyData }>(
        '/users-security/company',
        backendPayload,
        {
          params: { tenant: activeTenant },
        }
      );
      returnedCompany = res.data?.data || res.data;
    } catch (err) {
      throw err;
    }

    const fullResult: CompanyData = {
      ...returnedCompany,
      ...data,
      ...extendedFields,
      codigo_empresa: activeTenant,
    };

    return {
      success: true,
      message: 'Configuración corporativa y datos bancarios guardados exitosamente.',
      data: fullResult,
    };
  },

  async getAllCompanies(): Promise<CompanyData[]> {
    const res = await api.get<CompanyData[]>('/users-security/company/all');
    return res.data;
  },
};
