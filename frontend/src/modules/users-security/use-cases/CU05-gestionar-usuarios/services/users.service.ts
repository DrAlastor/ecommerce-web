import axios from 'axios';

const API_URL = '/api/users-security/users';

export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: number;
  status?: string;
}

export const usersService = {
  getUsers: async (params: UserListParams) => {
    const token = localStorage.getItem('accessToken');
    const { data } = await axios.get(API_URL, {
      params,
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  getUser: async (id: number) => {
    const token = localStorage.getItem('accessToken');
    const { data } = await axios.get(`${API_URL}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  updateStatus: async (id: number, estado: string) => {
    const token = localStorage.getItem('accessToken');
    const { data } = await axios.patch(
      `${API_URL}/${id}/status`,
      { estado },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return data;
  },

  updateUserAdminData: async (id: number, updateData: { email?: string; id_rol?: number }) => {
    const token = localStorage.getItem('accessToken');
    const { data } = await axios.put(`${API_URL}/${id}`, updateData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },
};
