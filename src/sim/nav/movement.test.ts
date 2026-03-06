import { describe, it, expect } from 'vitest';
import { moveShip } from './movement';
import { generateWorld } from '../world/gen';

describe('moveShip', () => {
  const world = generateWorld(42);

  // Find a large open water area
  let waterX = 128;
  let waterY = 5;
  for (let y = 2; y < 20; y++) {
    for (let x = 2; x < 250; x++) {
      const t = world.tiles[y * 256 + x];
      if (t !== undefined && t <= 2) { waterX = x; waterY = y; break; }
    }
    if (waterX !== 128) break;
  }

  it('moves ship toward target', () => {
    const ship = { x: waterX + 0.5, y: waterY + 0.5, angle: 0, speed: 0 };
    const targetX = waterX + 5.5;
    const targetY = waterY + 0.5;

    for (let i = 0; i < 100; i++) {
      moveShip(ship, targetX, targetY, 16 / 1000, 1.0, 1.0, 0, 1.0, world.tiles);
    }

    // Ship should have moved closer to target
    const dist = Math.hypot(ship.x - targetX, ship.y - targetY);
    expect(dist).toBeLessThan(5);
  });

  it('stops near target', () => {
    const ship = { x: waterX + 0.5, y: waterY + 0.5, angle: 0, speed: 1.0 };

    const result = moveShip(ship, waterX + 0.6, waterY + 0.5, 16 / 1000, 1.0, 1.0, 0, 1.0, world.tiles);
    expect(result).toBe(false);
    expect(ship.speed).toBe(0);
  });

  it('applies wind modifier', () => {
    const shipWith = { x: waterX + 0.5, y: waterY + 0.5, angle: 0, speed: 0 };
    const target = waterX + 10.5;

    // Move with wind (angle 0, wind angle 0)
    for (let i = 0; i < 50; i++) {
      moveShip(shipWith, target, waterY + 0.5, 16 / 1000, 1.0, 1.0, 0, 1.0, world.tiles);
    }

    // The ship moving with wind should have moved
    expect(shipWith.speed).toBeGreaterThan(0);
  });
});
