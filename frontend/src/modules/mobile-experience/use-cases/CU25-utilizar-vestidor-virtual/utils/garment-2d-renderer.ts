import type { PoseResult } from '../types/virtual-fitting.types';

export type DynamicGarmentStyle = 'manga-larga' | 'manga-corta' | 'sin-mangas';
export type GarmentKind = 'blouse' | 'sweetheart' | 'knit' | 'night-dress' | 'slip-dress';

interface Point {
  x: number;
  y: number;
}

interface DrawGarmentOptions {
  pose: PoseResult;
  style: DynamicGarmentStyle;
  color: string;
  modelUrl?: string | null;
  width: number;
  height: number;
}

interface Bounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

interface TorsoShape {
  path: Path2D;
  bounds: Bounds;
  neckCenter: Point;
  neckLeft: Point;
  neckRight: Point;
  neckBottom: Point;
  hemY: number;
  shoulderSpan: number;
}

const LANDMARK = {
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
} as const;

export function resolveGarmentKind(modelUrl?: string | null): GarmentKind {
  const normalized = (modelUrl || '').toLowerCase();
  if (normalized.includes('vestido_noche')) return 'night-dress';
  if (normalized.includes('vestido_slip')) return 'slip-dress';
  if (normalized.includes('top_punto')) return 'knit';
  if (normalized.includes('top_sweetra')) return 'sweetheart';
  return 'blouse';
}

function parseHex(hex: string): [number, number, number] {
  const clean = hex.replace('#', '').trim();
  const expanded = clean.length === 3
    ? clean.split('').map((char) => char + char).join('')
    : clean.padEnd(6, '0').slice(0, 6);
  const value = Number.parseInt(expanded, 16);
  if (Number.isNaN(value)) return [246, 243, 235];
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function colorWithAlpha(hex: string, alpha: number): string {
  const [r, g, b] = parseHex(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function adjustBrightness(hex: string, amount: number): string {
  const [r, g, b] = parseHex(hex);
  const clamp = (value: number) => Math.max(0, Math.min(255, value));
  return `rgb(${clamp(r + amount)}, ${clamp(g + amount)}, ${clamp(b + amount)})`;
}

function point(x: number, y: number): Point {
  return { x, y };
}

function mix(a: Point, b: Point, ratio: number): Point {
  return point(a.x + (b.x - a.x) * ratio, a.y + (b.y - a.y) * ratio);
}

function normal(a: Point, b: Point): Point {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.max(0.001, Math.hypot(dx, dy));
  return point(-dy / length, dx / length);
}

function offset(p: Point, direction: Point, distance: number): Point {
  return point(p.x + direction.x * distance, p.y + direction.y * distance);
}

function toCanvasPoint(landmark: { x: number; y: number }, width: number, height: number): Point {
  return point(landmark.x * width, landmark.y * height);
}

function createFabricGradient(
  ctx: CanvasRenderingContext2D,
  bounds: Bounds,
  color: string,
): CanvasGradient {
  const gradient = ctx.createLinearGradient(bounds.left, 0, bounds.right, 0);
  gradient.addColorStop(0, adjustBrightness(color, -42));
  gradient.addColorStop(0.14, adjustBrightness(color, -12));
  gradient.addColorStop(0.36, adjustBrightness(color, 20));
  gradient.addColorStop(0.52, adjustBrightness(color, 7));
  gradient.addColorStop(0.72, adjustBrightness(color, 24));
  gradient.addColorStop(0.9, adjustBrightness(color, -9));
  gradient.addColorStop(1, adjustBrightness(color, -38));
  return gradient;
}

function paintFabric(
  ctx: CanvasRenderingContext2D,
  path: Path2D,
  bounds: Bounds,
  color: string,
  kind: GarmentKind,
): void {
  ctx.save();
  ctx.shadowColor = 'rgba(2, 6, 23, 0.34)';
  ctx.shadowBlur = 13;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = createFabricGradient(ctx, bounds, color);
  ctx.fill(path);

  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 1.25;
  ctx.strokeStyle = colorWithAlpha(adjustBrightness(color, -55), 0.5);
  ctx.stroke(path);

  ctx.clip(path);

  const falloff = ctx.createLinearGradient(0, bounds.top, 0, bounds.bottom);
  falloff.addColorStop(0, 'rgba(255,255,255,0.2)');
  falloff.addColorStop(0.42, 'rgba(255,255,255,0)');
  falloff.addColorStop(1, 'rgba(2,6,23,0.16)');
  ctx.fillStyle = falloff;
  ctx.fillRect(bounds.left, bounds.top, bounds.right - bounds.left, bounds.bottom - bounds.top);

  if (kind === 'knit') {
    ctx.lineWidth = 0.65;
    ctx.strokeStyle = colorWithAlpha(adjustBrightness(color, -55), 0.18);
    const spacing = Math.max(4, (bounds.right - bounds.left) / 34);
    for (let x = bounds.left; x <= bounds.right; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, bounds.top);
      ctx.lineTo(x, bounds.bottom);
      ctx.stroke();
    }
  } else {
    const sheen = ctx.createLinearGradient(bounds.left, 0, bounds.right, 0);
    sheen.addColorStop(0, 'rgba(255,255,255,0)');
    sheen.addColorStop(0.43, 'rgba(255,255,255,0.02)');
    sheen.addColorStop(0.54, 'rgba(255,255,255,0.2)');
    sheen.addColorStop(0.64, 'rgba(255,255,255,0.015)');
    sheen.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sheen;
    ctx.fillRect(bounds.left, bounds.top, bounds.right - bounds.left, bounds.bottom - bounds.top);
  }

  ctx.restore();
}

function drawSleeve(
  ctx: CanvasRenderingContext2D,
  shoulder: Point,
  elbow: Point,
  wrist: Point,
  torsoCenterX: number,
  shoulderSpan: number,
  style: DynamicGarmentStyle,
  color: string,
  kind: GarmentKind,
): void {
  if (style === 'sin-mangas') return;

  const isShort = style === 'manga-corta';
  const outward = shoulder.x < torsoCenterX ? -1 : 1;
  const safeElbow = Number.isFinite(elbow.x)
    ? elbow
    : point(shoulder.x + outward * shoulderSpan * 0.46, shoulder.y + shoulderSpan * 0.62);
  const safeWrist = Number.isFinite(wrist.x)
    ? wrist
    : point(safeElbow.x + outward * shoulderSpan * 0.32, safeElbow.y + shoulderSpan * 0.58);

  const end = isShort ? mix(shoulder, safeElbow, 0.62) : safeWrist;
  const middle = isShort ? mix(shoulder, safeElbow, 0.55) : safeElbow;
  const nShoulder = normal(shoulder, middle);
  const nEnd = normal(middle, end);
  const nMiddleRaw = point(nShoulder.x + nEnd.x, nShoulder.y + nEnd.y);
  const nMiddleLength = Math.max(0.001, Math.hypot(nMiddleRaw.x, nMiddleRaw.y));
  const nMiddle = point(nMiddleRaw.x / nMiddleLength, nMiddleRaw.y / nMiddleLength);

  const shoulderHalf = shoulderSpan * 0.125;
  const middleHalf = shoulderSpan * (isShort ? 0.105 : 0.095);
  const endHalf = shoulderSpan * (isShort ? 0.09 : 0.058);

  const s1 = offset(shoulder, nShoulder, shoulderHalf);
  const s2 = offset(shoulder, nShoulder, -shoulderHalf);
  const m1 = offset(middle, nMiddle, middleHalf);
  const m2 = offset(middle, nMiddle, -middleHalf);
  const e1 = offset(end, nEnd, endHalf);
  const e2 = offset(end, nEnd, -endHalf);

  const path = new Path2D();
  path.moveTo(s1.x, s1.y);
  path.bezierCurveTo(
    mix(s1, m1, 0.42).x,
    mix(s1, m1, 0.42).y,
    mix(s1, m1, 0.78).x,
    mix(s1, m1, 0.78).y,
    m1.x,
    m1.y,
  );
  path.bezierCurveTo(
    mix(m1, e1, 0.34).x,
    mix(m1, e1, 0.34).y,
    mix(m1, e1, 0.78).x,
    mix(m1, e1, 0.78).y,
    e1.x,
    e1.y,
  );
  path.quadraticCurveTo(end.x + outward * shoulderSpan * 0.018, end.y, e2.x, e2.y);
  path.bezierCurveTo(
    mix(e2, m2, 0.3).x,
    mix(e2, m2, 0.3).y,
    mix(e2, m2, 0.76).x,
    mix(e2, m2, 0.76).y,
    m2.x,
    m2.y,
  );
  path.bezierCurveTo(
    mix(m2, s2, 0.28).x,
    mix(m2, s2, 0.28).y,
    mix(m2, s2, 0.74).x,
    mix(m2, s2, 0.74).y,
    s2.x,
    s2.y,
  );
  path.closePath();

  paintFabric(ctx, path, {
    left: Math.min(s1.x, s2.x, m1.x, m2.x, e1.x, e2.x),
    right: Math.max(s1.x, s2.x, m1.x, m2.x, e1.x, e2.x),
    top: Math.min(s1.y, s2.y, m1.y, m2.y, e1.y, e2.y),
    bottom: Math.max(s1.y, s2.y, m1.y, m2.y, e1.y, e2.y),
  }, color, kind);

  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = colorWithAlpha(adjustBrightness(color, -65), 0.34);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(safeElbow.x, safeElbow.y);
  ctx.quadraticCurveTo(middle.x, middle.y, end.x, end.y);
  ctx.stroke();

  ctx.strokeStyle = colorWithAlpha(adjustBrightness(color, -70), 0.55);
  ctx.lineWidth = Math.max(1.2, shoulderSpan * 0.012);
  ctx.beginPath();
  ctx.moveTo(e1.x, e1.y);
  ctx.quadraticCurveTo(end.x, end.y + shoulderSpan * 0.012, e2.x, e2.y);
  ctx.stroke();
  ctx.restore();
}

function createTorsoShape(
  pose: PoseResult,
  width: number,
  height: number,
  kind: GarmentKind,
): TorsoShape {
  const pLS = toCanvasPoint(pose.leftShoulder, width, height);
  const pRS = toCanvasPoint(pose.rightShoulder, width, height);
  const pLH = toCanvasPoint(pose.leftHip, width, height);
  const pRH = toCanvasPoint(pose.rightHip, width, height);

  const ordered = pLS.x <= pRS.x
    ? { leftShoulder: pLS, rightShoulder: pRS, leftHip: pLH, rightHip: pRH }
    : { leftShoulder: pRS, rightShoulder: pLS, leftHip: pRH, rightHip: pLH };

  const { leftShoulder, rightShoulder, leftHip, rightHip } = ordered;
  const shoulderSpan = Math.max(30, Math.hypot(
    rightShoulder.x - leftShoulder.x,
    rightShoulder.y - leftShoulder.y,
  ));
  const shoulderMid = mix(leftShoulder, rightShoulder, 0.5);
  const hipMid = mix(leftHip, rightHip, 0.5);
  const torsoHeight = Math.max(shoulderSpan * 1.05, hipMid.y - shoulderMid.y);
  const centerX = shoulderMid.x;
  const isDress = kind === 'night-dress' || kind === 'slip-dress';

  const neckCenter = point(centerX, shoulderMid.y - shoulderSpan * 0.22);
  const neckHalf = shoulderSpan * (kind === 'night-dress' ? 0.1 : 0.17);
  const neckLeft = point(centerX - neckHalf, shoulderMid.y - shoulderSpan * 0.1);
  const neckRight = point(centerX + neckHalf, shoulderMid.y - shoulderSpan * 0.1);
  const neckDepth = kind === 'slip-dress' || kind === 'sweetheart' ? 0.2 : 0.12;
  const neckBottom = point(centerX, shoulderMid.y + shoulderSpan * neckDepth);

  const outerLeftShoulder = point(
    leftShoulder.x - shoulderSpan * 0.075,
    leftShoulder.y + shoulderSpan * 0.02,
  );
  const outerRightShoulder = point(
    rightShoulder.x + shoulderSpan * 0.075,
    rightShoulder.y + shoulderSpan * 0.02,
  );
  const leftArmpit = point(leftShoulder.x - shoulderSpan * 0.035, shoulderMid.y + shoulderSpan * 0.3);
  const rightArmpit = point(rightShoulder.x + shoulderSpan * 0.035, shoulderMid.y + shoulderSpan * 0.3);
  const waistY = shoulderMid.y + torsoHeight * 0.62;
  const waistHalf = Math.max(
    shoulderSpan * 0.31,
    Math.abs(rightHip.x - leftHip.x) * 0.43,
  );
  const leftWaist = point(centerX - waistHalf, waistY);
  const rightWaist = point(centerX + waistHalf, waistY);

  let hemY = hipMid.y + torsoHeight * 0.1;
  let leftHem = point(leftHip.x - shoulderSpan * 0.07, hemY);
  let rightHem = point(rightHip.x + shoulderSpan * 0.07, hemY);

  if (isDress) {
    const leftKnee = pose.allLandmarks?.[LANDMARK.LEFT_KNEE];
    const rightKnee = pose.allLandmarks?.[LANDMARK.RIGHT_KNEE];
    const kneesVisible = leftKnee && rightKnee
      && (leftKnee.visibility ?? 0) >= 0.25
      && (rightKnee.visibility ?? 0) >= 0.25;
    const kneeY = kneesVisible
      ? ((leftKnee.y + rightKnee.y) / 2) * height
      : hipMid.y + torsoHeight * 1.15;
    hemY = Math.min(height * 1.03, Math.max(hipMid.y + torsoHeight * 0.9, kneeY));
    const hemHalf = kind === 'night-dress'
      ? Math.max(shoulderSpan * 0.72, waistHalf * 1.72)
      : Math.max(shoulderSpan * 0.48, waistHalf * 1.18);
    leftHem = point(centerX - hemHalf, hemY);
    rightHem = point(centerX + hemHalf, hemY);
  }

  const path = new Path2D();
  path.moveTo(neckLeft.x, neckLeft.y);
  path.bezierCurveTo(
    neckLeft.x - shoulderSpan * 0.12,
    neckLeft.y - shoulderSpan * 0.035,
    outerLeftShoulder.x + shoulderSpan * 0.1,
    outerLeftShoulder.y,
    outerLeftShoulder.x,
    outerLeftShoulder.y,
  );
  path.bezierCurveTo(
    outerLeftShoulder.x - shoulderSpan * 0.025,
    outerLeftShoulder.y + shoulderSpan * 0.12,
    leftArmpit.x,
    leftArmpit.y - shoulderSpan * 0.08,
    leftArmpit.x,
    leftArmpit.y,
  );
  path.bezierCurveTo(
    leftArmpit.x + shoulderSpan * 0.01,
    waistY - torsoHeight * 0.28,
    leftWaist.x,
    waistY - torsoHeight * 0.08,
    leftWaist.x,
    leftWaist.y,
  );
  path.bezierCurveTo(
    leftWaist.x,
    waistY + (hemY - waistY) * 0.38,
    leftHem.x,
    hemY - (hemY - waistY) * 0.18,
    leftHem.x,
    leftHem.y,
  );
  path.quadraticCurveTo(centerX, hemY + shoulderSpan * 0.055, rightHem.x, rightHem.y);
  path.bezierCurveTo(
    rightHem.x,
    hemY - (hemY - waistY) * 0.18,
    rightWaist.x,
    waistY + (hemY - waistY) * 0.38,
    rightWaist.x,
    rightWaist.y,
  );
  path.bezierCurveTo(
    rightWaist.x,
    waistY - torsoHeight * 0.08,
    rightArmpit.x - shoulderSpan * 0.01,
    waistY - torsoHeight * 0.28,
    rightArmpit.x,
    rightArmpit.y,
  );
  path.bezierCurveTo(
    rightArmpit.x,
    rightArmpit.y - shoulderSpan * 0.08,
    outerRightShoulder.x + shoulderSpan * 0.025,
    outerRightShoulder.y + shoulderSpan * 0.12,
    outerRightShoulder.x,
    outerRightShoulder.y,
  );
  path.bezierCurveTo(
    outerRightShoulder.x - shoulderSpan * 0.1,
    outerRightShoulder.y,
    neckRight.x + shoulderSpan * 0.12,
    neckRight.y - shoulderSpan * 0.035,
    neckRight.x,
    neckRight.y,
  );
  path.quadraticCurveTo(neckBottom.x, neckBottom.y, neckLeft.x, neckLeft.y);
  path.closePath();

  return {
    path,
    bounds: {
      left: Math.min(outerLeftShoulder.x, leftHem.x),
      right: Math.max(outerRightShoulder.x, rightHem.x),
      top: neckCenter.y,
      bottom: hemY + shoulderSpan * 0.06,
    },
    neckCenter,
    neckLeft,
    neckRight,
    neckBottom,
    hemY,
    shoulderSpan,
  };
}

function drawBlouseDetails(
  ctx: CanvasRenderingContext2D,
  shape: TorsoShape,
  color: string,
): void {
  const { neckCenter, neckLeft, neckRight, neckBottom, hemY, shoulderSpan } = shape;
  const leftLapel = new Path2D();
  leftLapel.moveTo(neckCenter.x - shoulderSpan * 0.025, neckCenter.y);
  leftLapel.lineTo(neckLeft.x - shoulderSpan * 0.035, neckLeft.y);
  leftLapel.lineTo(neckBottom.x - shoulderSpan * 0.035, neckBottom.y + shoulderSpan * 0.09);
  leftLapel.lineTo(neckBottom.x - shoulderSpan * 0.015, neckBottom.y);
  leftLapel.closePath();

  const rightLapel = new Path2D();
  rightLapel.moveTo(neckCenter.x + shoulderSpan * 0.025, neckCenter.y);
  rightLapel.lineTo(neckRight.x + shoulderSpan * 0.035, neckRight.y);
  rightLapel.lineTo(neckBottom.x + shoulderSpan * 0.035, neckBottom.y + shoulderSpan * 0.09);
  rightLapel.lineTo(neckBottom.x + shoulderSpan * 0.015, neckBottom.y);
  rightLapel.closePath();

  ctx.save();
  ctx.fillStyle = colorWithAlpha(adjustBrightness(color, 24), 0.76);
  ctx.strokeStyle = colorWithAlpha(adjustBrightness(color, -55), 0.42);
  ctx.lineWidth = 1.15;
  ctx.fill(leftLapel);
  ctx.stroke(leftLapel);
  ctx.fill(rightLapel);
  ctx.stroke(rightLapel);

  ctx.beginPath();
  ctx.moveTo(neckBottom.x, neckBottom.y + shoulderSpan * 0.055);
  ctx.lineTo(neckBottom.x, hemY - shoulderSpan * 0.06);
  ctx.strokeStyle = colorWithAlpha(adjustBrightness(color, -60), 0.3);
  ctx.lineWidth = Math.max(1, shoulderSpan * 0.008);
  ctx.stroke();

  const buttons = 5;
  const startY = neckBottom.y + shoulderSpan * 0.18;
  const endY = hemY - shoulderSpan * 0.14;
  const radius = Math.max(1.5, Math.min(2.8, shoulderSpan * 0.012));
  for (let index = 0; index < buttons; index += 1) {
    const y = startY + ((endY - startY) * index) / (buttons - 1);
    ctx.beginPath();
    ctx.arc(neckBottom.x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = colorWithAlpha(adjustBrightness(color, 54), 0.9);
    ctx.fill();
    ctx.strokeStyle = colorWithAlpha(adjustBrightness(color, -65), 0.48);
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }
  ctx.restore();
}

function drawDrapeDetails(
  ctx: CanvasRenderingContext2D,
  shape: TorsoShape,
  color: string,
  kind: GarmentKind,
): void {
  const { bounds, neckBottom, hemY, shoulderSpan } = shape;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(0.8, shoulderSpan * 0.006);
  const lines = kind === 'night-dress' ? 7 : 4;
  for (let index = 1; index <= lines; index += 1) {
    const ratio = index / (lines + 1);
    const topX = neckBottom.x + (ratio - 0.5) * shoulderSpan * 0.4;
    const bottomX = bounds.left + (bounds.right - bounds.left) * ratio;
    const gradient = ctx.createLinearGradient(0, neckBottom.y, 0, hemY);
    gradient.addColorStop(0, colorWithAlpha(adjustBrightness(color, 34), 0.14));
    gradient.addColorStop(1, colorWithAlpha(adjustBrightness(color, -64), 0.3));
    ctx.strokeStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(topX, neckBottom.y + shoulderSpan * 0.08);
    ctx.bezierCurveTo(
      topX + (ratio - 0.5) * shoulderSpan * 0.1,
      neckBottom.y + (hemY - neckBottom.y) * 0.35,
      bottomX - (ratio - 0.5) * shoulderSpan * 0.12,
      neckBottom.y + (hemY - neckBottom.y) * 0.72,
      bottomX,
      hemY,
    );
    ctx.stroke();
  }
  ctx.restore();
}

function drawNeckline(
  ctx: CanvasRenderingContext2D,
  shape: TorsoShape,
  color: string,
  kind: GarmentKind,
): void {
  const { neckLeft, neckRight, neckBottom, shoulderSpan } = shape;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = colorWithAlpha(adjustBrightness(color, -58), 0.52);
  ctx.lineWidth = Math.max(1.2, shoulderSpan * 0.012);
  ctx.beginPath();
  ctx.moveTo(neckLeft.x, neckLeft.y);
  if (kind === 'sweetheart') {
    ctx.bezierCurveTo(
      neckLeft.x + shoulderSpan * 0.11,
      neckLeft.y + shoulderSpan * 0.035,
      neckBottom.x - shoulderSpan * 0.09,
      neckBottom.y - shoulderSpan * 0.06,
      neckBottom.x,
      neckBottom.y,
    );
    ctx.bezierCurveTo(
      neckBottom.x + shoulderSpan * 0.09,
      neckBottom.y - shoulderSpan * 0.06,
      neckRight.x - shoulderSpan * 0.11,
      neckRight.y + shoulderSpan * 0.035,
      neckRight.x,
      neckRight.y,
    );
  } else if (kind === 'slip-dress') {
    ctx.lineTo(neckBottom.x, neckBottom.y);
    ctx.lineTo(neckRight.x, neckRight.y);
  } else {
    ctx.quadraticCurveTo(neckBottom.x, neckBottom.y, neckRight.x, neckRight.y);
  }
  ctx.stroke();
  ctx.restore();
}

export function drawGarment2D(
  ctx: CanvasRenderingContext2D,
  options: DrawGarmentOptions,
): void {
  const { pose, style, color, modelUrl, width, height } = options;
  const kind = resolveGarmentKind(modelUrl);
  const isDress = kind === 'night-dress' || kind === 'slip-dress';
  const shape = createTorsoShape(pose, width, height, kind);

  const pLS = toCanvasPoint(pose.leftShoulder, width, height);
  const pRS = toCanvasPoint(pose.rightShoulder, width, height);
  const torsoCenterX = (pLS.x + pRS.x) / 2;
  const shoulderSpan = shape.shoulderSpan;
  const fallbackPoint = point(Number.NaN, Number.NaN);
  const pLE = pose.leftElbow && (pose.leftElbow.visibility ?? 0) >= 0.25
    ? toCanvasPoint(pose.leftElbow, width, height)
    : fallbackPoint;
  const pRE = pose.rightElbow && (pose.rightElbow.visibility ?? 0) >= 0.25
    ? toCanvasPoint(pose.rightElbow, width, height)
    : fallbackPoint;
  const pLW = pose.leftWrist && (pose.leftWrist.visibility ?? 0) >= 0.25
    ? toCanvasPoint(pose.leftWrist, width, height)
    : fallbackPoint;
  const pRW = pose.rightWrist && (pose.rightWrist.visibility ?? 0) >= 0.25
    ? toCanvasPoint(pose.rightWrist, width, height)
    : fallbackPoint;

  if (!isDress) {
    drawSleeve(ctx, pLS, pLE, pLW, torsoCenterX, shoulderSpan, style, color, kind);
    drawSleeve(ctx, pRS, pRE, pRW, torsoCenterX, shoulderSpan, style, color, kind);
  }

  paintFabric(ctx, shape.path, shape.bounds, color, kind);
  drawNeckline(ctx, shape, color, kind);

  if (kind === 'blouse') {
    drawBlouseDetails(ctx, shape, color);
  } else if (isDress) {
    drawDrapeDetails(ctx, shape, color, kind);
  } else if (kind === 'sweetheart') {
    ctx.save();
    ctx.strokeStyle = colorWithAlpha(adjustBrightness(color, -58), 0.22);
    ctx.lineWidth = 0.9;
    for (let index = -3; index <= 3; index += 1) {
      ctx.beginPath();
      ctx.moveTo(shape.neckBottom.x, shape.neckBottom.y + shoulderSpan * 0.02);
      ctx.quadraticCurveTo(
        shape.neckBottom.x + index * shoulderSpan * 0.04,
        shape.neckBottom.y + shoulderSpan * 0.16,
        shape.neckBottom.x + index * shoulderSpan * 0.075,
        shape.neckBottom.y + shoulderSpan * 0.3,
      );
      ctx.stroke();
    }
    ctx.restore();
  }
}
