import { describe, it, expect } from 'vitest';
import { fireBroadside } from './naval';

describe('fireBroadside', () => {
  it('creates cannonballs', () => {
    const balls = fireBroadside(10, 10, 0, 15, 10, true, 2, 5, 3);
    expect(balls.length).toBe(3);
  });

  it('fires from correct side', () => {
    // Target to starboard (right of heading)
    const balls = fireBroadside(10, 10, 0, 10, 15, true, 2, 5, 1);
    expect(balls.length).toBe(1);
    // Ball should fire roughly perpendicular to heading
    const ball = balls[0]!;
    expect(ball.vy).toBeGreaterThan(0); // Should fire toward starboard
  });

  it('respects max cannon count', () => {
    const balls = fireBroadside(10, 10, 0, 15, 10, true, 2, 5, 10);
    expect(balls.length).toBe(5); // Max 5 shots per broadside
  });

  it('marks player cannonballs correctly', () => {
    const player = fireBroadside(10, 10, 0, 15, 10, true, 2, 5, 3);
    const enemy = fireBroadside(10, 10, 0, 15, 10, false, 1, 5, 3);
    expect(player[0]!.isPlayer).toBe(true);
    expect(enemy[0]!.isPlayer).toBe(false);
  });

  it('sets correct damage and range', () => {
    const balls = fireBroadside(10, 10, 0, 15, 10, true, 3, 7, 2);
    expect(balls[0]!.dmg).toBe(3);
    expect(balls[0]!.maxDist).toBe(7);
  });
});
