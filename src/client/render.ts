import { SHIP_TYPES } from '../config/ships';
import { TILE_PX } from '../config/world';
import type { GameState } from '../sim/state/game-state';
import type { Camera } from '../renderer/camera';
import { drawMap } from '../renderer/canvas/map';
import { drawShip, drawWake, drawHealthBar } from '../renderer/canvas/ships';
import { drawCannonballs, drawParticles, drawTreasures, drawNavTarget } from '../renderer/canvas/effects';
import { drawEnemyLabels, drawPortLabels } from '../renderer/canvas/labels';

export function renderGame(
  ctx: CanvasRenderingContext2D,
  gs: GameState,
  cam: Camera,
  screenW: number,
  screenH: number,
): void {
  ctx.fillStyle = '#0a0e1a';
  ctx.fillRect(0, 0, screenW, screenH);

  drawMap(ctx, cam, gs.world.tiles, gs.world.variation);
  drawTreasures(ctx, gs.treasures, cam);

  // Wakes — only draw for on-screen enemies
  const wakeMargin = 3;
  const wx0 = cam.x - wakeMargin, wy0 = cam.y - wakeMargin;
  const wx1 = cam.x + screenW / TILE_PX + wakeMargin;
  const wy1 = cam.y + screenH / TILE_PX + wakeMargin;
  for (const en of gs.enemies) {
    if (en.sunk || en.x < wx0 || en.x > wx1 || en.y < wy0 || en.y > wy1) continue;
    drawWake(ctx, en.wakePoints, cam.x, cam.y, 0.18, 1.5);
  }
  drawWake(ctx, gs.player.wakePoints, cam.x, cam.y, 0.3, 2.5);

  // Enemy ships
  for (const en of gs.enemies) {
    if (en.sunk) continue;
    const esx = (en.x - cam.x) * TILE_PX;
    const esy = (en.y - cam.y) * TILE_PX;
    if (esx < -50 || esx > screenW + 50 || esy < -50 || esy > screenH + 50) continue;
    if (en.hp < en.maxHp) drawHealthBar(ctx, esx, esy, en.hp, en.maxHp);
    drawShip(ctx, esx, esy, en.angle, en.col, en.tk, 0.9, en.disabled);
  }
  drawEnemyLabels(ctx, gs.enemies, cam);

  // Player
  const player = gs.player;
  const psx = (player.x - cam.x) * TILE_PX;
  const psy = (player.y - cam.y) * TILE_PX;
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = '#ffffaa';
  ctx.fillRect(psx - 18, psy - 18, 36, 36);
  ctx.globalAlpha = 1;
  drawShip(ctx, psx, psy, player.angle, SHIP_TYPES[player.tk]?.col ?? '#44aaff', player.tk, 1.05, false);

  // Nav target
  if (player.targetX !== null && player.targetY !== null) {
    drawNavTarget(ctx, psx, psy, player.targetX, player.targetY, cam);
  }

  drawCannonballs(ctx, gs.cannonballs, cam);
  drawParticles(ctx, gs.particles, cam);
  drawPortLabels(ctx, gs.ports, cam);
}
