import { TILE_PX } from '../../config/world';
import type { Vec2 } from '../../core/types';

export function drawWake(
  ctx: CanvasRenderingContext2D,
  points: Vec2[],
  camX: number,
  camY: number,
  alpha: number,
  lineWidth: number,
): void {
  if (points.length < 2) return;
  ctx.strokeStyle = `rgba(160,210,255,${alpha})`;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  for (let index = 0; index < points.length; index++) {
    const point = points[index]!;
    const wakeX = (point.x - camX) * TILE_PX;
    const wakeY = (point.y - camY) * TILE_PX;
    if (index === 0) ctx.moveTo(wakeX, wakeY);
    else ctx.lineTo(wakeX, wakeY);
  }
  ctx.stroke();
}

export function drawHealthBar(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  hp: number,
  maxHp: number,
): void {
  const width = TILE_PX * 1.4;
  ctx.fillStyle = '#1a1a2a';
  ctx.fillRect(sx - width / 2, sy - TILE_PX * 1.45, width, 3);
  ctx.fillStyle = hp / maxHp > 0.5 ? '#44ff66' : '#ff4422';
  ctx.fillRect(sx - width / 2, sy - TILE_PX * 1.45, width * hp / maxHp, 3);
}
