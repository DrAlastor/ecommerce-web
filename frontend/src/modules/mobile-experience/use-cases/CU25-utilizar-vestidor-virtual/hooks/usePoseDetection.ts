/**
 * @caso-de-uso CU25 — Utilizar vestidor virtual
 * @subsistema Experiencia Móvil
 * @capa Control (presentación) — Frontend web
 * @responsabilidad Coordina estado, validaciones y acciones de la interfaz antes de delegar la operación al servicio o API.
 * @secuencia Cliente -> vestidor virtual -> controlador de experiencia -> servicios de cámara y renderizado -> Producto/Variante/Recursos 3D.
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { PoseLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';
import { extractTorsoLandmarks } from '../utils/pose-math';
import type { PoseResult, PoseLandmark } from '../types/virtual-fitting.types';

/**
 * Hook para detección corporal en tiempo real con MediaPipe Pose.
 *
 * Detecta 33 landmarks corporales y extrae los 4 relevantes para
 * prendas superiores (hombros + caderas).
 */
export function usePoseDetection() {
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [poseResult, setPoseResult] = useState<PoseResult | null>(null);
  const [trackingLost, setTrackingLost] = useState(false);

  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const animFrameRef = useRef<number>(0);
  const isRunningRef = useRef(false);
  const lastTimestampRef = useRef<number>(-1);
  const drawingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lostCounterRef = useRef(0);
  const waitingVideoRef = useRef<HTMLVideoElement | null>(null);

  /** Inicia el loop de detección en cada frame del video */
  const startDetection = useCallback((videoElement: HTMLVideoElement) => {
    waitingVideoRef.current = videoElement;

    if (!poseLandmarkerRef.current || isRunningRef.current) return;

    isRunningRef.current = true;
    lastTimestampRef.current = -1;

    const detect = () => {
      if (!isRunningRef.current || !poseLandmarkerRef.current) return;

      const video = waitingVideoRef.current || videoElement;
      if (video && video.readyState >= 2) {
        const timestamp = performance.now();

        // MediaPipe requiere timestamps monotónicamente crecientes
        if (timestamp > lastTimestampRef.current) {
          lastTimestampRef.current = timestamp;

          try {
            const result = poseLandmarkerRef.current.detectForVideo(video, timestamp);

            if (result.landmarks && result.landmarks.length > 0) {
              const landmarks: PoseLandmark[] = result.landmarks[0].map((lm) => ({
                x: lm.x,
                y: lm.y,
                z: lm.z,
                visibility: lm.visibility ?? 0,
              }));

              const torso = extractTorsoLandmarks(landmarks);

              if (torso && torso.isDetected) {
                setPoseResult(torso);
                setTrackingLost(false);
                lostCounterRef.current = 0;
              } else {
                lostCounterRef.current++;
                if (lostCounterRef.current > 15) {
                  setTrackingLost(true);
                }
              }

              // Dibujar landmarks de debug si hay canvas
              if (drawingCanvasRef.current && result.landmarks[0]) {
                const ctx = drawingCanvasRef.current.getContext('2d');
                if (ctx) {
                  if (drawingCanvasRef.current.width !== video.videoWidth) {
                    drawingCanvasRef.current.width = video.videoWidth;
                  }
                  if (drawingCanvasRef.current.height !== video.videoHeight) {
                    drawingCanvasRef.current.height = video.videoHeight;
                  }
                  ctx.clearRect(0, 0, drawingCanvasRef.current.width, drawingCanvasRef.current.height);

                  const drawingUtils = new DrawingUtils(ctx);
                  drawingUtils.drawLandmarks(result.landmarks[0], {
                    radius: 3,
                    color: '#00FF88',
                    fillColor: '#00FF8855',
                  });
                  drawingUtils.drawConnectors(
                    result.landmarks[0],
                    PoseLandmarker.POSE_CONNECTIONS,
                    {
                      color: '#00FF8888',
                      lineWidth: 2,
                    },
                  );
                }
              }
            } else {
              lostCounterRef.current++;
              if (lostCounterRef.current > 15) {
                setPoseResult(null);
                setTrackingLost(true);
              }
            }
          } catch {
            // Ignorar errores transitorios de detección
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(detect);
    };

    animFrameRef.current = requestAnimationFrame(detect);
  }, []);

  /** Inicializa MediaPipe Pose Landmarker */
  const initialize = useCallback(async () => {
    if (poseLandmarkerRef.current) return;
    setIsLoading(true);
    try {
      // Usar versión específica estable de WASM para evitar problemas de compatibilidad
      const wasmUrl = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';
      const modelAssetPath = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

      const vision = await FilesetResolver.forVisionTasks(wasmUrl);

      let landmarker: PoseLandmarker | null = null;

      // Intentar primero con GPU, si falla usar CPU
      try {
        landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath,
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.35,
          minPosePresenceConfidence: 0.35,
          minTrackingConfidence: 0.35,
        });
      } catch (gpuErr) {
        console.warn('Aviso: GPU delegate no soportado, iniciando con CPU:', gpuErr);
        landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath,
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.35,
          minPosePresenceConfidence: 0.35,
          minTrackingConfidence: 0.35,
        });
      }

      poseLandmarkerRef.current = landmarker;
      setIsReady(true);

      // Si había un video esperando para detección, iniciarlo de inmediato
      if (waitingVideoRef.current && !isRunningRef.current) {
        startDetection(waitingVideoRef.current);
      }
    } catch (err) {
      console.error('Error inicializando MediaPipe Pose (se permitirá acceso a la cámara):', err);
      // Habilitar para no bloquear al usuario
      setIsReady(true);
    } finally {
      setIsLoading(false);
    }
  }, [startDetection]);

  // Auto-inicializar al montar el hook
  useEffect(() => {
    initialize();
  }, [initialize]);

  /** Detiene el loop de detección */
  const stopDetection = useCallback(() => {
    isRunningRef.current = false;
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = 0;
    }
  }, []);

  /** Reinicia la detección (para recalibración - RN-M6-18) */
  const recalibrate = useCallback(() => {
    setPoseResult(null);
    setTrackingLost(false);
    lostCounterRef.current = 0;
    lastTimestampRef.current = -1;
  }, []);

  /** Asigna canvas para dibujo de debug */
  const setDebugCanvas = useCallback((canvas: HTMLCanvasElement | null) => {
    drawingCanvasRef.current = canvas;
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      isRunningRef.current = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      poseLandmarkerRef.current?.close();
    };
  }, []);

  return {
    isLoading,
    isReady,
    poseResult,
    trackingLost,
    initialize,
    startDetection,
    stopDetection,
    recalibrate,
    setDebugCanvas,
  };
}
