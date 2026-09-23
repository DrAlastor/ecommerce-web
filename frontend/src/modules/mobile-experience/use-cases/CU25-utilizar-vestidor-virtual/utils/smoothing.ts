/**
 * @caso-de-uso CU25 — Utilizar vestidor virtual
 * @subsistema Experiencia Móvil
 * @capa Soporte del caso de uso — Frontend web
 * @responsabilidad Aporta configuración, utilidades o contratos necesarios para completar el flujo del caso de uso.
 * @secuencia Cliente -> vestidor virtual -> controlador de experiencia -> servicios de cámara y renderizado -> Producto/Variante/Recursos 3D.
 */
import type { GarmentTransform, Garment3DTransform } from '../types/virtual-fitting.types';

/**
 * Filtro de suavizado mediante Exponential Moving Average (EMA).
 *
 * Reduce la vibración/temblor de la prenda virtual causado por
 * pequeñas variaciones en la detección de MediaPipe entre frames.
 *
 * Un factor más alto (cercano a 1.0) suaviza más pero agrega latencia.
 * Un factor más bajo (cercano a 0.0) responde más rápido pero tiembla más.
 *
 * Valor recomendado: 0.3–0.5
 */
export class TransformSmoother {
  private prev: GarmentTransform | null = null;
  private factor: number;

  constructor(smoothingFactor = 0.4) {
    this.factor = Math.max(0, Math.min(1, smoothingFactor));
  }

  /**
   * Aplica suavizado EMA al transform actual.
   * En el primer frame retorna el valor sin suavizar.
   */
  smooth(current: GarmentTransform): GarmentTransform {
    if (!this.prev) {
      this.prev = { ...current };
      return current;
    }

    const smoothed: GarmentTransform = {
      x: this.ema(this.prev.x, current.x),
      y: this.ema(this.prev.y, current.y),
      scaleX: this.ema(this.prev.scaleX, current.scaleX),
      scaleY: this.ema(this.prev.scaleY, current.scaleY),
      rotation: this.emaAngle(this.prev.rotation, current.rotation),
    };

    this.prev = { ...smoothed };
    return smoothed;
  }

  /** Reinicia el estado del suavizador (para recalibración) */
  reset(): void {
    this.prev = null;
  }

  /** Ajusta el factor de suavizado en tiempo real */
  setFactor(factor: number): void {
    this.factor = Math.max(0, Math.min(1, factor));
  }

  private ema(prev: number, curr: number): number {
    return prev + (1 - this.factor) * (curr - prev);
  }

  /**
   * EMA para ángulos, manejando correctamente el wrapping
   * alrededor de ±π para evitar saltos bruscos.
   */
  private emaAngle(prev: number, curr: number): number {
    let diff = curr - prev;
    // Normalizar la diferencia al rango [-π, π]
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    return prev + (1 - this.factor) * diff;
  }
}

/**
 * Filtro de suavizado EMA para transformaciones tridimensionales (Three.js).
 */
export class Transform3DSmoother {
  private prev: Garment3DTransform | null = null;
  private factor: number;

  constructor(smoothingFactor = 0.35) {
    this.factor = Math.max(0, Math.min(1, smoothingFactor));
  }

  smooth(current: Garment3DTransform): Garment3DTransform {
    if (!this.prev) {
      this.prev = { ...current };
      return current;
    }

    // Filtro de zona muerta para eliminar micro-temblores cuando el usuario está quieto
    const dX = Math.abs(current.posX - this.prev.posX);
    const dY = Math.abs(current.posY - this.prev.posY);
    const posX = dX < 0.004 ? this.prev.posX : this.ema(this.prev.posX, current.posX);
    const posY = dY < 0.004 ? this.prev.posY : this.ema(this.prev.posY, current.posY);

    const dRotZ = Math.abs(current.rotZ - this.prev.rotZ);
    const rotZ = dRotZ < 0.015 ? this.prev.rotZ : this.emaAngle(this.prev.rotZ, current.rotZ);

    // Giro corporal fluido y reactivo al girar de lado
    const dRotY = Math.abs(current.rotY - this.prev.rotY);
    const rotY = dRotY < 0.006 ? this.prev.rotY : this.emaAngleResponsive(this.prev.rotY, current.rotY);

    const dScale = Math.abs(current.scale - this.prev.scale);
    const scale = dScale < 0.006 ? this.prev.scale : this.ema(this.prev.scale, current.scale);

    const dScaleY = Math.abs(current.scaleY - this.prev.scaleY);
    const scaleY = dScaleY < 0.006
      ? this.prev.scaleY
      : this.ema(this.prev.scaleY, current.scaleY);

    const smoothed: Garment3DTransform = {
      posX,
      posY,
      posZ: this.ema(this.prev.posZ, current.posZ),
      rotX: this.emaAngle(this.prev.rotX, current.rotX),
      rotY,
      rotZ,
      scale,
      scaleY,
      yawDegrees: Math.round((rotY * 180) / Math.PI),
    };

    this.prev = { ...smoothed };
    return smoothed;
  }

  reset(): void {
    this.prev = null;
  }

  setFactor(factor: number): void {
    this.factor = Math.max(0, Math.min(1, factor));
  }

  private ema(prev: number, curr: number): number {
    return prev + (1 - this.factor) * (curr - prev);
  }

  private emaAngle(prev: number, curr: number): number {
    let diff = curr - prev;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    return prev + (1 - this.factor) * diff;
  }

  private emaAngleResponsive(prev: number, curr: number): number {
    let diff = curr - prev;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    // Factor de suavizado más dinámico (0.45) para responder rápidamente al giro corporal
    const responsiveFactor = 0.45;
    return prev + (1 - responsiveFactor) * diff;
  }
}
