import type { Port } from '../../core/types';
import { isSail } from '../world/gen';
import type { GameState } from './game-state';
import { nextRandom, randomFloat, randomPick } from './random';

export function findSeaSpawnNearPlayer(
  gs: GameState,
  minDistance: number,
  maxDistance: number,
): { x: number; y: number } | null {
  for (let attempt = 0; attempt < 24; attempt++) {
    const angle = nextRandom(gs) * Math.PI * 2;
    const distance = randomFloat(gs, minDistance, maxDistance);
    const x = gs.player.x + Math.cos(angle) * distance;
    const y = gs.player.y + Math.sin(angle) * distance;
    if (isSail(gs.world.tiles, Math.round(x), Math.round(y))) return { x, y };
  }
  return null;
}

export function tagFalseIslands(gs: GameState): void {
  if (!gs.activeTreasureMapId) return;
  const target = gs.treasures.find(treasure => treasure.mapId === gs.activeTreasureMapId && !treasure.looted);
  if (!target || typeof target.fakeIsland === 'boolean') return;
  target.fakeIsland = ((target.x * 13 + target.y * 17 + gs.seed) % 5) === 0;
}

export function nearestRumor(gs: GameState, port: Port): string {
  const activeRival = gs.rivals.find(entry => !entry.defeated);
  const rumors = [
    gs.activeTreasureMapId ? `Locals whisper that a marked beach east of ${port.name} hides fresh treasure.` : null,
    activeRival ? `A tavern keeper saw ${activeRival.name} near the trade lanes.` : null,
    gs.player.gold > gs.player.fame * 50 ? 'Pirates are calling you a rich coward. Hunters are forming.' : null,
    gs.era >= 2 ? 'Sailors speak of pink fog that steals the helm unless cannon thunder breaks the spell.' : null,
    gs.era >= 3 ? 'A pale fleet has been seen where the moonlight meets dead-calm water.' : null,
  ].filter(Boolean) as string[];
  return randomPick(gs, rumors.length > 0 ? rumors : ['The next legend is always one sea lane away.']);
}
