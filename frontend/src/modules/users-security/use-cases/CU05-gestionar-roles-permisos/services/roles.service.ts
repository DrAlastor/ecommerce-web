/**
 * @caso-de-uso CU05 — Gestionar roles y permisos
 * @subsistema Usuarios y Seguridad
 * @capa Service/Gateway — Frontend web
 * @responsabilidad Encapsula la comunicación con la API o integración externa y transforma su respuesta para la capa de presentación.
 * @secuencia Administrador -> vista de roles -> controlador de autorización -> servicio de roles -> Rol/Función/Acción/Permisos.
 */
import api from '../../../../../services/api/api';

export interface RoleItem {
  id_rol: number;
  nombre: string;
  permiso: string | null;
  total_usuarios: number;
  total_funciones: number;
}

export interface FunctionTreeItem {
  id_funcion: number;
  nombre: string;
  descripcion: string | null;
  id_modulo: number;
}

export interface ModuleTreeItem {
  id_modulo: number;
  nombre: string;
  descripcion: string | null;
  funciones: FunctionTreeItem[];
}

export interface AssignedFunctionItem {
  id_funcion: number;
  nombre: string;
  descripcion: string | null;
  id_modulo: number;
  modulo: string;
  nivel_acceso: 'Lectura' | 'Edicion' | 'Edición';
}

export interface RoleDetail {
  id_rol: number;
  nombre: string;
  permiso: string | null;
  total_usuarios: number;
  total_funciones: number;
  resumen_niveles: {
    lectura: number;
    edicion: number;
  };
  funciones: AssignedFunctionItem[];
}

export interface UpdateRolePermissionsPayload {
  permissions: Array<{
    id_funcion: number;
    nivel_acceso: string;
  }>;
}

export const rolesService = {
  async getRoles(): Promise<RoleItem[]> {
    const response = await api.get<RoleItem[]>('/users-security/roles');
    return response.data;
  },

  async getModulesTree(): Promise<ModuleTreeItem[]> {
    const response = await api.get<ModuleTreeItem[]>('/users-security/roles/modules-tree');
    return response.data;
  },

  async getRoleById(id: number): Promise<RoleDetail> {
    const response = await api.get<RoleDetail>(`/users-security/roles/${id}`);
    return response.data;
  },

  async updateRolePermissions(
    id: number,
    permissions: Array<{ id_funcion: number; nivel_acceso: string }>,
  ): Promise<RoleDetail> {
    const response = await api.put<RoleDetail>(
      `/users-security/roles/${id}/permissions`,
      { permissions },
    );
    return response.data;
  },
};
