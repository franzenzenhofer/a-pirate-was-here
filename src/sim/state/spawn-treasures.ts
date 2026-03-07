import type { Treasure } from '../../core/types';
import { WORLD_W, WORLD_H } from '../../config/world';
import { mkRawRng } from '../../core/rng';
import { isSail } from '../world/gen';

export function spawnTreasures(tiles: Uint8Array, count: number, existing: Treasure[]): Treasure[] {
  return spawnTreasuresWithSeed(tiles, count, existing, 22 + existing.length);
}

export function spawnTreasuresWithSeed(
  tiles: Uint8Array,
  count: number,
  existing: Treasure[],
  seed: number,
): Treasure[] {
  const rngValue = mkRawRng(seed);
  const treasures: Treasure[] = [];

  for (let attempt = 0; attempt < 5000 && treasures.length < count; attempt++) {
    const x = ~~(rngValue() * WORLD_W);
    const y = ~~(rngValue() * WORLD_H);
    if (!isTreasureShoreSpot(tiles, x, y)) continue;
    if (isTooClose([...existing, ...treasures], x, y)) continue;
    treasures.push({ x, y, gold: 200 + ~~(rngValue() * 1400), looted: false });
  }

  return treasures;
}

export function isTreasureShoreSpot(tiles: Uint8Array, x: number, y: number): boolean {
  const tile = tiles[y * WORLD_W + x];
  if (tile !== 3 && tile !== 4) return false;

  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      if (isSail(tiles, x + dx, y + dy)) return true;
    }
  }

  return false;
}

function isTooClose(treasures: Treasure[], x: number, y: number): boolean {
  return treasures.some(treasure => !treasure.looted && Math.abs(treasure.x - x) < 5 && Math.abs(treasure.y - y) < 5);
}
