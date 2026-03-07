import { TILE_PX } from '../../config/world';
import { drawNationPennant } from './pennants';
import { shipHullFor } from './ship-hulls';
import { drawMonsterShip } from './ship-monsters';

export { drawHealthBar, drawWake } from './ship-effects';

export function drawShip(
  ctx: CanvasRenderingContext2D,
  sx: number, sy: number,
  ang: number, col: string, tk: string,
  scale: number, disabled: boolean,
  nation: string,
  hpRatio: number = 1,
): void {
  const hull = shipHullFor(tk);
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(ang + Math.PI / 2);
  const s = TILE_PX * 0.36 * scale;
  const isGhost = tk === 'DREAD_GHOST';
  const isMonster = tk === 'MEGALODON' || tk === 'CRAB_LEVIATHAN';
  const isBurning = tk === 'FIRESHIP' || hpRatio < 0.35;
  if (drawMonsterShip(ctx, tk, s)) {
    ctx.restore();
    return;
  }
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(-s * hull.w * 0.5 + 1, -s * hull.l * 0.5 + 1, s * hull.w, s * hull.l);
  ctx.globalAlpha = isGhost ? 0.7 : 1;
  ctx.fillStyle = disabled ? '#443322' : col;
  ctx.fillRect(-s * hull.w * 0.5, -s * hull.l * 0.46, s * hull.w, s * hull.l * 0.92);
  ctx.beginPath();
  ctx.moveTo(0, -s * hull.l * 0.68);
  ctx.lineTo(-s * hull.w * 0.5, -s * hull.l * 0.46);
  ctx.lineTo(s * hull.w * 0.5, -s * hull.l * 0.46);
  ctx.fill();
  ctx.fillRect(-s * hull.w * 0.62, s * hull.l * 0.37, s * hull.w * 1.24, s * 0.46);
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.fillRect(-s * hull.w * 0.5, -s * 0.08, s * hull.w, s * 0.14);
  ctx.fillStyle = disabled ? '#443322' : '#ccbbaa';
  ctx.fillRect(-1.2, -s * hull.l * 0.64, 2.4, s * hull.l * 0.86);
  if (!disabled) {
    ctx.fillStyle = 'rgba(255,252,220,0.9)';
    ctx.fillRect(-s * hull.sailW, -s * hull.l * 0.46, s * hull.sailW * 2, s * hull.mainSail);
    ctx.fillStyle = 'rgba(255,255,200,0.12)';
    ctx.fillRect(-s * hull.sailW + s * 0.05, -s * hull.l * 0.46, s * hull.sailW * 1.8, s * hull.mainSail);
  } else {
    ctx.fillStyle = 'rgba(100,80,50,0.45)';
    ctx.fillRect(-s * 0.3, -s * 1.1, s * 0.4, s * 0.65);
  }
  if (!['CUTTER', 'SLOOP', 'FIRESHIP'].includes(tk) && !disabled) {
    ctx.fillStyle = 'rgba(240,240,200,0.82)';
    ctx.fillRect(-s * 0.28, -s * hull.l * 0.75, s * 0.56, s * 0.52);
    ctx.fillStyle = '#ccbbaa';
    ctx.fillRect(-0.8, -s * hull.l * 0.84, 1.6, s * 0.42);
  }
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
    drawNationPennant(ctx, -s * 0.05, -s * hull.l * 0.9, nation, Math.max(0.35, s * 0.12));
  }
  if (isGhost && !disabled) {
    ctx.fillStyle = 'rgba(180,255,255,0.24)';
    ctx.fillRect(-s * 1.1, -s * 1.8, s * 2.2, s * 3.2);
  }
  if (tk === 'FIRESHIP' && !disabled) {
    ctx.fillStyle = 'rgba(255,180,80,0.28)';
    ctx.fillRect(-s * 0.4, -s * 0.7, s * 0.8, s * 0.9);
  }
  if (disabled) {
    ctx.strokeStyle = '#c18a44';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-s * 0.45, -s * 0.35);
    ctx.lineTo(s * 0.45, s * 0.35);
    ctx.moveTo(s * 0.45, -s * 0.35);
    ctx.lineTo(-s * 0.45, s * 0.35);
    ctx.stroke();
  }
  if (!isMonster && hpRatio < 0.68) {
    ctx.fillStyle = 'rgba(35,35,35,0.42)';
    ctx.fillRect(-s * 0.12, -s * 1.2, s * 0.22, s * 0.38);
    ctx.fillRect(s * 0.14, -s * 1.45, s * 0.3, s * 0.46);
  }
  if (isBurning && !disabled) {
    ctx.fillStyle = 'rgba(255,190,70,0.45)';
    ctx.fillRect(-s * 0.26, -s * 0.7, s * 0.52, s * 0.52);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}
