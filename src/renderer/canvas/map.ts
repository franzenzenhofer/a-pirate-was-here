import { Tile, TILE_COLORS } from '../../config/tiles';
import { TILE_PX, WORLD_W } from '../../config/world';
import type { Camera } from '../camera';

/** Draw a single tile with terrain details */
export function drawTile(
  ctx: CanvasRenderingContext2D,
  tx: number, ty: number,
  sx: number, sy: number,
  tiles: Uint8Array,
  variation: Uint8Array,
  now: number,
): void {
  const i = ty * WORLD_W + tx;
  const t = tiles[i] ?? 0;
  const v = (variation[i] ?? 0) % 3;
  const colors = TILE_COLORS[t];
  ctx.fillStyle = colors?.[v] ?? '#000';
  ctx.fillRect(sx, sy, TILE_PX + 1, TILE_PX + 1);

  // Water animation
  if (t === Tile.DEEP || t === Tile.SEA) {
    if ((tx + ty + ~~(now / 1100)) % 5 === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(sx + 2, sy + 7, 5, 1);
    }
    // Extra wave detail for SEA
    if (t === Tile.SEA && (tx + ty + ~~(now / 800)) % 7 === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      ctx.fillRect(sx + 8, sy + 3, 4, 1);
    }
  } else if (t === Tile.FOREST) {
    ctx.fillStyle = '#0a3310';
    ctx.fillRect(sx + 2 + ((tx * 7 + ty * 13) % 3) * 4, sy + 2, 3, 4);
    ctx.fillRect(sx + 9 - ((tx + ty * 3) % 3) * 2, sy + 7, 3, 4);
  } else if (t === Tile.PEAK) {
    ctx.fillStyle = '#bbaa99';
    ctx.beginPath(); ctx.moveTo(sx + 8, sy + 2); ctx.lineTo(sx + 14, sy + 14); ctx.lineTo(sx + 2, sy + 14); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.moveTo(sx + 8, sy + 2); ctx.lineTo(sx + 12, sy + 8); ctx.lineTo(sx + 4, sy + 8); ctx.fill();
  } else if (t === Tile.PORT) {
    ctx.fillStyle = '#ffeecc'; ctx.fillRect(sx + 2, sy + 5, 12, 7);
    ctx.fillStyle = '#aa3311'; ctx.fillRect(sx + 2, sy + 3, 12, 4);
    ctx.fillStyle = '#333'; ctx.fillRect(sx + 7, sy + 1, 1, 6);
    ctx.fillStyle = '#ffcc00'; ctx.fillRect(sx + 8, sy + 1, 4, 3);
  } else if (t === Tile.REEF) {
    ctx.fillStyle = 'rgba(255,200,50,0.2)';
    ctx.fillRect(sx + 3, sy + 3, 2, 2); ctx.fillRect(sx + 10, sy + 9, 2, 2);
  } else if (t === Tile.SAND && (tx * 3 + ty) % 6 === 0) {
    ctx.fillStyle = 'rgba(180,140,20,0.18)'; ctx.fillRect(sx + 4, sy + 4, 2, 2);
  } else if (t === Tile.HILL) {
    ctx.fillStyle = 'rgba(100,80,40,0.2)';
    ctx.fillRect(sx + 4, sy + 6, 8, 4);
  }
}

/** Draw all visible tiles */
export function drawMap(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  tiles: Uint8Array,
  variation: Uint8Array,
): void {
  const now = Date.now();
  const x0 = ~~cam.x;
  const y0 = ~~cam.y;
  const x1 = Math.min(~~(cam.x + cam.screenW / TILE_PX) + 3, WORLD_W);
  const y1 = Math.min(~~(cam.y + cam.screenH / TILE_PX) + 3, 200);

  for (let ty = y0; ty < y1; ty++) {
    for (let tx = x0; tx < x1; tx++) {
      if (tx < 0 || ty < 0) continue;
      drawTile(ctx, tx, ty, ~~((tx - cam.x) * TILE_PX), ~~((ty - cam.y) * TILE_PX), tiles, variation, now);
    }
  }
}
