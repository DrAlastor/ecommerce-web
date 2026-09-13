import api from '../../../../../services/api/api';

const API_URL = '/users-security/users';

export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: number;
  status?: string;
}

export const usersService = {
  getUsers: async (params: UserListParams) => {
    const { data } = await api.get(API_URL, {
      params,
    });
    return data;
  },

  getUser: async (id: number) => {
    const { data } = await api.get(`${API_URL}/${id}`);
    return data;
  },

  updateStatus: async (id: number, estado: string) => {
    const { data } = await api.patch(
      `${API_URL}/${id}/status`,
      { estado },
    );
    return data;
  },

  updateUserAdminData: async (id: number, updateData: { email?: string; id_rol?: number }) => {
    const { data } = await api.put(`${API_URL}/${id}`, updateData);
    return data;
  },
};
