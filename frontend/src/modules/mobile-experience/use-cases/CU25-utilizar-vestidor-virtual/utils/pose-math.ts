import type { PoseLandmark, PoseResult, GarmentTransform, Garment3DTransform } from '../types/virtual-fitting.types';

/* ─────────────── MediaPipe Pose Landmark Indices ─────────────── */
export const LANDMARK = {
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
} as const;

/** Umbral mínimo de visibilidad para hombros */
const SHOULDER_VISIBILITY_THRESHOLD = 0.25;

/**
 * Extrae los landmarks relevantes para prendas superiores (hombros, caderas, codos y muñecas).
 * Si las caderas quedan fuera del encuadre de la webcam (común en laptops/escritorio),
 * se proyectan anatómicamente a partir del ancho y posición de los hombros.
 */
export function extractTorsoLandmarks(
  landmarks: PoseLandmark[],
): PoseResult | null {
  const ls = landmarks[LANDMARK.LEFT_SHOULDER];
  const rs = landmarks[LANDMARK.RIGHT_SHOULDER];
  const lh = landmarks[LANDMARK.LEFT_HIP];
  const rh = landmarks[LANDMARK.RIGHT_HIP];

  if (!ls || !rs) return null;

  const shouldersVisible =
    (ls.visibility ?? 0) >= SHOULDER_VISIBILITY_THRESHOLD &&
    (rs.visibility ?? 0) >= SHOULDER_VISIBILITY_THRESHOLD;

  if (!shouldersVisible) return null;

  const hipsVisible =
    lh &&
    rh &&
    (lh.visibility ?? 0) >= 0.25 &&
    (rh.visibility ?? 0) >= 0.25;

  let effectiveLh = lh;
  let effectiveRh = rh;

  if (!hipsVisible || !effectiveLh || !effectiveRh) {
    // Proyección anatómica de torso si las caderas están fuera del visor
    const shoulderDx = rs.x - ls.x;
    const shoulderDy = rs.y - ls.y;
    const shoulderSpan = Math.sqrt(shoulderDx * shoulderDx + shoulderDy * shoulderDy);
    const torsoLen = Math.max(0.2, shoulderSpan * 1.35);

    effectiveLh = {
      x: ls.x,
      y: ls.y + torsoLen,
      z: ls.z,
      visibility: 0.85,
    };
    effectiveRh = {
      x: rs.x,
      y: rs.y + torsoLen,
      z: rs.z,
      visibility: 0.85,
    };
  }

  const avgConfidence = ((ls.visibility ?? 0) + (rs.visibility ?? 0)) / 2;

  return {
    leftShoulder: ls,
    rightShoulder: rs,
    leftHip: effectiveLh,
    rightHip: effectiveRh,
    leftElbow: landmarks[LANDMARK.LEFT_ELBOW],
    rightElbow: landmarks[LANDMARK.RIGHT_ELBOW],
    leftWrist: landmarks[LANDMARK.LEFT_WRIST],
    rightWrist: landmarks[LANDMARK.RIGHT_WRIST],
    allLandmarks: landmarks,
    isDetected: true,
    confidence: avgConfidence,
  };
}

/**
 * Calcula la transformación 2D de la prenda sobre la webcam reflejada (scaleX(-1)).
 *
 * @param pose   Resultado de la detección de pose
 * @param width  Ancho del canvas/video en píxeles
 * @param height Alto del canvas/video en píxeles
 */
export function computeGarmentTransform(
  pose: PoseResult,
  width: number,
  height: number,
): GarmentTransform {
  const { leftShoulder: ls, rightShoulder: rs, leftHip: lh, rightHip: rh } = pose;

  // En video con espejo (CSS scaleX(-1)):
  // El hombro derecho del usuario aparece a la derecha de la pantalla: (1 - rs.x) * width
  // El hombro izquierdo del usuario aparece a la izquierda de la pantalla: (1 - ls.x) * width
  const screenRsX = (1 - rs.x) * width;
  const screenLsX = (1 - ls.x) * width;
  const screenCenterX = (screenRsX + screenLsX) / 2;

  const shoulderMidY = ((ls.y + rs.y) / 2) * height;
  const hipMidY = ((lh.y + rh.y) / 2) * height;
  const torsoHeight = Math.max(height * 0.22, hipMidY - shoulderMidY);

  // La prenda se asienta colgando desde los hombros hacia el torso
  const x = screenCenterX;
  const y = shoulderMidY + torsoHeight * 0.42;

  // Distancia visible entre hombros en pantalla
  const shoulderSpan = Math.hypot(screenRsX - screenLsX, (rs.y - ls.y) * height);

  // Escala proporcionada: cubre hombros, pecho y caída de blusa
  const scaleX = shoulderSpan * 1.55;
  const scaleY = torsoHeight * 1.35;

  // Inclinación lateral (Roll) en pantalla reflejada:
  // Vector del hombro izquierdo al hombro derecho en pantalla
  const dx = screenRsX - screenLsX; // Positivo (de izquierda a derecha en pantalla)
  const dy = (rs.y - ls.y) * height;
  const rotation = Math.atan2(dy, Math.max(1, dx));

  return { x, y, scaleX, scaleY, rotation };
}

/**
 * Calcula la distancia euclidiana entre dos landmarks (normalizada 0..1).
 */
export function landmarkDistance(a: PoseLandmark, b: PoseLandmark): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/**
 * Calcula la transformación 3D (Posición, Rotaciones Euler y Escala) para Three.js
 * sincronizada milimétricamente con los puntos corporales sobre el video reflejado.
 */
export function computeGarment3DTransform(
  pose: PoseResult,
  cameraFov = 45,
  cameraDistance = 3.0,
  aspectRatio = 640 / 480,
  isMirrored = true,
): Garment3DTransform {
  const { leftShoulder: ls, rightShoulder: rs, leftHip: lh, rightHip: rh } = pose;

  // Dimensiones del plano visual a cameraDistance en Three.js
  const vFovRad = (cameraFov * Math.PI) / 180;
  const worldHeight = 2 * cameraDistance * Math.tan(vFovRad / 2);
  const worldWidth = worldHeight * aspectRatio;

  // Coordenadas normalizadas en pantalla (0..1) teniendo en cuenta el modo espejo
  const normCenterX = isMirrored ? (1 - (ls.x + rs.x) / 2) : (ls.x + rs.x) / 2;
  const shoulderMidY = (ls.y + rs.y) / 2;
  const hipMidY = (lh.y + rh.y) / 2;
  const torsoHeightNorm = Math.max(0.12, hipMidY - shoulderMidY);

  const screenDx = isMirrored ? (ls.x - rs.x) : (rs.x - ls.x);
  const screenDy = (rs.y - ls.y);
  const shoulderDepth = (rs.z - ls.z) * worldWidth;

  // Al girarse de perfil, la distancia X entre hombros se comprime en pantalla,
  // pero esa misma separación aparece en Z. Medir XYZ evita que la prenda entera
  // se haga pequeña cuando los dos puntos 2D parecen juntarse.
  const shoulderSpan3D = Math.hypot(
    screenDx * worldWidth,
    screenDy * worldHeight,
    shoulderDepth,
  );

  // Los GLB se normalizan a 1 unidad de alto y conservan su proporción. El modelo
  // base tiene un ancho superior aproximado de 0.82, por lo que calculamos X/Z desde
  // los hombros e Y desde el largo real del torso. Evitamos usar una única escala
  // mínima grande, que hacía que la prenda se recortara y no respetara el cuerpo.
  const normalizedGarmentShoulderWidth = 0.82;
  const shoulderFitPadding = 1.12;
  const shoulderBasedScale = Math.max(
    0.15,
    (shoulderSpan3D * shoulderFitPadding) / normalizedGarmentShoulderWidth,
  );

  const torsoHeightWorld = torsoHeightNorm * worldHeight;
  const desiredHeightScale = Math.max(0.15, torsoHeightWorld * 1.08);

  // El largo del torso aporta una segunda referencia estable si MediaPipe entrega
  // profundidad ruidosa durante un perfil pronunciado. No fuerza un tamaño fijo:
  // continúa creciendo o disminuyendo cuando la persona se acerca o se aleja.
  const torsoBasedScaleFloor = desiredHeightScale * 0.78;
  const scale = Math.max(shoulderBasedScale, torsoBasedScaleFloor);
  const scaleY = Math.max(
    scale * 0.75,
    Math.min(scale * 1.45, desiredHeightScale),
  );

  // Mapeo directo a coordenadas de Three.js:
  // MediaPipe no expone un punto de base del cuello. Lo estimamos elevando el ancla
  // desde la línea de hombros una fracción de su separación anatómica.
  const fittedShoulderSpan = (scale * normalizedGarmentShoulderWidth) / shoulderFitPadding;
  const neckLift = fittedShoulderSpan * 0.24;
  const posX = (normCenterX - 0.5) * worldWidth;
  const posY = -(shoulderMidY - 0.5) * worldHeight + neckLift;
  const posZ = 0;

  // 1. ROTACIÓN ROLL (Inclinación lateral de hombros)
  const rollAngle = Math.atan2(screenDy * worldHeight, Math.max(0.01, screenDx * worldWidth));
  const clampedRoll = Math.max(-0.45, Math.min(0.45, rollAngle));
  const rotZ = isMirrored ? -clampedRoll : clampedRoll;

  // 2. ROTACIÓN YAW (Giro del torso al ponerse de lado / perfil 360°):
  // Al ponerse de lado o girar el cuerpo, la prenda gira de perfil sincronizadamente.
  // En modo espejo, cuando el usuario gira hacia la derecha de la pantalla:
  // Su hombro izquierdo (en el lado izquierdo de la pantalla) se adelanta (ls.z menor),
  // mientras el hombro derecho se retrasa (rs.z mayor), de modo que (rs.z - ls.z) > 0.
  // Para que el frente de la prenda gire hacia +X (a la derecha en Three.js), rotY debe ser positivo.
  const rawDeltaZ = isMirrored ? (rs.z - ls.z) : (ls.z - rs.z);

  // Refuerzo con la posición relativa de la cabeza si la nariz está detectada
  const nose = pose.allLandmarks?.[0];
  let noseTurnFactor = 0;
  if (nose && (nose.visibility ?? 0) >= 0.4) {
    const shoulderMidX = (ls.x + rs.x) / 2;
    const diff = isMirrored ? (shoulderMidX - nose.x) : (nose.x - shoulderMidX);
    noseTurnFactor = diff * 2.2;
  }

  // Sensibilidad receptiva: permite giros naturales de 0° a ±75°
  const combinedYaw = rawDeltaZ * 4.2 + noseTurnFactor;
  const rotY = Math.max(-1.30, Math.min(1.30, combinedYaw));
  const yawDegrees = Math.round((rotY * 180) / Math.PI);

  // 3. ROTACIÓN PITCH: Estable
  const rotX = 0;

  return {
    posX,
    posY,
    posZ,
    rotX,
    rotY,
    rotZ,
    scale,
    scaleY,
    yawDegrees,
  };
}
