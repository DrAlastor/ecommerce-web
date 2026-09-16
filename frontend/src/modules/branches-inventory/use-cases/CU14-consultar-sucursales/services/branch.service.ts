import api from '../../../../../services/api/api';
import type { Branch } from '../types/branch.types';

export const branchService = {
  async getBranches(): Promise<Branch[]> {
    try {
      const response = await api.get('/branches');
      return response.data;
    } catch {
      return [];
    }
  },
};
