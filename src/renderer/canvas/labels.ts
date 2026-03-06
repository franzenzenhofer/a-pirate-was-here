import { TILE_PX } from '../../config/world';
import { NATION_FLAGS } from '../../config/ports';
import type { EnemyShip, Port } from '../../core/types';
import type { Camera } from '../camera';

/** Draw enemy ship labels, tiers, flags */
export function drawEnemyLabels(
  ctx: CanvasRenderingContext2D,
  enemies: EnemyShip[],
  cam: Camera,
): void {
  const x0 = ~~cam.x - 2;
  const y0 = ~~cam.y - 2;
  const x1 = ~~(cam.x + cam.screenW / TILE_PX) + 2;
  const y1 = ~~(cam.y + cam.screenH / TILE_PX) + 2;

  ctx.font = '5px "Press Start 2P"';
  ctx.textAlign = 'center';

  for (const en of enemies) {
    if (en.sunk) continue;
    if (en.x < x0 || en.x > x1 || en.y < y0 || en.y > y1) continue;

    const esx = (en.x - cam.x) * TILE_PX;
    const esy = (en.y - cam.y) * TILE_PX;

    // Ship type label
    const lc = en.role === 'PIRATE' ? '#ff88ff'
      : en.role === 'MERCHANT' ? '#88ffaa'
      : en.role === 'WARSHIP' ? '#ffaa44' : '#aaccff';
    ctx.fillStyle = lc;
    ctx.fillText(en.tk, esx, esy - TILE_PX * 1.65);

    // Disabled label
    if (en.disabled) {
      ctx.fillStyle = '#ff5544';
      ctx.fillText('DISABLED', esx, esy - TILE_PX * 2.05);
    }

    // Tier stars
    ctx.fillStyle = '#ffcc00';
    ctx.fillText('★'.repeat(en.ti + 1), esx, esy + TILE_PX * 1.8);

    // Nation flag
    ctx.font = '9px serif';
    ctx.fillText(NATION_FLAGS[en.nat] ?? '🏴', esx - TILE_PX * 1.15, esy - TILE_PX * 1.3);
    ctx.font = '5px "Press Start 2P"';
  }
}

/** Draw port labels on map */
export function drawPortLabels(
  ctx: CanvasRenderingContext2D,
  ports: Port[],
  cam: Camera,
): void {
  const x0 = ~~cam.x - 3;
  const y0 = ~~cam.y - 3;
  const x1 = ~~(cam.x + cam.screenW / TILE_PX) + 3;
  const y1 = ~~(cam.y + cam.screenH / TILE_PX) + 3;

  ctx.font = '5px "Press Start 2P"';
  ctx.textAlign = 'center';

  for (const p of ports) {
    if (p.x < x0 || p.x > x1 || p.y < y0 || p.y > y1) continue;
    const ppx = (p.x - cam.x) * TILE_PX + 8;
    const ppy = (p.y - cam.y) * TILE_PX - 6;
    const lc = p.rel === 'friendly' ? '#44ff88' : p.rel === 'enemy' ? '#ff5544' : '#ffcc44';
    ctx.fillStyle = 'rgba(0,0,0,0.82)';
    ctx.fillRect(ppx - 30, ppy - 7, 60, 10);
    ctx.fillStyle = lc;
    ctx.fillText((NATION_FLAGS[p.nat] ?? '') + ' ' + p.name, ppx, ppy);
  }
}
