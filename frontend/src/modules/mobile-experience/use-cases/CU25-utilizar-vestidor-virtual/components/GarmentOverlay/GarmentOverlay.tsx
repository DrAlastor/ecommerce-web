/**
 * @caso-de-uso CU25 — Utilizar vestidor virtual
 * @subsistema Experiencia Móvil
 * @capa Boundary — Frontend web
 * @responsabilidad Implementa una parte reutilizable de la interfaz de Frontend web y comunica eventos al controlador de presentación.
 * @secuencia Cliente -> vestidor virtual -> controlador de experiencia -> servicios de cámara y renderizado -> Producto/Variante/Recursos 3D.
 */
import React, { useEffect, useRef, useState } from 'react';
import type { GarmentTransform, ArVariant, PoseResult } from '../../types/virtual-fitting.types';
import {
  drawGarment2D,
  resolveGarmentKind,
  type DynamicGarmentStyle,
} from '../../utils/garment-2d-renderer';
import { AlertCircle, Shirt, Scissors, Eye, Sparkles } from 'lucide-react';
import './GarmentOverlay.css';

interface GarmentOverlayProps {
  transform: GarmentTransform | null;
  variant: ArVariant | null;
  poseResult?: PoseResult | null;
  trackingLost: boolean;
  videoWidth?: number;
  videoHeight?: number;
}

type StyleMode = DynamicGarmentStyle | 'foto';

function resolveColor(variant: ArVariant | null): string {
  if (!variant) return '#D6C6A5';
  const name = variant.color.nombre.toLowerCase();
  if (name.includes('marfil') || name.includes('blanco') || name.includes('crema')) return '#F6F3EB';
  if (name.includes('mocha') || name.includes('moca') || name.includes('marron') || name.includes('marrón')) return '#6E4F42';
  if (name.includes('beige')) return '#D6C6A5';
  if (name.includes('negro')) return '#1E1E22';
  return '#D6C6A5';
}

export const GarmentOverlay: React.FC<GarmentOverlayProps> = ({
  transform,
  variant,
  poseResult,
  trackingLost,
  videoWidth = 640,
  videoHeight = 480,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<StyleMode>('manga-larga');
  const baseColor = resolveColor(variant);
  const garmentKind = resolveGarmentKind(variant?.modelo_3d_url);
  const isDress = garmentKind === 'night-dress' || garmentKind === 'slip-dress';
  const styleMode: StyleMode = isDress && selectedStyle !== 'foto'
    ? 'sin-mangas'
    : selectedStyle;

  useEffect(() => {
    if (styleMode === 'foto') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, videoWidth, videoHeight);
    if (!poseResult?.isDetected || trackingLost) return;

    drawGarment2D(ctx, {
      pose: poseResult,
      style: styleMode,
      color: baseColor,
      modelUrl: variant?.modelo_3d_url,
      width: videoWidth,
      height: videoHeight,
    });
  }, [
    poseResult,
    trackingLost,
    styleMode,
    baseColor,
    variant?.modelo_3d_url,
    videoWidth,
    videoHeight,
  ]);

  return (
    <div className="garment-overlay-container">
      {trackingLost && (
        <div className="tracking-lost-alert">
          <AlertCircle size={20} />
          <span>Posición corporal perdida. Procura mantener visible tu torso.</span>
        </div>
      )}

      {styleMode !== 'foto' && (
        <canvas
          ref={canvasRef}
          className="garment-dynamic-canvas"
          width={videoWidth}
          height={videoHeight}
        />
      )}

      {styleMode === 'foto' && !trackingLost && (
        <div
          className="garment-entity-wrapper"
          style={
            transform
              ? {
                  left: `${(transform.x / videoWidth) * 100}%`,
                  top: `${(transform.y / videoHeight) * 100}%`,
                  width: `${transform.scaleX}px`,
                  height: `${transform.scaleY}px`,
                  transform: `translate(-50%, -50%) rotate(${transform.rotation}rad)`,
                }
              : {
                  left: '50%',
                  top: '45%',
                  width: '320px',
                  height: '380px',
                  transform: 'translate(-50%, -50%)',
                }
          }
        >
          {variant?.imagen_url ? (
            <img
              src={variant.imagen_url}
              alt={variant.sku}
              className="garment-image-fitted"
              onError={(event) => {
                event.currentTarget.src = '/assets/fitting/tshirt-default.png';
              }}
            />
          ) : (
            <div className="garment-size-badge">
              <span>Cargando prenda…</span>
            </div>
          )}
        </div>
      )}

      <div className="garment-style-selector-bar">
        {isDress ? (
          <button type="button" className="btn-style-pill active" disabled>
            <Sparkles size={13} />
            <span>Silueta del vestido</span>
          </button>
        ) : (
          <>
            <button
              type="button"
              className={`btn-style-pill ${styleMode === 'manga-larga' ? 'active' : ''}`}
              onClick={() => setSelectedStyle('manga-larga')}
              title="Manga larga anatómica que sigue los brazos"
            >
              <Shirt size={13} />
              <span>Manga larga</span>
            </button>
            <button
              type="button"
              className={`btn-style-pill ${styleMode === 'manga-corta' ? 'active' : ''}`}
              onClick={() => setSelectedStyle('manga-corta')}
              title="Manga corta adaptada al brazo"
            >
              <Scissors size={13} />
              <span>Manga corta</span>
            </button>
            <button
              type="button"
              className={`btn-style-pill ${styleMode === 'sin-mangas' ? 'active' : ''}`}
              onClick={() => setSelectedStyle('sin-mangas')}
              title="Silueta sin mangas"
            >
              <span>Sin mangas</span>
            </button>
          </>
        )}
        <button
          type="button"
          className={`btn-style-pill ${styleMode === 'foto' ? 'active' : ''}`}
          onClick={() => setSelectedStyle('foto')}
          title="Fotografía plana del catálogo"
        >
          <Eye size={13} />
          <span>Foto catálogo</span>
        </button>
      </div>
    </div>
  );
};
