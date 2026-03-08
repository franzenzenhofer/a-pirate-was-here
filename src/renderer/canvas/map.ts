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
    drawWaterTile(ctx, t, tx, ty, sx, sy, now, hasAdjacentLand(tiles, tx, ty));
  } else if (t === Tile.SHALLOW) {
    drawShallowTile(ctx, tx, ty, sx, sy, hasAdjacentLand(tiles, tx, ty));
  } else if (t === Tile.SAND) {
    drawSandTile(ctx, tx, ty, sx, sy, hasAdjacentLand(tiles, tx, ty));
  } else if (t === Tile.GRASS) {
    drawGrassTile(ctx, tx, ty, sx, sy);
  } else if (t === Tile.FOREST) {
    drawForestTile(ctx, tx, ty, sx, sy);
  } else if (t === Tile.HILL) {
    drawHillTile(ctx, tx, ty, sx, sy);
  } else if (t === Tile.PEAK) {
    drawPeakTile(ctx, sx, sy);
  } else if (t === Tile.SNOW) {
    drawSnowTile(ctx, tx, ty, sx, sy);
  } else if (t === Tile.PORT) {
    drawPortTile(ctx, sx, sy);
  } else if (t === Tile.REEF) {
    drawReefTile(ctx, tx, ty, sx, sy);
  }
}

function drawWaterTile(
  ctx: CanvasRenderingContext2D,
  tile: number,
  tx: number,
  ty: number,
  sx: number,
  sy: number,
  now: number,
  nearLand: boolean,
): void {
  const pulse = Math.floor(now / (tile === Tile.DEEP ? 1200 : 900));
  if ((tx + ty + pulse) % 5 === 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(sx + 3, sy + 7, 6, 1);
  }
  if ((tx * 3 + ty + pulse) % 7 === 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(sx + 9, sy + 4, 5, 1);
  }
  ctx.fillStyle = tile === Tile.DEEP ? 'rgba(5,20,54,0.18)' : 'rgba(10,55,120,0.12)';
  ctx.fillRect(sx, sy + 14, TILE_PX, 3);
  if (nearLand) {
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.fillRect(sx + 1, sy + 11, 12, 1);
    ctx.fillRect(sx + 4, sy + 13, 8, 1);
  }
}

function drawShallowTile(
  ctx: CanvasRenderingContext2D,
  tx: number,
  ty: number,
  sx: number,
  sy: number,
  nearLand: boolean,
): void {
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(sx + 2, sy + 4, 8, 1);
  ctx.fillRect(sx + 8, sy + 9, 5, 1);
  if (nearLand) {
    ctx.fillStyle = 'rgba(255,246,210,0.18)';
    ctx.fillRect(sx + 1, sy + 2, 12, 1);
  }
  if ((tx + ty) % 3 === 0) {
    ctx.fillStyle = 'rgba(16,109,154,0.22)';
    ctx.fillRect(sx + 5, sy + 13, 6, 2);
  }
}

function drawSandTile(
  ctx: CanvasRenderingContext2D,
  tx: number,
  ty: number,
  sx: number,
  sy: number,
  nearLand: boolean,
): void {
  ctx.fillStyle = 'rgba(255,246,210,0.22)';
  ctx.fillRect(sx + 2, sy + 2, 10, 2);
  ctx.fillStyle = 'rgba(179,138,32,0.18)';
  if ((tx * 3 + ty) % 6 === 0) ctx.fillRect(sx + 4, sy + 5, 2, 2);
  if ((tx + ty * 2) % 5 === 0) ctx.fillRect(sx + 10, sy + 9, 2, 2);
  if (nearLand) {
    ctx.fillStyle = 'rgba(148,112,24,0.22)';
    ctx.fillRect(sx + 1, sy + 13, 12, 2);
  }
}

function drawGrassTile(
  ctx: CanvasRenderingContext2D,
  tx: number,
  ty: number,
  sx: number,
  sy: number,
): void {
  ctx.fillStyle = 'rgba(80,160,70,0.18)';
  ctx.fillRect(sx + 2, sy + 3, 9, 2);
  if ((tx + ty) % 2 === 0) ctx.fillRect(sx + 8, sy + 9, 4, 2);
  ctx.fillStyle = '#2f7a2e';
  ctx.fillRect(sx + 3 + ((tx + ty) % 3) * 3, sy + 8, 1, 3);
  ctx.fillRect(sx + 6 + ((tx * 2 + ty) % 4) * 2, sy + 6, 1, 4);
}

function drawForestTile(
  ctx: CanvasRenderingContext2D,
  tx: number,
  ty: number,
  sx: number,
  sy: number,
): void {
  const clusters = [
    { x: 3 + ((tx * 7 + ty * 13) % 3) * 3, y: 3 },
    { x: 8 - ((tx + ty * 3) % 3) * 2, y: 8 },
    { x: 11 - ((tx * 5 + ty) % 4), y: 5 },
  ];
  for (const cluster of clusters) {
    ctx.fillStyle = '#0a3310';
    ctx.fillRect(sx + cluster.x - 1, sy + cluster.y + 2, 3, 4);
    ctx.fillStyle = '#1d6123';
    ctx.fillRect(sx + cluster.x - 2, sy + cluster.y - 1, 5, 5);
    ctx.fillStyle = '#2b7b31';
    ctx.fillRect(sx + cluster.x - 1, sy + cluster.y, 3, 2);
  }
}

function drawHillTile(
  ctx: CanvasRenderingContext2D,
  tx: number,
  ty: number,
  sx: number,
  sy: number,
): void {
  ctx.fillStyle = 'rgba(100,80,40,0.2)';
  ctx.fillRect(sx + 3, sy + 8, 10, 4);
  ctx.fillStyle = '#8e7b4c';
  ctx.beginPath();
  ctx.moveTo(sx + 3, sy + 12);
  ctx.lineTo(sx + 8, sy + 4);
  ctx.lineTo(sx + 13, sy + 12);
  ctx.fill();
  if ((tx + ty) % 2 === 0) {
    ctx.fillStyle = 'rgba(214,187,133,0.22)';
    ctx.fillRect(sx + 6, sy + 8, 4, 1);
  }
}

function drawPeakTile(ctx: CanvasRenderingContext2D, sx: number, sy: number): void {
  ctx.fillStyle = '#7f7468';
  ctx.beginPath();
  ctx.moveTo(sx + 8, sy + 2);
  ctx.lineTo(sx + 14, sy + 14);
  ctx.lineTo(sx + 2, sy + 14);
  ctx.fill();
  ctx.fillStyle = '#c7b7a3';
  ctx.beginPath();
  ctx.moveTo(sx + 8, sy + 3);
  ctx.lineTo(sx + 12, sy + 11);
  ctx.lineTo(sx + 5, sy + 11);
  ctx.fill();
  ctx.fillStyle = '#fff7ea';
  ctx.beginPath();
  ctx.moveTo(sx + 8, sy + 2);
  ctx.lineTo(sx + 11, sy + 7);
  ctx.lineTo(sx + 5, sy + 7);
  ctx.fill();
}

function drawSnowTile(
  ctx: CanvasRenderingContext2D,
  tx: number,
  ty: number,
  sx: number,
  sy: number,
): void {
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(sx + 2, sy + 3, 10, 2);
  if ((tx + ty) % 2 === 0) {
    ctx.fillStyle = 'rgba(210,220,255,0.22)';
    ctx.fillRect(sx + 6, sy + 9, 5, 2);
  }
}

function drawPortTile(ctx: CanvasRenderingContext2D, sx: number, sy: number): void {
  ctx.fillStyle = '#091224';
  ctx.fillRect(sx + 2, sy + 2, 12, 12);
  ctx.fillStyle = '#ffeecc';
  ctx.fillRect(sx + 3, sy + 6, 10, 6);
  ctx.fillStyle = '#aa3311';
  ctx.fillRect(sx + 3, sy + 4, 10, 3);
  ctx.fillStyle = '#333';
  ctx.fillRect(sx + 7, sy + 2, 2, 7);
  ctx.fillStyle = '#ffcc00';
  ctx.fillRect(sx + 9, sy + 2, 4, 3);
  ctx.fillStyle = '#6a3914';
  ctx.fillRect(sx + 6, sy + 9, 3, 3);
  ctx.fillStyle = 'rgba(255,220,90,0.32)';
  ctx.fillRect(sx + 5, sy + 8, 4, 3);
}

function drawReefTile(
  ctx: CanvasRenderingContext2D,
  tx: number,
  ty: number,
  sx: number,
  sy: number,
): void {
  ctx.fillStyle = 'rgba(255,200,50,0.22)';
  ctx.fillRect(sx + 3, sy + 3, 3, 3);
  ctx.fillRect(sx + 10, sy + 9, 2, 2);
  ctx.fillRect(sx + 7, sy + 6, 2, 2);
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.fillRect(sx + 5, sy + 5, 6, 1);
  if ((tx + ty) % 2 === 0) {
    ctx.fillStyle = 'rgba(18,110,162,0.18)';
    ctx.fillRect(sx + 2, sy + 12, 10, 2);
  }
}

function hasAdjacentLand(tiles: Uint8Array, tx: number, ty: number): boolean {
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const i = (ty + dy) * WORLD_W + (tx + dx);
      const t = tiles[i] ?? 0;
      if (t >= Tile.SAND && t !== Tile.REEF) return true;
    }
  }
  return false;
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
