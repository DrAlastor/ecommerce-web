import { useState, useCallback, useRef, useEffect } from 'react';
import { computeGarmentTransform, computeGarment3DTransform } from '../utils/pose-math';
import { TransformSmoother, Transform3DSmoother } from '../utils/smoothing';
import type { PoseResult, GarmentTransform, Garment3DTransform } from '../types/virtual-fitting.types';

/**
 * Hook que calcula la transformación de la prenda (2D y 3D) a partir de la pose detectada.
 * Aplica suavizado EMA para eliminar vibración (Fase 4).
 */
export function useGarmentTransform(smoothingFactor = 0.75) {
  const [transform, setTransform] = useState<GarmentTransform | null>(null);
  const [transform3D, setTransform3D] = useState<Garment3DTransform | null>(null);

  const smootherRef = useRef(new TransformSmoother(smoothingFactor));
  const smoother3DRef = useRef(new Transform3DSmoother(smoothingFactor));
  const dimensionsRef = useRef({ width: 640, height: 480 });

  /** Actualiza las dimensiones del canvas/video */
  const setDimensions = useCallback((width: number, height: number) => {
    const previous = dimensionsRef.current;
    dimensionsRef.current = { width, height };

    if (previous.width !== width || previous.height !== height) {
      smootherRef.current.reset();
      smoother3DRef.current.reset();
    }
  }, []);

  /** Procesa un resultado de pose y calcula los transforms suavizados 2D y 3D */
  const updateTransform = useCallback((pose: PoseResult | null) => {
    if (!pose || !pose.isDetected) {
      smootherRef.current.reset();
      smoother3DRef.current.reset();
      setTransform(null);
      setTransform3D(null);
      return;
    }

    const { width, height } = dimensionsRef.current;
    
    // Transform 2D para overlay de imagen de catálogo
    const rawTransform = computeGarmentTransform(pose, width, height);
    const smoothed = smootherRef.current.smooth(rawTransform);
    setTransform(smoothed);

    // Transform 3D para Three.js con rotación de hombros, perfil (Yaw) y escala
    const raw3D = computeGarment3DTransform(pose, 45, 3.0, width / height, true);
    const smoothed3D = smoother3DRef.current.smooth(raw3D);
    setTransform3D(smoothed3D);
  }, []);

  /** Reinicia los suavizadores (para recalibración - RN-M6-18) */
  const resetSmoothing = useCallback(() => {
    smootherRef.current.reset();
    smoother3DRef.current.reset();
    setTransform(null);
    setTransform3D(null);
  }, []);

  /** Actualiza el factor de suavizado */
  const setSmoothingFactor = useCallback((factor: number) => {
    smootherRef.current.setFactor(factor);
    smoother3DRef.current.setFactor(factor);
  }, []);

  // Actualizar el factor si cambia la prop
  useEffect(() => {
    smootherRef.current.setFactor(smoothingFactor);
    smoother3DRef.current.setFactor(smoothingFactor);
  }, [smoothingFactor]);

  return {
    transform,
    transform3D,
    setDimensions,
    updateTransform,
    resetSmoothing,
    setSmoothingFactor,
  };
}
