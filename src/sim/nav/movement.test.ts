import { describe, it, expect } from 'vitest';
import { moveShip } from './movement';
import { clampTargetToSea, resolveShipStep } from './collision';
import { Tile } from '../../config/tiles';
import { WORLD_H, WORLD_W } from '../../config/world';

function createOpenSea(): Uint8Array {
  return new Uint8Array(WORLD_W * WORLD_H);
}

describe('moveShip', () => {
  const tiles = createOpenSea();
  const waterX = 20;
  const waterY = 20;

  it('moves ship toward target', () => {
    const ship = { x: waterX + 0.5, y: waterY + 0.5, angle: 0, speed: 0 };
    const targetX = waterX + 5.5;
    const targetY = waterY + 0.5;

    for (let i = 0; i < 100; i++) {
      moveShip(ship, targetX, targetY, 16 / 1000, 1.0, 1.0, 0, 1.0, tiles);
    }

    const dist = Math.hypot(ship.x - targetX, ship.y - targetY);
    expect(dist).toBeLessThan(5);
  });

  it('stops near target', () => {
    const ship = { x: waterX + 0.5, y: waterY + 0.5, angle: 0, speed: 1.0 };

    const result = moveShip(ship, waterX + 0.6, waterY + 0.5, 16 / 1000, 1.0, 1.0, 0, 1.0, tiles);
    expect(result).toBe(false);
    expect(ship.speed).toBe(0);
  });

  it('applies wind modifier', () => {
    const shipWith = { x: waterX + 0.5, y: waterY + 0.5, angle: 0, speed: 0 };
    const target = waterX + 10.5;

    for (let i = 0; i < 50; i++) {
      moveShip(shipWith, target, waterY + 0.5, 16 / 1000, 1.0, 1.0, 0, 1.0, tiles);
    }

    expect(shipWith.speed).toBeGreaterThan(0);
  });

  it('slides along the open axis instead of freezing on a corner', () => {
    const stepTiles = createOpenSea();
    stepTiles[10 * WORLD_W + 11] = Tile.GRASS;
    stepTiles[11 * WORLD_W + 11] = Tile.GRASS;

    const ship = { x: 10.9, y: 10.9, angle: 0, speed: 2 };
    const moved = resolveShipStep(ship, 0.3, 0.3, 12, 12, stepTiles);

    expect(moved).toBe(true);
    expect(ship.x).toBeCloseTo(10.9, 5);
    expect(ship.y).toBeGreaterThan(10.9);
  });

  it('clamps land targets to the last reachable sea point', () => {
    const targetTiles = createOpenSea();
    for (let x = 14; x < 20; x++) targetTiles[10 * WORLD_W + x] = Tile.GRASS;

    const target = clampTargetToSea(targetTiles, 10.5, 10.5, 18.5, 10.5);
    expect(Math.floor(target.x)).toBe(13);
    expect(Math.floor(target.y)).toBe(10);
  });
});
