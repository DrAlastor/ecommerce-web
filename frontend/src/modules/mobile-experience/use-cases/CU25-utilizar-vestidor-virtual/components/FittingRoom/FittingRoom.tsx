/**
 * @caso-de-uso CU25 — Utilizar vestidor virtual
 * @subsistema Experiencia Móvil
 * @capa Boundary — Frontend web
 * @responsabilidad Implementa una parte reutilizable de la interfaz de Frontend web y comunica eventos al controlador de presentación.
 * @secuencia Cliente -> vestidor virtual -> controlador de experiencia -> servicios de cámara y renderizado -> Producto/Variante/Recursos 3D.
 */
import React, { useState } from 'react';
import { WebcamCanvas } from '../WebcamCanvas/WebcamCanvas';
import { GarmentOverlay } from '../GarmentOverlay/GarmentOverlay';
import { ThreeGarmentCanvas } from '../ThreeGarmentCanvas/ThreeGarmentCanvas';
import type {
  GarmentTransform,
  Garment3DTransform,
  ArVariant,
  WebcamStatus,
  PoseResult,
} from '../../types/virtual-fitting.types';
import { CameraOff, ShieldAlert, Sparkles, Box, Image as ImageIcon } from 'lucide-react';
import './FittingRoom.css';

interface FittingRoomProps {
  webcamStatus: WebcamStatus;
  webcamError: string | null;
  setVideoElement: (el: HTMLVideoElement | null) => void;
  setDebugCanvas: (el: HTMLCanvasElement | null) => void;
  startDetection: (video: HTMLVideoElement) => void;
  setGarmentDimensions: (width: number, height: number) => void;
  garmentTransform: GarmentTransform | null;
  garmentTransform3D: Garment3DTransform | null;
  poseResult?: PoseResult | null;
  currentVariant: ArVariant | null;
  trackingLost: boolean;
  showDebugLandmarks: boolean;
  onRequestPermissionAgain?: () => void;
}

/**
 * Escenario principal de Realidad Aumentada.
 * Superpone el stream de la webcam con la prenda virtual calculada en tiempo real.
 * Soporta visualización tridimensional 3D (Three.js) y modo 2D foto.
 */
export const FittingRoom: React.FC<FittingRoomProps> = ({
  webcamStatus,
  webcamError,
  setVideoElement,
  setDebugCanvas,
  startDetection,
  setGarmentDimensions,
  garmentTransform,
  garmentTransform3D,
  poseResult,
  currentVariant,
  trackingLost,
  showDebugLandmarks,
  onRequestPermissionAgain,
}) => {
  const [renderMode, setRenderMode] = useState<'3d' | '2d'>('3d');
  const [videoDims, setVideoDims] = useState<{ width: number; height: number }>({
    width: 640,
    height: 480,
  });

  const handleDimensionsChange = React.useCallback((w: number, h: number) => {
    if (w > 0 && h > 0) {
      setVideoDims((prev) => {
        if (prev.width === w && prev.height === h) return prev;
        return { width: w, height: h };
      });
      setGarmentDimensions(w, h);
    }
  }, [setGarmentDimensions]);

  return (
    <div className="fitting-room-viewport">
      {/* Caso: Permiso de webcam denegado (RN-M6-01) */}
      {webcamStatus === 'denied' && (
        <div className="fitting-permission-denied-card">
          <CameraOff size={48} className="text-rose-500" />
          <h3>Acceso a la cámara denegado</h3>
          <p>
            Para poder utilizar el Vestidor Virtual y superponer la prenda sobre tu cuerpo,
            es necesario autorizar el acceso a la cámara en tu navegador.
          </p>
          {onRequestPermissionAgain && (
            <button
              type="button"
              className="btn-retry-permission"
              onClick={onRequestPermissionAgain}
            >
              Reintentar permiso
            </button>
          )}
        </div>
      )}

      {/* Caso: Error general de cámara */}
      {webcamStatus === 'error' && (
        <div className="fitting-permission-denied-card">
          <ShieldAlert size={48} className="text-amber-500" />
          <h3>Error al conectar con la cámara</h3>
          <p>{webcamError || 'No se pudo iniciar la transmisión de video.'}</p>
        </div>
      )}

      {/* Stream de video activo y prenda en RA */}
      <div className="fitting-viewport-media">
        <WebcamCanvas
          setVideoElement={setVideoElement}
          setDebugCanvas={setDebugCanvas}
          onVideoReady={startDetection}
          onDimensionsChange={handleDimensionsChange}
          showDebugLandmarks={showDebugLandmarks}
        />

        {/* 1. Modo 3D Espacial con Three.js (Rotación Yaw, Pitch, Roll) */}
        {renderMode === '3d' && (
          <ThreeGarmentCanvas
            transform3D={garmentTransform3D}
            variant={currentVariant}
            trackingLost={trackingLost}
            poseResult={poseResult}
            videoWidth={videoDims.width}
            videoHeight={videoDims.height}
          />
        )}

        {/* 2. Modo 2D Dinámico Anatómico con Mangas o Foto Catálogo */}
        {renderMode === '2d' && (
          <GarmentOverlay
            transform={garmentTransform}
            variant={currentVariant}
            poseResult={poseResult}
            trackingLost={trackingLost}
            videoWidth={videoDims.width}
            videoHeight={videoDims.height}
          />
        )}

        {/* Selector de Modo 3D vs 2D en cabecera de la cámara */}
        <div className="fitting-mode-toggle-bar">
          <button
            type="button"
            className={`btn-mode-toggle ${renderMode === '3d' ? 'active' : ''}`}
            onClick={() => setRenderMode('3d')}
            title="Vista 3D con rotación de cuerpo y perfil (Three.js)"
          >
            <Box size={14} />
            <span>Modo 3D Espacial</span>
          </button>
          <button
            type="button"
            className={`btn-mode-toggle ${renderMode === '2d' ? 'active' : ''}`}
            onClick={() => setRenderMode('2d')}
            title="Vista plana con fotografía de catálogo"
          >
            <ImageIcon size={14} />
            <span>Vista Foto 2D</span>
          </button>
        </div>

        {/* Marca de agua / Badge RA */}
        <div className="fitting-ar-active-badge">
          <Sparkles size={13} />
          <span>{renderMode === '3d' ? '3D VIRTUAL FITTING' : 'REALIDAD AUMENTADA EN VIVO'}</span>
        </div>

        {/* Disclaimer inferior (RN-M6-12) */}
        <div className="fitting-ar-disclaimer-overlay">
          <span>Representación visual interactiva en tiempo real</span>
        </div>
      </div>
    </div>
  );
};
