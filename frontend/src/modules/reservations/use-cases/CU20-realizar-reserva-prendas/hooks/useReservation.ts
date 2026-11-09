/**
 * @caso-de-uso CU17 — Realizar reserva de prendas
 * @subsistema Reservas
 * @capa Control (presentación) — Frontend web
 * @responsabilidad Coordina estado, validaciones y acciones de la interfaz antes de delegar la operación al servicio o API.
 * @secuencia Cliente -> formulario de reserva -> controlador de reservas -> servicio de disponibilidad -> Reserva/DetalleReserva/Inventario/Sucursal.
 */
import { useState, useEffect, useCallback } from 'react';
import { reservationService } from '../services/reservation.service';
import type {
  BranchAvailability,
  ReservationReceipt,
} from '../types/reservation.types';

interface UseReservationOptions {
  variantId: number | null;
  isOpen: boolean;
  onSuccess?: (receipt: ReservationReceipt) => void;
}

export function useReservation({ variantId, isOpen, onSuccess }: UseReservationOptions) {
  const [branches, setBranches] = useState<BranchAvailability[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [fechaVisita, setFechaVisita] = useState<string>('');
  const [observaciones, setObservaciones] = useState<string>('');

  const [isLoadingBranches, setIsLoadingBranches] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [receipt, setReceipt] = useState<ReservationReceipt | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState<boolean>(false);

  // Cargar sucursales cuando se abre el modal y hay variante
  const loadBranches = useCallback(async () => {
    if (!variantId || !isOpen) return;

    setIsLoadingBranches(true);
    setErrorMessage(null);

    try {
      const data = await reservationService.getBranchAvailability(variantId);
      setBranches(data.sucursales || []);

      // Preseleccionar la primera sucursal con stock disponible
      const firstAvailable = data.sucursales?.find((s) => s.tiene_disponibilidad);
      if (firstAvailable) {
        setSelectedBranchId(firstAvailable.id_sucursal);
      } else if (data.sucursales?.length > 0) {
        setSelectedBranchId(data.sucursales[0].id_sucursal);
      }
    } catch (err: any) {
      console.error('Error al cargar disponibilidad de sucursales:', err);
      setErrorMessage(
        err.response?.data?.message || 'No se pudo cargar la disponibilidad en sucursales.',
      );
    } finally {
      setIsLoadingBranches(false);
    }
  }, [variantId, isOpen]);

  useEffect(() => {
    if (isOpen) {
      // Calcular fecha recomendada por defecto (mañana)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setFechaVisita(tomorrow.toISOString().split('T')[0]);
      setQuantity(1);
      setObservaciones('');
      loadBranches();
    } else {
      setErrorMessage(null);
    }
  }, [isOpen, loadBranches]);

  const selectedBranch = branches.find((b) => b.id_sucursal === selectedBranchId) || null;
  const maxAvailableStock = selectedBranch ? selectedBranch.stock_disponible : 0;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!variantId) {
      setErrorMessage('No hay una variante seleccionada.');
      return;
    }

    if (!selectedBranchId) {
      setErrorMessage('Por favor selecciona una sucursal para tu retiro.');
      return;
    }

    if (!selectedBranch?.tiene_disponibilidad || maxAvailableStock < 1) {
      setErrorMessage('La sucursal seleccionada no tiene unidades disponibles de esta prenda.');
      return;
    }

    if (quantity > maxAvailableStock) {
      setErrorMessage(`Solo hay ${maxAvailableStock} unidad(es) disponible(s) en esta sucursal.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const createdReceipt = await reservationService.createReservation({
        id_sucursal: selectedBranchId,
        id_producto_variante: variantId,
        cantidad: quantity,
        fecha_visita: fechaVisita || undefined,
        observaciones: observaciones.trim() || undefined,
      });

      setReceipt(createdReceipt);
      setIsReceiptOpen(true);
      if (onSuccess) {
        onSuccess(createdReceipt);
      }
    } catch (err: any) {
      console.error('Error al crear reserva:', err);
      setErrorMessage(
        err.response?.data?.message || 'Ocurrió un error al procesar tu reserva. Intenta nuevamente.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeReceipt = () => {
    setIsReceiptOpen(false);
    setReceipt(null);
  };

  return {
    branches,
    selectedBranchId,
    setSelectedBranchId,
    selectedBranch,
    maxAvailableStock,
    quantity,
    setQuantity,
    fechaVisita,
    setFechaVisita,
    observaciones,
    setObservaciones,
    isLoadingBranches,
    isSubmitting,
    errorMessage,
    setErrorMessage,
    receipt,
    isReceiptOpen,
    handleSubmit,
    closeReceipt,
    reloadBranches: loadBranches,
  };
}
