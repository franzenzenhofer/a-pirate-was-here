import { TILE_PX } from '../../config/world';
import type { Vec2 } from '../../core/types';

/** Draw a ship sprite — broadside cannons on correct sides, detailed rigging */
export function drawShip(
  ctx: CanvasRenderingContext2D,
  sx: number, sy: number,
  ang: number, col: string, tk: string,
  scale: number, disabled: boolean,
): void {
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(ang + Math.PI / 2);
  const s = TILE_PX * 0.36 * scale;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(-s * 0.5 + 1, -s * 1.4 + 1, s, s * 2.8);

  // Hull
  ctx.fillStyle = disabled ? '#443322' : col;
  ctx.fillRect(-s * 0.44, -s * 1.28, s * 0.88, s * 2.56);

  // Bow point
  ctx.beginPath();
  ctx.moveTo(0, -s * 1.82);
  ctx.lineTo(-s * 0.44, -s * 1.28);
  ctx.lineTo(s * 0.44, -s * 1.28);
  ctx.fill();

  // Stern
  ctx.fillRect(-s * 0.54, s * 1.1, s * 1.08, s * 0.5);

  // Waterline
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.fillRect(-s * 0.44, -s * 0.08, s * 0.88, s * 0.14);

  // Main mast
  ctx.fillStyle = disabled ? '#443322' : '#ccbbaa';
  ctx.fillRect(-1.2, -s * 1.72, 2.4, s * 2.4);

  // Main sail
  if (!disabled) {
    ctx.fillStyle = 'rgba(255,252,220,0.9)';
    ctx.fillRect(-s * 0.54, -s * 1.28, s * 1.08, s * 1.12);
    ctx.fillStyle = 'rgba(255,255,200,0.12)';
    ctx.fillRect(-s * 0.54 + s * 0.05, -s * 1.28, s * 0.98, s * 1.12);
  } else {
    ctx.fillStyle = 'rgba(100,80,50,0.45)';
    ctx.fillRect(-s * 0.3, -s * 1.1, s * 0.4, s * 0.65);
  }

  // Topsail (brigantine+)
  if (tk !== 'SLOOP' && !disabled) {
    ctx.fillStyle = 'rgba(240,240,200,0.82)';
    ctx.fillRect(-s * 0.28, -s * 1.98, s * 0.56, s * 0.68);
    ctx.fillStyle = '#ccbbaa';
    ctx.fillRect(-0.8, -s * 2.18, 1.6, s * 0.55);
  }

  // Second mast (galleon, man-o-war)
  if ((tk === 'GALLEON' || tk === 'MAN_O_WAR') && !disabled) {
    ctx.fillStyle = '#ccbbaa';
    ctx.fillRect(-0.8, s * 0.28, 1.6, s * 1.4);
    ctx.fillStyle = 'rgba(240,240,200,0.75)';
    ctx.fillRect(-s * 0.38, s * 0.38, s * 0.76, s * 0.85);
  }

  // Broadside cannons
  const nc = tk === 'SLOOP' ? 1 : tk === 'BRIGANTINE' ? 2 : tk === 'FRIGATE' ? 3 : 4;
  ctx.fillStyle = '#1a1a1a';
  for (let i = 0; i < nc; i++) {
    const cy = -s * 0.8 + i * (s * 0.55);
    ctx.fillRect(-s * 0.95, cy, s * 0.55, s * 0.18);
    ctx.fillRect(s * 0.40, cy, s * 0.55, s * 0.18);
    ctx.fillStyle = '#333';
    ctx.fillRect(-s * 0.94, cy + s * 0.04, s * 0.18, s * 0.10);
    ctx.fillRect(s * 0.76, cy + s * 0.04, s * 0.18, s * 0.10);
    ctx.fillStyle = '#1a1a1a';
  }

  ctx.restore();
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
