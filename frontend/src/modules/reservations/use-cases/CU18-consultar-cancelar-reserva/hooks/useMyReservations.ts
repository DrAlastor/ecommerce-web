/**
 * @caso-de-uso CU18 — Consultar y cancelar reserva
 * @subsistema Reservas
 * @capa Control (presentación) — Frontend web
 * @responsabilidad Coordina estado, validaciones y acciones de la interfaz antes de delegar la operación al servicio o API.
 * @secuencia Cliente -> listado de reservas -> controlador de reservas -> servicio de cancelación -> Reserva/DetalleReserva/Inventario.
 */
import { useState, useEffect, useCallback } from 'react';
import { myReservationsService } from '../services/my-reservations.service';
import type {
  MyReservationListItem,
  ReservationTab,
  ReservationReceipt,
} from '../types/my-reservations.types';

export function useMyReservations() {
  const [activeTab, setActiveTab] = useState<ReservationTab>('activas');
  const [reservations, setReservations] = useState<MyReservationListItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Estado para modal de cancelación
  const [cancelingReservation, setCancelingReservation] = useState<MyReservationListItem | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState<boolean>(false);

  // Estado para comprobante/ticket
  const [receiptModalData, setReceiptModalData] = useState<ReservationReceipt | null>(null);

  const fetchReservations = useCallback(async (tab: ReservationTab) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await myReservationsService.getMyReservations(tab);
      setReservations(data);
    } catch (err: any) {
      console.error('Error al cargar mis reservas:', err);
      setErrorMessage(
        err.response?.data?.message || 'No se pudieron cargar tus reservas. Intenta de nuevo más tarde.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReservations(activeTab);
  }, [activeTab, fetchReservations]);

  const handleTabChange = (tab: ReservationTab) => {
    setActiveTab(tab);
    setFeedbackMessage(null);
  };

  const openCancelModal = (res: MyReservationListItem) => {
    setCancelingReservation(res);
    setCancelReason('');
  };

  const closeCancelModal = () => {
    setCancelingReservation(null);
    setCancelReason('');
  };

  const handleConfirmCancel = async () => {
    if (!cancelingReservation) return;

    setIsSubmittingCancel(true);
    try {
      const result = await myReservationsService.cancelReservation(cancelingReservation.id_reserva, {
        motivo: cancelReason.trim() || undefined,
      });

      setFeedbackMessage({
        type: 'success',
        message: `La reserva ${result.codigo} ha sido cancelada correctamente. Se liberaron ${result.prendas_liberadas} prenda(s) en inventario.`,
      });

      closeCancelModal();
      fetchReservations(activeTab);
    } catch (err: any) {
      console.error('Error al cancelar reserva:', err);
      setFeedbackMessage({
        type: 'error',
        message: err.response?.data?.message || 'No se pudo cancelar la reserva.',
      });
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  const openReceiptModal = async (res: MyReservationListItem) => {
    try {
      const fullReceipt = await myReservationsService.getReservationReceipt(res.id_reserva);
      setReceiptModalData(fullReceipt);
    } catch (err: any) {
      console.error('Error al cargar comprobante:', err);
      // Fallback construyendo estructura con lo que ya se tiene
      setReceiptModalData({
        comprobante: {
          id_reserva: res.id_reserva,
          codigo: res.codigo,
          estado: res.estado,
          fecha_reserva: res.fecha_reserva,
          horario_estimado: res.horario_estimado || 'Durante horario comercial',
          fecha_limite: res.fecha_limite,
          observaciones: res.observaciones,
          dias_vigencia: 2,
        },
        sucursal: {
          id_sucursal: res.sucursal.id_sucursal,
          nombre: res.sucursal.nombre,
          direccion: res.sucursal.direccion,
          telefono: res.sucursal.telefono || 'Sin teléfono',
          horario: res.sucursal.horario,
          ciudad: res.sucursal.ciudad,
        },
        resumen: {
          total_prendas: res.total_prendas,
          total_estimado: res.total_estimado,
        },
        items: res.items.map((it) => ({
          id_detalle_reserva: it.id_detalle_reserva,
          id_producto_variante: it.id_producto_variante,
          cantidad: it.cantidad,
          estado: it.estado,
          producto_nombre: it.producto_nombre,
          sku: it.sku,
          talla: it.talla,
          color_nombre: it.color_nombre,
          color_hex: it.color_hex,
          imagen_url: it.imagen_url,
          precio_estimado: it.precio_estimado,
          subtotal_estimado: it.subtotal_estimado,
        })),
        instrucciones: [
          'Acude a la sucursal seleccionada con este comprobante impreso o tu código.',
          'Pruébate las prendas en tienda antes de decidir tu compra.',
          'El pago se realiza en caja física únicamente si decides llevarte las prendas.',
        ],
      });
    }
  };

  const closeReceiptModal = () => {
    setReceiptModalData(null);
  };

  return {
    activeTab,
    handleTabChange,
    reservations,
    isLoading,
    errorMessage,
    feedbackMessage,
    cancelingReservation,
    cancelReason,
    setCancelReason,
    isSubmittingCancel,
    openCancelModal,
    closeCancelModal,
    handleConfirmCancel,
    receiptModalData,
    openReceiptModal,
    closeReceiptModal,
    refresh: () => fetchReservations(activeTab),
  };
}
