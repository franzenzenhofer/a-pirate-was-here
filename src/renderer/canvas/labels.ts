import { displayShipLabel } from '../../core/ship-identity';
import { TILE_PX } from '../../config/world';
import type { EnemyShip, Port } from '../../core/types';
import type { Camera } from '../camera';
import { nationStyle } from '../../core/nation-style';

const SHIP_LABEL_FONT = '13px "Press Start 2P"';
const SHIP_META_FONT = '11px "Press Start 2P"';
const PORT_LABEL_FONT = '13px "Press Start 2P"';

/** Draw enemy ship labels as a single readable identity line plus optional state */
export function drawEnemyLabels(
  ctx: CanvasRenderingContext2D,
  enemies: EnemyShip[],
  cam: Camera,
): void {
  const x0 = ~~cam.x - 2, y0 = ~~cam.y - 2;
  const x1 = ~~(cam.x + cam.screenW / TILE_PX) + 2;
  const y1 = ~~(cam.y + cam.screenH / TILE_PX) + 2;

  ctx.font = SHIP_LABEL_FONT;
  ctx.textAlign = 'center';
  for (const en of enemies) {
    if (en.sunk || en.x < x0 || en.x > x1 || en.y < y0 || en.y > y1) continue;
    const esx = (en.x - cam.x) * TILE_PX;
    const esy = (en.y - cam.y) * TILE_PX;
    const isLegend = en.tk === 'DREAD_GHOST';
    const lc = isLegend ? '#bbf8ff' : en.role === 'PIRATE' ? '#ff88ff'
      : en.role === 'MERCHANT' ? '#88ffaa'
      : en.role === 'WARSHIP' ? '#ffaa44' : '#aaccff';
    drawCenterChip(ctx, displayShipLabel(en), esx, esy - TILE_PX * 1.82, lc);
    const meta: string[] = [];
    if (isLegend) meta.push('LEGEND');
    if (en.disabled) meta.push('DISABLED');
    if (meta.length > 0) {
      ctx.font = SHIP_META_FONT;
      drawCenterChip(ctx, meta.join(' · '), esx, esy - TILE_PX * 2.32, en.disabled ? '#ff7f73' : '#dfe7ff');
      ctx.font = SHIP_LABEL_FONT;
    }
    ctx.fillStyle = '#ffcc00';
    ctx.fillText('\u2605'.repeat(en.ti + 1), esx, esy + TILE_PX * 1.8);
  }
}

/** Draw port labels on map */
export function drawPortLabels(
  ctx: CanvasRenderingContext2D,
  ports: Port[],
  cam: Camera,
): void {
  const x0 = ~~cam.x - 3, y0 = ~~cam.y - 3;
  const x1 = ~~(cam.x + cam.screenW / TILE_PX) + 3;
  const y1 = ~~(cam.y + cam.screenH / TILE_PX) + 3;
  ctx.font = PORT_LABEL_FONT;
  ctx.textAlign = 'left';
  for (const p of ports) {
    if (p.x < x0 || p.x > x1 || p.y < y0 || p.y > y1) continue;
    const ppx = (p.x - cam.x) * TILE_PX + 8;
    const ppy = (p.y - cam.y) * TILE_PX - 14;
    const lc = p.rel === 'friendly' ? '#44ff88' : p.rel === 'enemy' ? '#ff5544' : '#ffcc44';
    const label = `${nationStyle(p.nat).code} · ${p.name}`;
    drawLeftChip(ctx, label, ppx, ppy, lc);
  }
}

function drawCenterChip(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
): void {
  const width = ctx.measureText(text).width;
  ctx.fillStyle = 'rgba(3, 8, 20, 0.86)';
  ctx.fillRect(x - width / 2 - 8, y - 11, width + 16, 16);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function drawLeftChip(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
): void {
  const width = Math.max(164, ctx.measureText(text).width + 16);
  ctx.fillStyle = 'rgba(0,0,0,0.82)';
  ctx.fillRect(x - width / 2, y - 18, width, 26);
  ctx.fillStyle = color;
  ctx.fillText(text, x - width / 2 + 8, y);
}
