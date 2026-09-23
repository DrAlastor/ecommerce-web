/**
 * @caso-de-uso CU14 — Consultar sucursales
 * @subsistema Sucursales e Inventario
 * @capa Control (presentación) — Frontend web
 * @responsabilidad Coordina estado, validaciones y acciones de la interfaz antes de delegar la operación al servicio o API.
 * @secuencia Cliente -> listado de sucursales -> controlador de consulta -> servicio de sucursales -> Ciudad/Sucursal/Disponibilidad.
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { branchesPublicService } from '../services/branchesPublic.service';
import type { PublicBranch, PublicCity } from '../types/branchesPublic.types';

export function isBranchOpenNow(openTime?: string | null, closeTime?: string | null): {
  isOpen: boolean;
  message: string;
} {
  if (!openTime || !closeTime) {
    return { isOpen: true, message: 'Consultar horario en tienda' };
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [openH, openM] = openTime.split(':').map(Number);
  const [closeH, closeM] = closeTime.split(':').map(Number);

  const startMinutes = openH * 60 + (openM || 0);
  const endMinutes = closeH * 60 + (closeM || 0);

  if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
    return {
      isOpen: true,
      message: `Abierto hoy hasta las ${closeTime}`,
    };
  } else {
    return {
      isOpen: false,
      message: `Cerrado ahora (Abre a las ${openTime})`,
    };
  }
}

export function useBranches() {
  const [branches, setBranches] = useState<PublicBranch[]>([]);
  const [cities, setCities] = useState<PublicCity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranchForModal, setSelectedBranchForModal] = useState<PublicBranch | null>(null);
  const [copiedPhoneId, setCopiedPhoneId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [citiesData, branchesData] = await Promise.all([
        branchesPublicService.getActiveCities(),
        branchesPublicService.getActiveBranches(),
      ]);
      setCities(citiesData);
      setBranches(branchesData);
    } catch (err: any) {
      console.error('Error al cargar sucursales:', err);
      setError('No pudimos cargar la información de las sucursales. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredBranches = useMemo(() => {
    return branches.filter((branch) => {
      if (selectedCityId && branch.id_ciudad !== selectedCityId) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = branch.nombre.toLowerCase().includes(query);
        const matchCity = branch.ciudad.nombre.toLowerCase().includes(query);
        const matchAddress = branch.direccion.toLowerCase().includes(query);
        return matchName || matchCity || matchAddress;
      }
      return true;
    });
  }, [branches, selectedCityId, searchQuery]);

  const handleCopyPhone = useCallback((branch: PublicBranch, e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(branch.telefono);
      setCopiedPhoneId(branch.id_sucursal);
      setTimeout(() => setCopiedPhoneId(null), 2000);
    }
  }, []);

  const handleResetFilters = useCallback(() => {
    setSelectedCityId(null);
    setSearchQuery('');
  }, []);

  return {
    branches,
    cities,
    filteredBranches,
    loading,
    error,
    selectedCityId,
    setSelectedCityId,
    searchQuery,
    setSearchQuery,
    selectedBranchForModal,
    setSelectedBranchForModal,
    copiedPhoneId,
    handleCopyPhone,
    handleResetFilters,
    refetch: fetchData,
  };
}
