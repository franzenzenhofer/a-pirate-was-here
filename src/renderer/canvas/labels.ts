import { displayShipFlag, displayShipName, sailingNation } from '../../core/ship-identity';
import { TILE_PX } from '../../config/world';
import type { EnemyShip, Port } from '../../core/types';
import type { Camera } from '../camera';
import { drawNationPennant } from './pennants';

const SHIP_LABEL_FONT = '16px "Press Start 2P"';
const FLAG_LABEL_FONT = '12px "Press Start 2P"';
const PORT_LABEL_FONT = '16px "Press Start 2P"';

/** Draw enemy ship labels, tiers, flags — batched by font */
export function drawEnemyLabels(
  ctx: CanvasRenderingContext2D,
  enemies: EnemyShip[],
  cam: Camera,
): void {
  const x0 = ~~cam.x - 2, y0 = ~~cam.y - 2;
  const x1 = ~~(cam.x + cam.screenW / TILE_PX) + 2;
  const y1 = ~~(cam.y + cam.screenH / TILE_PX) + 2;

  // First pass: pixel font labels
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
    ctx.fillStyle = lc;
    ctx.fillText(displayShipName(en), esx, esy - TILE_PX * 1.65);
    if (isLegend) ctx.fillText('LEGEND', esx, esy - TILE_PX * 2.05);
    if (en.disabled) {
      ctx.fillStyle = '#ff5544';
      ctx.fillText('DISABLED', esx, esy - TILE_PX * (isLegend ? 2.45 : 2.05));
    }
    ctx.fillStyle = '#ffcc00';
    ctx.fillText('\u2605'.repeat(en.ti + 1), esx, esy + TILE_PX * 1.8);
  }

  // Second pass: nation pennants and flag codes
  ctx.font = FLAG_LABEL_FONT;
  ctx.fillStyle = '#dfe7ff';
  ctx.textAlign = 'left';
  for (const en of enemies) {
    if (en.sunk || en.x < x0 || en.x > x1 || en.y < y0 || en.y > y1) continue;
    const esx = (en.x - cam.x) * TILE_PX;
    const esy = (en.y - cam.y) * TILE_PX;
    const pennantX = esx - TILE_PX * 2.2;
    const pennantY = esy - TILE_PX * 1.7;
    drawNationPennant(ctx, pennantX, pennantY, sailingNation(en), 0.9);
    ctx.fillText(displayShipFlag(en), pennantX + 18, pennantY + 7);
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
    const label = p.name;
    const width = Math.max(168, ctx.measureText(label).width + 40);
    ctx.fillStyle = 'rgba(0,0,0,0.82)';
    ctx.fillRect(ppx - width / 2, ppy - 18, width, 26);
    drawNationPennant(ctx, ppx - width / 2 + 10, ppy - 14, p.nat, 0.8);
    ctx.fillStyle = lc;
    ctx.fillText(label, ppx - width / 2 + 32, ppy);
  }
}
