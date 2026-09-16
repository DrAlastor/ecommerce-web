import api from '../../../../../services/api/api';

export interface BranchItem {
  id_sucursal: number;
  nombre: string;
  direccion: string;
  ciudad?: string;
  estado?: string;
}

export interface EmployeeRoleItem {
  id_rol: number;
  nombre: string;
  permiso?: string | null;
}

export interface EmployeeItem {
  id_empleado: number;
  codigo_empleado: string;
  ci: string;
  nombre: string;
  apellido: string;
  nombre_completo: string;
  telefono: string | null;
  fecha_contratacion: string;
  estado: 'activo' | 'inactivo';
  conectado?: boolean;
  email: string;
  id_rol: number;
  rol: string;
  sucursales: BranchItem[];
}

export interface QueryEmployeesParams {
  search?: string;
  rol?: number;
  sucursal?: number;
  estado?: 'activo' | 'inactivo';
  page?: number;
  limit?: number;
}

export interface PaginatedEmployeesResponse {
  data: EmployeeItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateEmployeePayload {
  email: string;
  password?: string;
  codigo_empleado: string;
  ci: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  fecha_contratacion: string;
  id_rol: number;
  sucursales: number[];
  estado?: 'activo' | 'inactivo';
}

export interface UpdateEmployeePayload {
  nombre?: string;
  apellido?: string;
  ci?: string;
  telefono?: string;
  fecha_contratacion?: string;
  id_rol?: number;
  email?: string;
  password?: string;
  sucursales?: number[];
  estado?: 'activo' | 'inactivo';
}

export const empleadosService = {
  async getEmployees(params?: QueryEmployeesParams): Promise<PaginatedEmployeesResponse> {
    const response = await api.get<PaginatedEmployeesResponse>('/users-security/employees', {
      params,
    });
    return response.data;
  },

  async getEmployeeById(id: number): Promise<EmployeeItem> {
    const response = await api.get<EmployeeItem>(`/users-security/employees/${id}`);
    return response.data;
  },

  async getBranches(): Promise<BranchItem[]> {
    const response = await api.get<BranchItem[]>('/users-security/employees/branches');
    return response.data;
  },

  async getEmployeeRoles(): Promise<EmployeeRoleItem[]> {
    const response = await api.get<EmployeeRoleItem[]>('/users-security/employees/roles');
    return response.data;
  },

  async createEmployee(payload: CreateEmployeePayload): Promise<EmployeeItem> {
    const response = await api.post<EmployeeItem>('/users-security/employees', payload);
    return response.data;
  },

  async updateEmployee(id: number, payload: UpdateEmployeePayload): Promise<EmployeeItem> {
    const response = await api.put<EmployeeItem>(`/users-security/employees/${id}`, payload);
    return response.data;
  },

  async updateEmployeeStatus(id: number, estado: 'activo' | 'inactivo'): Promise<EmployeeItem> {
    const response = await api.patch<EmployeeItem>(`/users-security/employees/${id}/status`, {
      estado,
    });
    return response.data;
  },
};
