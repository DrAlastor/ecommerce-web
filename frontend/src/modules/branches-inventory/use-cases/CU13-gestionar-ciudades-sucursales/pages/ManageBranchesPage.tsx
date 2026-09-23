/**
 * @caso-de-uso CU13 — Gestionar ciudades y sucursales
 * @subsistema Sucursales e Inventario
 * @capa Boundary — Frontend web
 * @responsabilidad Representa la pantalla principal de Frontend web; compone la interfaz e inicia las acciones del caso de uso.
 * @secuencia Administrador -> vista de sucursales -> controlador geográfico -> servicio de sucursales -> Ciudad/Sucursal.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  Building2,
  Store,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { branchesAdminService } from '../services/branchesAdmin.service';
import type {
  Branch,
  BranchDetail,
  City,
  CreateBranchPayload,
  CreateCityPayload,
  PaginationMeta,
} from '../types/branchesAdmin.types';
import { BranchesTab } from '../components/BranchesTab/BranchesTab';
import { CitiesTab } from '../components/CitiesTab/CitiesTab';
import { BranchFormModal } from '../components/BranchFormModal/BranchFormModal';
import { CityFormModal } from '../components/CityFormModal/CityFormModal';
import { BranchDetailModal } from '../components/BranchDetailModal/BranchDetailModal';
import './ManageBranchesPage.css';

export const ManageBranchesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sucursales' | 'ciudades'>('sucursales');
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // --- SUCURSALES STATE ---
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesMeta, setBranchesMeta] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [branchSearch, setBranchSearch] = useState('');
  const [selectedCityId, setSelectedCityId] = useState<number>(0);
  const [selectedStatus, setSelectedStatus] = useState<string>('todos');

  // --- CIUDADES STATE ---
  const [cities, setCities] = useState<City[]>([]);
  const [allCitiesSimple, setAllCitiesSimple] = useState<City[]>([]);
  const [citiesMeta, setCitiesMeta] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [citySearch, setCitySearch] = useState('');

  // --- MODALS STATE ---
  const [isBranchFormOpen, setIsBranchFormOpen] = useState(false);
  const [branchToEdit, setBranchToEdit] = useState<Branch | null>(null);
  const [submittingBranch, setSubmittingBranch] = useState(false);

  const [isCityFormOpen, setIsCityFormOpen] = useState(false);
  const [cityToEdit, setCityToEdit] = useState<City | null>(null);
  const [submittingCity, setSubmittingCity] = useState(false);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedBranchDetail, setSelectedBranchDetail] = useState<BranchDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback(null);
    }, 4500);
  };

  // --- LOAD SUCURSALES ---
  const fetchBranches = useCallback(
    async (page = 1) => {
      try {
        setBranchesLoading(true);
        const res = await branchesAdminService.getBranches({
          search: branchSearch,
          id_ciudad: selectedCityId > 0 ? selectedCityId : undefined,
          estado: selectedStatus,
          page,
          limit: 10,
        });
        setBranches(res.data);
        setBranchesMeta(res.meta);
      } catch (err: any) {
        showFeedback(
          'error',
          err.response?.data?.message || 'Error al cargar el listado de sucursales.',
        );
      } finally {
        setBranchesLoading(false);
      }
    },
    [branchSearch, selectedCityId, selectedStatus],
  );

  // --- LOAD CIUDADES ---
  const fetchCities = useCallback(
    async (page = 1) => {
      try {
        setCitiesLoading(true);
        const res = await branchesAdminService.getCities({
          search: citySearch,
          page,
          limit: 10,
        });
        setCities(res.data);
        setCitiesMeta(res.meta);
      } catch (err: any) {
        showFeedback(
          'error',
          err.response?.data?.message || 'Error al cargar las ciudades.',
        );
      } finally {
        setCitiesLoading(false);
      }
    },
    [citySearch],
  );

  // --- LOAD SIMPLE CITIES FOR SELECTS ---
  const fetchAllCitiesSimple = useCallback(async () => {
    try {
      const simple = await branchesAdminService.getCitiesSimple();
      setAllCitiesSimple(simple);
    } catch (err) {
      console.error('Error al cargar ciudades para selector:', err);
    }
  }, []);

  useEffect(() => {
    fetchBranches(1);
  }, [fetchBranches]);

  useEffect(() => {
    fetchCities(1);
  }, [fetchCities]);

  useEffect(() => {
    fetchAllCitiesSimple();
  }, [fetchAllCitiesSimple]);

  const refreshAll = () => {
    fetchBranches(branchesMeta.page);
    fetchCities(citiesMeta.page);
    fetchAllCitiesSimple();
    showFeedback('success', 'Datos sincronizados con éxito.');
  };

  // --- SUCURSALES ACTIONS ---
  const handleBranchSubmit = async (payload: CreateBranchPayload) => {
    try {
      setSubmittingBranch(true);
      if (branchToEdit) {
        const res = await branchesAdminService.updateBranch(
          branchToEdit.id_sucursal,
          payload,
        );
        showFeedback('success', res.message || 'Sucursal actualizada exitosamente.');
      } else {
        const res = await branchesAdminService.createBranch(payload);
        showFeedback('success', res.message || 'Sucursal registrada exitosamente.');
      }
      setIsBranchFormOpen(false);
      setBranchToEdit(null);
      fetchBranches(branchesMeta.page);
      fetchCities(citiesMeta.page);
    } catch (err: any) {
      showFeedback(
        'error',
        err.response?.data?.message || 'Error al guardar los datos de la sucursal.',
      );
    } finally {
      setSubmittingBranch(false);
    }
  };

  const handleToggleBranchStatus = async (branch: Branch) => {
    const nextStatus = branch.estado === 'activo' ? 'inactivo' : 'activo';
    try {
      const res = await branchesAdminService.updateBranchStatus(
        branch.id_sucursal,
        nextStatus,
      );
      showFeedback('success', res.message);
      fetchBranches(branchesMeta.page);
    } catch (err: any) {
      showFeedback(
        'error',
        err.response?.data?.message || 'Error al actualizar el estado de la sucursal.',
      );
    }
  };

  const handleDeleteBranch = async (branch: Branch, forceDeactivate = false) => {
    try {
      if (forceDeactivate) {
        await branchesAdminService.updateBranchStatus(
          branch.id_sucursal,
          'inactivo',
        );
        showFeedback(
          'success',
          `La sucursal "${branch.nombre}" ha sido desactivada para conservar el historial contable y operativo.`,
        );
      } else {
        const res = await branchesAdminService.deleteBranch(branch.id_sucursal);
        showFeedback('success', res.message || 'Sucursal eliminada exitosamente.');
      }
      fetchBranches(branchesMeta.page);
      fetchCities(citiesMeta.page);
    } catch (err: any) {
      showFeedback(
        'error',
        err.response?.data?.message || 'No fue posible procesar el retiro de la sucursal.',
      );
    }
  };

  const handleOpenDetailModal = async (branch: Branch) => {
    setIsDetailModalOpen(true);
    setLoadingDetail(true);
    setSelectedBranchDetail(null);
    try {
      const detail = await branchesAdminService.getBranchById(branch.id_sucursal);
      setSelectedBranchDetail(detail);
    } catch (err: any) {
      showFeedback(
        'error',
        err.response?.data?.message || 'No se pudo obtener el detalle de la sucursal.',
      );
      setIsDetailModalOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  // --- CIUDADES ACTIONS ---
  const handleCitySubmit = async (payload: CreateCityPayload) => {
    try {
      setSubmittingCity(true);
      if (cityToEdit) {
        const res = await branchesAdminService.updateCity(
          cityToEdit.id_ciudad,
          payload,
        );
        showFeedback('success', res.message || 'Ciudad actualizada exitosamente.');
      } else {
        const res = await branchesAdminService.createCity(payload);
        showFeedback('success', res.message || 'Ciudad creada exitosamente.');
      }
      setIsCityFormOpen(false);
      setCityToEdit(null);
      fetchCities(citiesMeta.page);
      fetchAllCitiesSimple();
    } catch (err: any) {
      showFeedback(
        'error',
        err.response?.data?.message || 'Error al guardar la información de la ciudad.',
      );
    } finally {
      setSubmittingCity(false);
    }
  };

  const handleDeleteCity = async (city: City) => {
    try {
      const res = await branchesAdminService.deleteCity(city.id_ciudad);
      showFeedback('success', res.message || 'Ciudad eliminada exitosamente.');
      fetchCities(citiesMeta.page);
      fetchAllCitiesSimple();
    } catch (err: any) {
      showFeedback(
        'error',
        err.response?.data?.message || 'No fue posible eliminar la ciudad.',
      );
    }
  };

  return (
    <div className="manage-branches-page">
      {/* Header */}
      <div className="admin-page-header branches-header">
        <div>
          <h1 className="admin-page-title">Ciudades y Sucursales</h1>
          <p className="admin-page-subtitle">
            Administra la presencia física de FashionStore, los puntos de atención y la estructura geográfica del negocio.
          </p>
        </div>
        <button
          type="button"
          className="admin-btn secondary refresh-btn"
          onClick={refreshAll}
        >
          <RefreshCw size={16} /> Sincronizar
        </button>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div className={`admin-feedback-toast ${feedback.type}`}>
          {feedback.type === 'success' ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="admin-tabs-nav">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'sucursales' ? 'active' : ''}`}
          onClick={() => setActiveTab('sucursales')}
        >
          <Store size={18} />
          <span>Sucursales Físicas</span>
          <span className="tab-badge">{branchesMeta.total}</span>
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'ciudades' ? 'active' : ''}`}
          onClick={() => setActiveTab('ciudades')}
        >
          <Building2 size={18} />
          <span>Ciudades y Cobertura</span>
          <span className="tab-badge">{citiesMeta.total}</span>
        </button>
      </div>

      {/* Content based on Active Tab */}
      <div className="admin-tab-workspace">
        {activeTab === 'sucursales' ? (
          <BranchesTab
            branches={branches}
            cities={allCitiesSimple}
            meta={branchesMeta}
            loading={branchesLoading}
            search={branchSearch}
            selectedCityId={selectedCityId}
            selectedStatus={selectedStatus}
            onSearchChange={setBranchSearch}
            onCityFilterChange={setSelectedCityId}
            onStatusFilterChange={setSelectedStatus}
            onPageChange={(page) => fetchBranches(page)}
            onOpenCreateModal={() => {
              setBranchToEdit(null);
              setIsBranchFormOpen(true);
            }}
            onOpenEditModal={(branch) => {
              setBranchToEdit(branch);
              setIsBranchFormOpen(true);
            }}
            onOpenDetailModal={handleOpenDetailModal}
            onToggleStatus={handleToggleBranchStatus}
            onDeleteBranch={handleDeleteBranch}
          />
        ) : (
          <CitiesTab
            cities={cities}
            meta={citiesMeta}
            loading={citiesLoading}
            search={citySearch}
            onSearchChange={setCitySearch}
            onPageChange={(page) => fetchCities(page)}
            onOpenCreateModal={() => {
              setCityToEdit(null);
              setIsCityFormOpen(true);
            }}
            onOpenEditModal={(city) => {
              setCityToEdit(city);
              setIsCityFormOpen(true);
            }}
            onDeleteCity={handleDeleteCity}
          />
        )}
      </div>

      {/* Modals */}
      <BranchFormModal
        isOpen={isBranchFormOpen}
        branchToEdit={branchToEdit}
        cities={allCitiesSimple}
        submitting={submittingBranch}
        onClose={() => {
          setIsBranchFormOpen(false);
          setBranchToEdit(null);
        }}
        onSubmit={handleBranchSubmit}
      />

      <CityFormModal
        isOpen={isCityFormOpen}
        cityToEdit={cityToEdit}
        submitting={submittingCity}
        onClose={() => {
          setIsCityFormOpen(false);
          setCityToEdit(null);
        }}
        onSubmit={handleCitySubmit}
      />

      <BranchDetailModal
        isOpen={isDetailModalOpen}
        branch={selectedBranchDetail}
        loading={loadingDetail}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedBranchDetail(null);
        }}
      />
    </div>
  );
};

export default ManageBranchesPage;
