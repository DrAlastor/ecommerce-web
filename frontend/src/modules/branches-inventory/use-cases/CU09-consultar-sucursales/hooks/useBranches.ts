import { useState, useEffect } from 'react';
import { branchService } from '../services/branch.service';
import type { Branch } from '../types/branch.types';

export function useBranches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchBranches = async () => {
    setIsLoading(true);
    try {
      const data = await branchService.getBranches();
      setBranches(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const filteredBranches = branches.filter((b) =>
    b.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.ciudad && b.ciudad.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return {
    branches: filteredBranches,
    allBranches: branches,
    isLoading,
    searchQuery,
    setSearchQuery,
    fetchBranches,
  };
}
