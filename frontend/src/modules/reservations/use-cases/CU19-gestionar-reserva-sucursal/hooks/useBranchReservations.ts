import { useState, useEffect, useCallback } from 'react';
import { branchReservationsService } from '../services/branch-reservations.service';
import type {
  StaffBranch,
  BranchReservation,
  BranchReservationStatus,
  BranchReservationsMetrics,
} from '../types/branch-reservations.types';

export function useBranchReservations() {
  const [branches, setBranches] = useState<StaffBranch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | 'todas'>('todas');
  const [selectedStatus, setSelectedStatus] = useState<string>('activas');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [reservations, setReservations] = useState<BranchReservation[]>([]);
  const [metrics, setMetrics] = useState<BranchReservationsMetrics>({
    pendientes: 0,
    preparadas: 0,
    atendidas: 0,
    completadas: 0,
    canceladas: 0,
    total: 0,
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Modal de Detalle / Inspección de prendas
  const [selectedDetailReservation, setSelectedDetailReservation] =
    useState<BranchReservation | null>(null);

  // Modal de Confirmación de Acción / Estado
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    reservation: BranchReservation | null;
    targetStatus: BranchReservationStatus | null;
    title: string;
    description: string;
  }>({
    isOpen: false,
    reservation: null,
    targetStatus: null,
    title: '',
    description: '',
  });
  const [actionReason, setActionReason] = useState<string>('');

  // 1. Cargar sucursales autorizadas
  const loadBranches = useCallback(async () => {
    try {
      const data = await branchReservationsService.getMyBranches();
      setBranches(data);
      if (data.length === 1) {
        setSelectedBranchId(data[0].id_sucursal);
      }
    } catch (err: any) {
      console.error('Error al cargar sucursales asignadas:', err);
    }
  }, []);

  // 2. Cargar reservas según filtros
  const fetchReservations = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (selectedBranchId !== 'todas') {
        params.sucursalId = selectedBranchId;
      }
      if (selectedStatus && selectedStatus !== 'todos') {
        params.estado = selectedStatus;
      }
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      const response = await branchReservationsService.getBranchReservations(params);
      setReservations(response.data);
      if (response.metrics) {
        setMetrics(response.metrics);
      }
    } catch (err: any) {
      console.error('Error al cargar reservas de sucursal:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Error al cargar las reservas de sucursal.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedBranchId, selectedStatus, searchTerm]);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  // Manejo de cambio de estado interactivo
  const promptStatusChange = (
    reservation: BranchReservation,
    targetStatus: BranchReservationStatus,
  ) => {
    let title = '';
    let description = '';

    switch (targetStatus) {
      case 'Preparada':
        title = `Preparar Reserva ${reservation.codigo}`;
        description = `Indica que has localizado las prendas físicas de esta reserva y se encuentran apartadas en el área de retiro para el cliente ${reservation.cliente.nombre_completo}.`;
        break;
      case 'Atendida':
        title = `Confirmar Llegada y Atención de ${reservation.codigo}`;
        description = `El cliente ${reservation.cliente.nombre_completo} está presente en la sucursal física y se le entregan las prendas para probárselas.`;
        break;
      case 'Completada':
        title = `Completar Venta de ${reservation.codigo}`;
        description = `El cliente decidió comprar las prendas apartadas. Al confirmar, los detalles pasan a "Vendido" y se descuentan definitivamente las unidades del stock reservado en inventario.`;
        break;
      case 'Cancelada':
        title = `Cancelar Reserva ${reservation.codigo} y Liberar Prendas`;
        description = `El cliente no asistió o decidió no comprar las prendas. Al cancelar, las prendas se devolverán inmediatamente al inventario disponible de ${reservation.sucursal.nombre} para que otros clientes puedan adquirirlas.`;
        break;
      default:
        title = `Cambiar estado a ${targetStatus}`;
        description = `¿Confirmas el cambio de estado de la reserva ${reservation.codigo}?`;
    }

    setActionReason('');
    setActionModal({
      isOpen: true,
      reservation,
      targetStatus,
      title,
      description,
    });
  };

  const closeActionModal = () => {
    setActionModal({
      isOpen: false,
      reservation: null,
      targetStatus: null,
      title: '',
      description: '',
    });
    setActionReason('');
  };

  const confirmStatusChange = async () => {
    if (!actionModal.reservation || !actionModal.targetStatus) return;

    setIsUpdating(true);
    try {
      const resp = await branchReservationsService.updateReservationStatus(
        actionModal.reservation.id_reserva,
        {
          nuevo_estado: actionModal.targetStatus,
          motivo: actionReason.trim() || undefined,
        },
      );

      setFeedback({
        type: 'success',
        message: resp.mensaje || `Reserva ${resp.codigo} actualizada a "${resp.estado}".`,
      });

      closeActionModal();
      if (selectedDetailReservation?.id_reserva === actionModal.reservation.id_reserva) {
        setSelectedDetailReservation(null);
      }
      fetchReservations();
    } catch (err: any) {
      console.error('Error al actualizar estado de reserva:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'No se pudo actualizar el estado de la reserva.',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    branches,
    selectedBranchId,
    setSelectedBranchId,
    selectedStatus,
    setSelectedStatus,
    searchTerm,
    setSearchTerm,
    reservations,
    metrics,
    isLoading,
    isUpdating,
    feedback,
    setFeedback,
    selectedDetailReservation,
    setSelectedDetailReservation,
    actionModal,
    actionReason,
    setActionReason,
    promptStatusChange,
    closeActionModal,
    confirmStatusChange,
    refresh: fetchReservations,
  };
}
