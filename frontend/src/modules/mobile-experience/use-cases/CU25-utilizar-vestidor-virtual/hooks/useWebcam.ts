/**
 * @caso-de-uso CU25 — Utilizar vestidor virtual
 * @subsistema Experiencia Móvil
 * @capa Control (presentación) — Frontend web
 * @responsabilidad Coordina estado, validaciones y acciones de la interfaz antes de delegar la operación al servicio o API.
 * @secuencia Cliente -> vestidor virtual -> controlador de experiencia -> servicios de cámara y renderizado -> Producto/Variante/Recursos 3D.
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import type { WebcamStatus } from '../types/virtual-fitting.types';

/**
 * Hook para gestionar el acceso a la webcam del usuario.
 *
 * Maneja:
 * - Solicitud de permisos (RN-M6-01)
 * - Estados de la webcam (idle, requesting, active, denied, error, not-supported)
 * - Cleanup al desmontar
 */
export function useWebcam() {
  const [status, setStatus] = useState<WebcamStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  /** Solicita acceso a la webcam */
  const requestWebcam = useCallback(async () => {
    // Verificar soporte del navegador
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus('not-supported');
      setErrorMessage('Tu navegador no soporta acceso a la cámara.');
      return;
    }

    setStatus('requesting');
    setErrorMessage(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      streamRef.current = stream;

      // Asignar stream al video si ya existe la referencia
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setStatus('active');
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setStatus('denied');
        setErrorMessage('Permiso de cámara denegado. Para usar el vestidor virtual, permite el acceso a tu cámara en la configuración del navegador.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setStatus('error');
        setErrorMessage('No se encontró ninguna cámara en tu dispositivo.');
      } else {
        setStatus('error');
        setErrorMessage(`Error al acceder a la cámara: ${err.message || 'Error desconocido'}`);
      }
    }
  }, []);

  /** Detiene la webcam y libera recursos */
  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStatus('idle');
  }, []);

  /** Asigna la referencia al elemento <video> y conecta el stream si ya existe */
  const setVideoElement = useCallback((element: HTMLVideoElement | null) => {
    videoRef.current = element;
    if (element && streamRef.current) {
      if (element.srcObject !== streamRef.current) {
        element.srcObject = streamRef.current;
        element.play().catch(() => {});
      }
    }
  }, []);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    status,
    errorMessage,
    videoRef,
    stream: streamRef.current,
    requestWebcam,
    stopWebcam,
    setVideoElement,
  };
}
