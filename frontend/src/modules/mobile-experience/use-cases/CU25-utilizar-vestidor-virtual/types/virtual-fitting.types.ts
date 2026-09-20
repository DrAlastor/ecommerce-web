/* ═══════════════════════════════════════════════════════════════
   CU25 — Utilizar Vestidor Virtual — Types
   ═══════════════════════════════════════════════════════════════ */

/** Variante compatible con RA */
export interface ArVariant {
  id_producto_variante: number;
  sku: string;
  precio_variante: number;
  precio_final: number;
  tiene_descuento: boolean;
  descuento_porcentaje: number;
  modelo_3d_url: string;
  imagen_url: string | null;
  estado: string;
  talla: { id_talla: number; codigo: string };
  color: { id_color: number; nombre: string; codigo_hex: string | null };
  total_stock: number;
}

/** Variante con datos extendidos del producto */
export interface ArVariantDetail extends ArVariant {
  producto: ProductSummary;
}

/** Resumen del producto para el vestidor */
export interface ProductSummary {
  id_producto: number;
  nombre: string;
  descripcion: string | null;
  precio_base: number;
  categoria: string;
}

/** Respuesta del endpoint de variantes RA por producto */
export interface ArVariantsResponse {
  producto: ProductSummary;
  variantes: ArVariant[];
  tallas_disponibles: Array<{ id_talla: number; codigo: string }>;
  colores_disponibles: Array<{ id_color: number; nombre: string; codigo_hex: string | null }>;
}

/* ───────────────── Pose Detection Types ───────────────── */

/** Punto detectado del cuerpo (landmark) */
export interface PoseLandmark {
  x: number; // 0..1 relativo al ancho del frame
  y: number; // 0..1 relativo al alto del frame
  z: number; // profundidad
  visibility: number; // 0..1
}

/** Resultado de la detección de pose */
export interface PoseResult {
  leftShoulder: PoseLandmark;
  rightShoulder: PoseLandmark;
  leftHip: PoseLandmark;
  rightHip: PoseLandmark;
  leftElbow?: PoseLandmark;
  rightElbow?: PoseLandmark;
  leftWrist?: PoseLandmark;
  rightWrist?: PoseLandmark;
  allLandmarks?: PoseLandmark[];
  isDetected: boolean;
  confidence: number;
}

/* ───────────────── Garment Transform Types ───────────────── */

/** Transformación calculada para posicionar la prenda en 2D */
export interface GarmentTransform {
  x: number;           // Posición X en pixels
  y: number;           // Posición Y en pixels
  scaleX: number;      // Escala horizontal
  scaleY: number;      // Escala vertical
  rotation: number;    // Rotación en radianes
}

/** Transformación 3D para renderizado en espacio tridimensional (Three.js) */
export interface Garment3DTransform {
  posX: number;        // Coordenada X (-worldWidth..+worldWidth)
  posY: number;        // Coordenada Y
  posZ: number;        // Profundidad Z
  rotX: number;        // Pitch (inclinación frontal)
  rotY: number;        // Yaw (giro de perfil 360°)
  rotZ: number;        // Roll (inclinación hombros)
  scale: number;       // Escala tridimensional
  scaleY: number;      // Escala de altura del torso
  yawDegrees: number;  // Giro en grados para métricas visuales
}

/* ───────────────── Webcam Types ───────────────── */

export type WebcamStatus = 'idle' | 'requesting' | 'active' | 'denied' | 'error' | 'not-supported';

/* ───────────────── Fitting State ───────────────── */

export type FittingPhase = 'loading' | 'calibration' | 'fitting' | 'error';
