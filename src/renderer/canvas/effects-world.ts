import { TILE_PX } from '../../config/world';
import type { FloatingPickup, FogZone } from '../../core/campaign-types';
import type { Treasure } from '../../core/types';
import type { Camera } from '../camera';

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

  for (const treasure of treasures) {
    if (treasure.hidden && !treasure.revealed) continue;
    if (treasure.looted || treasure.x < x0 || treasure.x >= x1 || treasure.y < y0 || treasure.y >= y1) continue;
    drawTreasure(ctx, treasure, cam, now);
  }
}

export function drawPickups(
  ctx: CanvasRenderingContext2D,
  pickups: FloatingPickup[],
  cam: Camera,
): void {
  for (const pickup of pickups) drawPickup(ctx, pickup, cam);
  ctx.globalAlpha = 1;
}

export function drawTreasureMapTarget(
  ctx: CanvasRenderingContext2D,
  treasures: Treasure[],
  activeMapTreasureId: string | null,
  cam: Camera,
): void {
  if (!activeMapTreasureId) return;
  const target = treasures.find(treasure => treasure.mapId === activeMapTreasureId && !treasure.looted);
  if (!target) return;
  const x = (target.x + 0.5 - cam.x) * TILE_PX;
  const y = (target.y + 0.5 - cam.y) * TILE_PX;
  ctx.strokeStyle = '#ff5577';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 9, y - 9);
  ctx.lineTo(x + 9, y + 9);
  ctx.moveTo(x + 9, y - 9);
  ctx.lineTo(x - 9, y + 9);
  ctx.stroke();
  ctx.font = '12px "Press Start 2P"';
  ctx.fillStyle = '#ffccdd';
  ctx.textAlign = 'center';
  ctx.fillText('BLAST THE BEACH', x, y - 16);
}

export function drawFogZones(
  ctx: CanvasRenderingContext2D,
  fogZones: FogZone[],
  cam: Camera,
): void {
  for (const fog of fogZones) {
    const x = (fog.x - cam.x) * TILE_PX;
    const y = (fog.y - cam.y) * TILE_PX;
    ctx.globalAlpha = 0.14;
    ctx.fillStyle = '#ff88cc';
    ctx.beginPath();
    ctx.arc(x, y, fog.radius * TILE_PX, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,220,240,0.18)';
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

export function drawNavTarget(
  ctx: CanvasRenderingContext2D,
  playerX: number,
  playerY: number,
  targetX: number,
  targetY: number,
  cam: Camera,
): void {
  const x = (targetX - cam.x) * TILE_PX;
  const y = (targetY - cam.y) * TILE_PX;
  ctx.strokeStyle = 'rgba(255,220,60,0.3)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 7]);
  ctx.beginPath();
  ctx.moveTo(playerX, playerY);
  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,220,60,0.55)';
  ctx.fillRect(x - 3, y - 3, 6, 6);
  const angle = Math.atan2(y - playerY, x - playerX);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = 'rgba(255,220,60,0.6)';
  ctx.beginPath();
  ctx.moveTo(7, 0);
  ctx.lineTo(-4, -4);
  ctx.lineTo(-4, 4);
  ctx.fill();
  ctx.restore();
}

function drawTreasure(
  ctx: CanvasRenderingContext2D,
  treasure: Treasure,
  cam: Camera,
  now: number,
): void {
  const x = (treasure.x + 0.5 - cam.x) * TILE_PX;
  const y = (treasure.y + 0.5 - cam.y) * TILE_PX;
  const pulse = 0.5 + Math.sin(now * 0.004 + treasure.x) * 0.5;
  ctx.globalAlpha = 0.7 + pulse * 0.3;
  ctx.fillStyle = 'rgba(9,18,36,0.72)';
  ctx.fillRect(x - 8, y - 8, 16, 15);
  ctx.fillStyle = '#5c3a18';
  ctx.fillRect(x - 6, y - 2, 12, 8);
  ctx.fillStyle = '#b3832d';
  ctx.fillRect(x - 7, y - 6, 14, 4);
  ctx.fillStyle = '#2d1608';
  ctx.fillRect(x - 1, y - 2, 2, 8);
  ctx.fillStyle = '#ffe08b';
  ctx.fillRect(x - 2, y - 4, 4, 2);
  ctx.fillRect(x - 5, y - 1, 2, 2);
  ctx.fillRect(x + 3, y - 1, 2, 2);
  ctx.fillStyle = `rgba(255,215,0,${0.22 + pulse * 0.2})`;
  ctx.fillRect(x - 10, y - 10, 20, 18);
  ctx.globalAlpha = 1;
}

function drawPickup(
  ctx: CanvasRenderingContext2D,
  pickup: FloatingPickup,
  cam: Camera,
): void {
  const x = (pickup.x - cam.x) * TILE_PX;
  const y = (pickup.y - cam.y) * TILE_PX;
  ctx.globalAlpha = 0.94;
  ctx.fillStyle = 'rgba(9,18,36,0.8)';
  ctx.fillRect(x - 8, y - 8, 16, 16);
  if (pickup.kind === 'cargo') {
    ctx.fillStyle = '#7d5230';
    ctx.fillRect(x - 6, y - 6, 12, 12);
    ctx.fillStyle = '#b58754';
    ctx.fillRect(x - 5, y - 5, 10, 3);
    ctx.fillStyle = '#e7c48a';
    ctx.fillRect(x - 1, y - 6, 2, 12);
    ctx.fillRect(x - 6, y - 1, 12, 2);
  } else if (pickup.kind === 'map') {
    ctx.fillStyle = '#f0dfb0';
    ctx.fillRect(x - 6, y - 6, 12, 12);
    ctx.fillStyle = '#d3bb83';
    ctx.fillRect(x - 5, y - 5, 10, 10);
    ctx.fillStyle = '#8a5528';
    ctx.fillRect(x - 4, y - 2, 8, 1.5);
    ctx.fillRect(x - 2, y + 1, 5, 1.5);
    ctx.fillStyle = '#c94f55';
    ctx.fillRect(x + 2, y - 4, 2, 2);
  } else {
    ctx.fillStyle = '#e8e1d4';
    ctx.fillRect(x - 4, y - 6, 8, 12);
    ctx.fillStyle = '#bca56a';
    ctx.fillRect(x - 2, y - 6, 4, 12);
    ctx.fillStyle = '#f5d46f';
    ctx.fillRect(x - 5, y - 7, 10, 3);
  }
  ctx.strokeStyle = '#091224';
  ctx.lineWidth = 2;
  ctx.strokeRect(x - 8, y - 8, 16, 16);
  ctx.fillStyle = '#f4f0d8';
  ctx.font = '10px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText(pickup.label, x, y + 22);
  ctx.globalAlpha = 1;
}
