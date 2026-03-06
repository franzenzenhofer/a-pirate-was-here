import { describe, expect, it } from 'vitest';
import { generateWorld } from '../world/gen';
import { isTreasureShoreSpot, spawnTreasures } from './spawn';

describe('spawnTreasures', () => {
  it('spawns treasures only on shoreline-adjacent land', () => {
    const world = generateWorld(42);
    const treasures = spawnTreasures(world.tiles, 20, []);
    expect(treasures.length).toBeGreaterThan(0);
    expect(treasures.every(t => isTreasureShoreSpot(world.tiles, t.x, t.y))).toBe(true);
  });
});
