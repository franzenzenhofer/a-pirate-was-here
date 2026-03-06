import { describe, it, expect } from 'vitest';
import { generateWorld, isSail } from './gen';
import { Tile } from '../../config/tiles';
import { WORLD_W, WORLD_H } from '../../config/world';

describe('generateWorld', () => {
  it('produces deterministic world from same seed', () => {
    const a = generateWorld(42);
    const b = generateWorld(42);
    expect(a.tiles.length).toBe(WORLD_W * WORLD_H);
    for (let i = 0; i < 1000; i++) {
      expect(a.tiles[i]).toBe(b.tiles[i]);
    }
  });

  it('contains all tile types', () => {
    const world = generateWorld(42);
    const types = new Set<number>();
    for (let i = 0; i < world.tiles.length; i++) {
      types.add(world.tiles[i]!);
    }
    expect(types.has(Tile.DEEP)).toBe(true);
    expect(types.has(Tile.SEA)).toBe(true);
    expect(types.has(Tile.SAND)).toBe(true);
    expect(types.has(Tile.GRASS)).toBe(true);
  });

  it('has ocean around edges', () => {
    const world = generateWorld(42);
    let edgeWater = 0;
    for (let x = 0; x < WORLD_W; x++) {
      const t = world.tiles[x]!;
      if (t <= Tile.REEF) edgeWater++;
    }
    expect(edgeWater).toBeGreaterThan(WORLD_W * 0.5);
  });
});

describe('isSail', () => {
  it('returns true for water tiles', () => {
    const world = generateWorld(42);
    // Find a deep water tile
    for (let i = 0; i < world.tiles.length; i++) {
      if (world.tiles[i] === Tile.DEEP) {
        const x = i % WORLD_W;
        const y = ~~(i / WORLD_W);
        expect(isSail(world.tiles, x, y)).toBe(true);
        break;
      }
    }
  });

  it('returns false for land tiles', () => {
    const world = generateWorld(42);
    for (let i = 0; i < world.tiles.length; i++) {
      if (world.tiles[i] === Tile.GRASS) {
        const x = i % WORLD_W;
        const y = ~~(i / WORLD_W);
        expect(isSail(world.tiles, x, y)).toBe(false);
        break;
      }
    }
  });

  it('returns false for out-of-bounds', () => {
    const world = generateWorld(42);
    expect(isSail(world.tiles, -1, 0)).toBe(false);
    expect(isSail(world.tiles, WORLD_W, 0)).toBe(false);
  });
});
