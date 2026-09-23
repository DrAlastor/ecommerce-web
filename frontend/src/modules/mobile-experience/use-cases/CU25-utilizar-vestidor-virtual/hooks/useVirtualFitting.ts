/**
 * @caso-de-uso CU25 — Utilizar vestidor virtual
 * @subsistema Experiencia Móvil
 * @capa Control (presentación) — Frontend web
 * @responsabilidad Coordina estado, validaciones y acciones de la interfaz antes de delegar la operación al servicio o API.
 * @secuencia Cliente -> vestidor virtual -> controlador de experiencia -> servicios de cámara y renderizado -> Producto/Variante/Recursos 3D.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useWebcam } from './useWebcam';
import { usePoseDetection } from './usePoseDetection';
import { useGarmentTransform } from './useGarmentTransform';
import { virtualFittingService } from '../services/virtual-fitting.service';
import type { ArVariantsResponse, ArVariant, FittingPhase } from '../types/virtual-fitting.types';

/**
 * Hook orquestador del Vestidor Virtual.
 * Coordina: datos del producto, webcam, detección de pose, y transformación de prenda.
 */
export function useVirtualFitting() {
  const { productId } = useParams<{ productId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // ── Datos del producto y variantes RA ──
  const [arData, setArData] = useState<ArVariantsResponse | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ArVariant | null>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [productError, setProductError] = useState<string | null>(null);

  // ── Talla y color seleccionados ──
  const [selectedTallaId, setSelectedTallaId] = useState<number | null>(null);
  const [selectedColorId, setSelectedColorId] = useState<number | null>(null);

  // ── Fase de la experiencia ──
  const [phase, setPhase] = useState<FittingPhase>('loading');

  // ── Registro de interacción ──
  const [interactionRegistered, setInteractionRegistered] = useState(false);

  // ── Sub-hooks ──
  const webcam = useWebcam();
  const pose = usePoseDetection();
  const garment = useGarmentTransform(0.75);

  /** Cargar datos del producto al montar */
  useEffect(() => {
    if (!productId || isNaN(Number(productId))) {
      setProductError('Identificador de producto inválido.');
      setPhase('error');
      setIsLoadingProduct(false);
      return;
    }

    const fetchData = async () => {
      setIsLoadingProduct(true);
      try {
        const data = await virtualFittingService.getArVariantsByProduct(Number(productId));
        setArData(data);

        // Preseleccionar variante desde query params o primera disponible
        const tallaParam = searchParams.get('talla');
        const colorParam = searchParams.get('color');

        let initial = data.variantes[0];

        if (tallaParam && colorParam) {
          const match = data.variantes.find(
            (v) =>
              v.talla.id_talla === Number(tallaParam) &&
              v.color.id_color === Number(colorParam),
          );
          if (match) initial = match;
        }

        setSelectedVariant(initial);
        setSelectedTallaId(initial.talla.id_talla);
        setSelectedColorId(initial.color.id_color);
        setPhase('calibration');
      } catch (err: any) {
        console.error('Error al cargar datos para vestidor virtual:', err);
        setProductError(
          err.response?.data?.message ||
          'No se pudo cargar la información del producto para el vestidor virtual.',
        );
        setPhase('error');
      } finally {
        setIsLoadingProduct(false);
      }
    };

    fetchData();
  }, [productId, searchParams]);

  /** Inicializar MediaPipe cuando entramos a calibración */
  useEffect(() => {
    if (phase === 'calibration' && !pose.isReady && !pose.isLoading) {
      pose.initialize();
    }
  }, [phase, pose.isReady, pose.isLoading, pose.initialize]);

  /** Propagar resultados de pose al transform de la prenda */
  useEffect(() => {
    garment.updateTransform(pose.poseResult);
  }, [pose.poseResult, garment.updateTransform]);

  /** Buscar variante al cambiar talla o color */
  useEffect(() => {
    if (!arData || selectedTallaId === null || selectedColorId === null) return;

    const exactMatch = arData.variantes.find(
      (v) =>
        v.talla.id_talla === selectedTallaId &&
        v.color.id_color === selectedColorId,
    );

    if (exactMatch) {
      setSelectedVariant(exactMatch);
    } else {
      const colorMatch = arData.variantes.find((v) => v.color.id_color === selectedColorId);
      if (colorMatch) {
        setSelectedVariant(colorMatch);
        setSelectedTallaId(colorMatch.talla.id_talla);
      }
    }
  }, [arData, selectedTallaId, selectedColorId]);

  /** Registrar interacción una sola vez al iniciar la experiencia */
  useEffect(() => {
    if (phase === 'fitting' && !interactionRegistered && productId) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        virtualFittingService
          .registerInteraction(Number(productId))
          .then(() => setInteractionRegistered(true))
          .catch(() => {}); // Silencioso: no bloquear la experiencia
      }
    }
  }, [phase, interactionRegistered, productId]);

  /** Iniciar la experiencia (desde calibración) */
  const startFitting = useCallback(async () => {
    await webcam.requestWebcam();
    setPhase('fitting');
  }, [webcam.requestWebcam]);

  /** Recalibrar (RN-M6-18) */
  const recalibrate = useCallback(() => {
    pose.recalibrate();
    garment.resetSmoothing();
  }, [pose.recalibrate, garment.resetSmoothing]);

  /** Salir del vestidor */
  const exitFitting = useCallback(() => {
    webcam.stopWebcam();
    pose.stopDetection();
    navigate(`/product/${productId}`);
  }, [webcam.stopWebcam, pose.stopDetection, navigate, productId]);

  /** Variante actualmente visualizable */
  const currentVariant = useMemo(() => selectedVariant, [selectedVariant]);

  /** Tallas disponibles filtradas por color seleccionado */
  const availableTallasForColor = useMemo(() => {
    if (!arData || selectedColorId === null) return arData?.tallas_disponibles || [];
    const tallasConVariante = new Set(
      arData.variantes
        .filter((v) => v.color.id_color === selectedColorId)
        .map((v) => v.talla.id_talla),
    );
    return (arData.tallas_disponibles || []).filter((t) => tallasConVariante.has(t.id_talla));
  }, [arData, selectedColorId]);

  /** Colores disponibles filtrados por talla seleccionada */
  const availableColoresForTalla = useMemo(() => {
    if (!arData || selectedTallaId === null) return arData?.colores_disponibles || [];
    const coloresConVariante = new Set(
      arData.variantes
        .filter((v) => v.talla.id_talla === selectedTallaId)
        .map((v) => v.color.id_color),
    );
    return (arData.colores_disponibles || []).filter((c) => coloresConVariante.has(c.id_color));
  }, [arData, selectedTallaId]);

  return {
    // Datos del producto
    arData,
    currentVariant,
    isLoadingProduct,
    productError,
    productId: productId ? Number(productId) : null,

    // Selección
    selectedTallaId,
    selectedColorId,
    setSelectedTallaId,
    setSelectedColorId,
    availableTallasForColor,
    availableColoresForTalla,

    // Fases y estado
    phase,
    setPhase,

    // Webcam
    webcamStatus: webcam.status,
    webcamError: webcam.errorMessage,
    setVideoElement: webcam.setVideoElement,

    // Pose detection
    poseLoading: pose.isLoading,
    poseReady: pose.isReady,
    poseResult: pose.poseResult,
    trackingLost: pose.trackingLost,
    startDetection: pose.startDetection,
    setDebugCanvas: pose.setDebugCanvas,

    // Transform de la prenda
    garmentTransform: garment.transform,
    garmentTransform3D: garment.transform3D,
    setGarmentDimensions: garment.setDimensions,

    // Acciones
    startFitting,
    recalibrate,
    exitFitting,
    navigate,
  };
}
