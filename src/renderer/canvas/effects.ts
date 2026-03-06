import { TILE_PX } from '../../config/world';
import type { Cannonball, Particle, Treasure } from '../../core/types';
import type { Camera } from '../camera';

/** Draw all cannonballs with trails */
export function drawCannonballs(
  ctx: CanvasRenderingContext2D,
  balls: Cannonball[],
  cam: Camera,
): void {
  for (const b of balls) {
    // Trail
    if (b.trail.length > 1) {
      ctx.strokeStyle = b.isPlayer ? 'rgba(255,220,50,0.45)' : 'rgba(255,80,80,0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < b.trail.length; i++) {
        const p = b.trail[i]!;
        const bx = (p.x - cam.x) * TILE_PX;
        const by = (p.y - cam.y) * TILE_PX;
        if (i === 0) ctx.moveTo(bx, by);
        else ctx.lineTo(bx, by);
      }
      ctx.stroke();
    }
    // Ball
    const bx = (b.x - cam.x) * TILE_PX;
    const by = (b.y - cam.y) * TILE_PX;
    ctx.fillStyle = b.isPlayer ? '#ffee44' : '#ff5533';
    ctx.beginPath();
    ctx.arc(bx, by, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Draw all particles */
export function drawParticles(
  ctx: CanvasRenderingContext2D,
  parts: Particle[],
  cam: Camera,
): void {
  for (const p of parts) {
    const px = (p.x - cam.x) * TILE_PX;
    const py = (p.y - cam.y) * TILE_PX;
    ctx.globalAlpha = p.life / p.maxLife;
    ctx.fillStyle = p.col;
    ctx.fillRect(px - p.sz / 2, py - p.sz / 2, p.sz, p.sz);
  }
  ctx.globalAlpha = 1;
}

/** Draw treasure chests */
export function drawTreasures(
  ctx: CanvasRenderingContext2D,
  treasures: Treasure[],
  cam: Camera,
): void {
  const now = Date.now();
  const x0 = ~~cam.x;
  const y0 = ~~cam.y;
  const x1 = ~~(cam.x + cam.screenW / TILE_PX) + 3;
  const y1 = ~~(cam.y + cam.screenH / TILE_PX) + 3;

  for (const t of treasures) {
    if (t.looted || t.x < x0 || t.x >= x1 || t.y < y0 || t.y >= y1) continue;
    const tsx = (t.x + 0.5 - cam.x) * TILE_PX;
    const tsy = (t.y + 0.5 - cam.y) * TILE_PX;
    const pulse = 0.5 + Math.sin(now * 0.004 + t.x) * 0.5;
    ctx.globalAlpha = 0.65 + pulse * 0.35;

    // Chest body
    ctx.fillStyle = '#8B6914';
    ctx.fillRect(tsx - 5, tsy - 4, 10, 8);
    // Chest lid
    ctx.fillStyle = '#A67C00';
    ctx.fillRect(tsx - 6, tsy - 6, 12, 4);
    // Lock
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(tsx - 1, tsy - 2, 2, 2);
    // Glow
    ctx.fillStyle = `rgba(255,215,0,${0.3 * pulse})`;
    ctx.fillRect(tsx - 8, tsy - 8, 16, 16);

    ctx.globalAlpha = 1;
  }
}

/** Draw navigation target marker */
export function drawNavTarget(
  ctx: CanvasRenderingContext2D,
  playerSX: number, playerSY: number,
  targetX: number, targetY: number,
  cam: Camera,
): void {
  const tsx = (targetX - cam.x) * TILE_PX;
  const tsy = (targetY - cam.y) * TILE_PX;

  // Dashed line
  ctx.strokeStyle = 'rgba(255,220,60,0.3)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 7]);
  ctx.beginPath();
  ctx.moveTo(playerSX, playerSY);
  ctx.lineTo(tsx, tsy);
  ctx.stroke();
  ctx.setLineDash([]);

  // Target dot
  ctx.fillStyle = 'rgba(255,220,60,0.55)';
  ctx.fillRect(tsx - 3, tsy - 3, 6, 6);

  // Arrow
  const ea = Math.atan2(tsy - playerSY, tsx - playerSX);
  ctx.save();
  ctx.translate(tsx, tsy);
  ctx.rotate(ea);
  ctx.fillStyle = 'rgba(255,220,60,0.6)';
  ctx.beginPath();
  ctx.moveTo(7, 0);
  ctx.lineTo(-4, -4);
  ctx.lineTo(-4, 4);
  ctx.fill();
  ctx.restore();
}
