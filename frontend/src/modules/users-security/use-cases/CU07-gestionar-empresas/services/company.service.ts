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
}

export const companyService = {
  async getCompany(tenant?: string): Promise<CompanyData> {
    const res = await api.get<CompanyData>('/users-security/company', {
      params: tenant ? { tenant } : undefined,
    });
    return res.data;
  },

  async updateCompany(data: Partial<CompanyData>, tenant?: string): Promise<{ success: boolean; message: string; data: CompanyData }> {
    const res = await api.put<{ success: boolean; message: string; data: CompanyData }>(
      '/users-security/company',
      data,
      {
        params: tenant ? { tenant } : undefined,
      }
    );
    return res.data;
  },

  async getAllCompanies(): Promise<CompanyData[]> {
    const res = await api.get<CompanyData[]>('/users-security/company/all');
    return res.data;
  },
};
