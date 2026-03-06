import { Tile, TILE_COLORS } from '../../config/tiles';
import { TILE_PX, WORLD_W, WORLD_H } from '../../config/world';
import type { Camera } from '../camera';

const MARGIN = 5;
const WATER_REFRESH = 900;
let cache: HTMLCanvasElement | null = null;
let cCtx: CanvasRenderingContext2D | null = null;
let cW = 0, cH = 0, cTX = -999, cTY = -999, cTime = 0;

function renderTile(
  ctx: CanvasRenderingContext2D, tx: number, ty: number,
  sx: number, sy: number, tiles: Uint8Array, variation: Uint8Array, now: number,
): void {
  const i = ty * WORLD_W + tx;
  const t = tiles[i] ?? 0;
  const v = (variation[i] ?? 0) % 3;
  ctx.fillStyle = TILE_COLORS[t]?.[v] ?? '#000';
  ctx.fillRect(sx, sy, TILE_PX + 1, TILE_PX + 1);
  if (t === Tile.DEEP || t === Tile.SEA) {
    if ((tx + ty + ~~(now / 1100)) % 5 === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(sx + 2, sy + 7, 5, 1);
    }
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

/** Draw all visible tiles using offscreen cache */
export function drawMap(
  ctx: CanvasRenderingContext2D, cam: Camera,
  tiles: Uint8Array, variation: Uint8Array,
): void {
  const now = Date.now();
  const viewTW = Math.ceil(cam.screenW / TILE_PX) + 2;
  const viewTH = Math.ceil(cam.screenH / TILE_PX) + 2;
  const totalTW = viewTW + MARGIN * 2;
  const totalTH = viewTH + MARGIN * 2;
  const needW = totalTW * TILE_PX;
  const needH = totalTH * TILE_PX;
  const camTX = ~~cam.x;
  const camTY = ~~cam.y;
  const needsResize = !cache || cW < needW || cH < needH;
  const moved = Math.abs(camTX - cTX) > MARGIN - 1 || Math.abs(camTY - cTY) > MARGIN - 1;

  if (needsResize || moved || now - cTime > WATER_REFRESH) {
    if (needsResize) {
      cache = document.createElement('canvas');
      cache.width = needW; cache.height = needH;
      cCtx = cache.getContext('2d')!;
      cCtx.imageSmoothingEnabled = false;
      cW = needW; cH = needH;
    }
    const x0 = camTX - MARGIN, y0 = camTY - MARGIN;
    cTX = camTX; cTY = camTY; cTime = now;
    for (let ty = y0; ty < y0 + totalTH; ty++) {
      for (let tx = x0; tx < x0 + totalTW; tx++) {
        if (tx < 0 || ty < 0 || tx >= WORLD_W || ty >= WORLD_H) continue;
        renderTile(cCtx!, tx, ty, (tx - x0) * TILE_PX, (ty - y0) * TILE_PX, tiles, variation, now);
      }
    }
  }
  const ox = (cam.x - (cTX - MARGIN)) * TILE_PX;
  const oy = (cam.y - (cTY - MARGIN)) * TILE_PX;
  ctx.drawImage(cache!, ox, oy, cam.screenW, cam.screenH, 0, 0, cam.screenW, cam.screenH);
}
