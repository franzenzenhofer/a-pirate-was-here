import { TILE_PX } from '../../config/world';
import type { Vec2 } from '../../core/types';

/** Draw a ship sprite — broadside cannons on correct sides, detailed rigging */
export function drawShip(
  ctx: CanvasRenderingContext2D,
  sx: number, sy: number,
  ang: number, col: string, tk: string,
  scale: number, disabled: boolean,
): void {
  const hull = shipHullFor(tk);
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(ang + Math.PI / 2);
  const s = TILE_PX * 0.36 * scale;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(-s * hull.w * 0.5 + 1, -s * hull.l * 0.5 + 1, s * hull.w, s * hull.l);

  // Hull
  ctx.fillStyle = disabled ? '#443322' : col;
  ctx.fillRect(-s * hull.w * 0.5, -s * hull.l * 0.46, s * hull.w, s * hull.l * 0.92);

  // Bow point
  ctx.beginPath();
  ctx.moveTo(0, -s * hull.l * 0.68);
  ctx.lineTo(-s * hull.w * 0.5, -s * hull.l * 0.46);
  ctx.lineTo(s * hull.w * 0.5, -s * hull.l * 0.46);
  ctx.fill();

  // Stern
  ctx.fillRect(-s * hull.w * 0.62, s * hull.l * 0.37, s * hull.w * 1.24, s * 0.46);

  // Waterline
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.fillRect(-s * hull.w * 0.5, -s * 0.08, s * hull.w, s * 0.14);

  // Main mast
  ctx.fillStyle = disabled ? '#443322' : '#ccbbaa';
  ctx.fillRect(-1.2, -s * hull.l * 0.64, 2.4, s * hull.l * 0.86);

  // Main sail
  if (!disabled) {
    ctx.fillStyle = 'rgba(255,252,220,0.9)';
    ctx.fillRect(-s * hull.sailW, -s * hull.l * 0.46, s * hull.sailW * 2, s * hull.mainSail);
    ctx.fillStyle = 'rgba(255,255,200,0.12)';
    ctx.fillRect(-s * hull.sailW + s * 0.05, -s * hull.l * 0.46, s * hull.sailW * 1.8, s * hull.mainSail);
  } else {
    ctx.fillStyle = 'rgba(100,80,50,0.45)';
    ctx.fillRect(-s * 0.3, -s * 1.1, s * 0.4, s * 0.65);
  }

  // Topsail (brigantine+)
  if (!['CUTTER', 'SLOOP', 'FIRESHIP'].includes(tk) && !disabled) {
    ctx.fillStyle = 'rgba(240,240,200,0.82)';
    ctx.fillRect(-s * 0.28, -s * hull.l * 0.75, s * 0.56, s * 0.52);
    ctx.fillStyle = '#ccbbaa';
    ctx.fillRect(-0.8, -s * hull.l * 0.84, 1.6, s * 0.42);
  }

  // Second mast (larger ships)
  if (hull.masts > 1 && !disabled) {
    ctx.fillStyle = '#ccbbaa';
    ctx.fillRect(-0.8, s * 0.18, 1.6, s * 1.2);
    ctx.fillStyle = 'rgba(240,240,200,0.75)';
    ctx.fillRect(-s * 0.38, s * 0.28, s * 0.76, s * 0.7);
  }

  if (hull.masts > 2 && !disabled) {
    ctx.fillStyle = '#ccbbaa';
    ctx.fillRect(-0.8, -s * 0.08, 1.6, s * 0.95);
    ctx.fillStyle = 'rgba(240,240,200,0.7)';
    ctx.fillRect(-s * 0.3, -s * 0.08, s * 0.6, s * 0.42);
  }

  // Broadside cannons
  const nc = hull.guns;
  ctx.fillStyle = '#1a1a1a';
  for (let i = 0; i < nc; i++) {
    const cy = -s * 0.82 + i * (s * 0.52);
    ctx.fillRect(-s * 0.95, cy, s * 0.55, s * 0.18);
    ctx.fillRect(s * 0.40, cy, s * 0.55, s * 0.18);
    ctx.fillStyle = '#333';
    ctx.fillRect(-s * 0.94, cy + s * 0.04, s * 0.18, s * 0.10);
    ctx.fillRect(s * 0.76, cy + s * 0.04, s * 0.18, s * 0.10);
    ctx.fillStyle = '#1a1a1a';
  }

  if (!disabled) {
    ctx.fillStyle = hull.flag;
    ctx.fillRect(-s * 0.05, -s * hull.l * 0.82, s * 0.48, s * 0.18);
  }

  if (tk === 'DREAD_GHOST' && !disabled) {
    ctx.fillStyle = 'rgba(180,255,255,0.2)';
    ctx.fillRect(-s * 1.1, -s * 1.8, s * 2.2, s * 3.2);
  }

  if (tk === 'FIRESHIP' && !disabled) {
    ctx.fillStyle = 'rgba(255,180,80,0.28)';
    ctx.fillRect(-s * 0.4, -s * 0.7, s * 0.8, s * 0.9);
  }

  ctx.restore();
}

function shipHullFor(tk: string): {
  w: number; l: number; sailW: number; mainSail: number; masts: number; guns: number; flag: string;
} {
  if (tk === 'CUTTER') return { w: 0.72, l: 2.2, sailW: 0.42, mainSail: 0.7, masts: 1, guns: 1, flag: '#6ee7ff' };
  if (tk === 'SLOOP') return { w: 0.82, l: 2.4, sailW: 0.48, mainSail: 0.82, masts: 1, guns: 1, flag: '#8cffc8' };
  if (tk === 'BRIGANTINE') return { w: 0.9, l: 2.62, sailW: 0.54, mainSail: 1.08, masts: 2, guns: 2, flag: '#56b9ff' };
  if (tk === 'CORVETTE') return { w: 0.95, l: 2.76, sailW: 0.58, mainSail: 1.14, masts: 2, guns: 3, flag: '#d8a8ff' };
  if (tk === 'FRIGATE') return { w: 1.04, l: 2.96, sailW: 0.6, mainSail: 1.18, masts: 2, guns: 3, flag: '#ffbe68' };
  if (tk === 'FIRESHIP') return { w: 0.86, l: 2.45, sailW: 0.45, mainSail: 0.74, masts: 1, guns: 2, flag: '#ff6655' };
  if (tk === 'GALLEON') return { w: 1.1, l: 3.12, sailW: 0.62, mainSail: 1.22, masts: 3, guns: 4, flag: '#ff9d4d' };
  if (tk === 'DREAD_GHOST') return { w: 1.05, l: 3.08, sailW: 0.6, mainSail: 1.18, masts: 3, guns: 4, flag: '#d9ffff' };
  return { w: 1.12, l: 3.28, sailW: 0.64, mainSail: 1.24, masts: 3, guns: 4, flag: '#ff4444' };
}

/** Draw ship wake trail */
export function drawWake(
  ctx: CanvasRenderingContext2D,
  points: Vec2[],
  camX: number, camY: number,
  alpha: number, lineWidth: number,
): void {
  if (points.length < 2) return;
  ctx.strokeStyle = `rgba(160,210,255,${alpha})`;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  for (let i = 0; i < points.length; i++) {
    const p = points[i]!;
    const wx = (p.x - camX) * TILE_PX;
    const wy = (p.y - camY) * TILE_PX;
    if (i === 0) ctx.moveTo(wx, wy);
    else ctx.lineTo(wx, wy);
  }
  ctx.stroke();
}

/** Draw health bar above a ship */
export function drawHealthBar(
  ctx: CanvasRenderingContext2D,
  sx: number, sy: number,
  hp: number, maxHp: number,
): void {
  const bw = TILE_PX * 1.4;
  ctx.fillStyle = '#1a1a2a';
  ctx.fillRect(sx - bw / 2, sy - TILE_PX * 1.45, bw, 3);
  ctx.fillStyle = hp / maxHp > 0.5 ? '#44ff66' : '#ff4422';
  ctx.fillRect(sx - bw / 2, sy - TILE_PX * 1.45, bw * hp / maxHp, 3);
}
