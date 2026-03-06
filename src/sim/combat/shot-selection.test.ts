import { describe, expect, it } from 'vitest';
import { broadsideScore, hasGoodBroadside } from './shot-selection';

describe('shot-selection', () => {
  it('prefers perpendicular broadside angles', () => {
    const attacker = { x: 0, y: 0, angle: 0, rng: 6 };
    const broadsideTarget = { x: 0, y: 4 };
    const bowTarget = { x: 4, y: 0 };

    expect(broadsideScore(attacker, broadsideTarget)).toBeGreaterThan(0.9);
    expect(broadsideScore(attacker, bowTarget)).toBeLessThan(0.2);
  });

  it('fires only when the target is in range and on a broadside', () => {
    const attacker = { x: 0, y: 0, angle: 0, rng: 6 };

    expect(hasGoodBroadside(attacker, { x: 0, y: 4 })).toBe(true);
    expect(hasGoodBroadside(attacker, { x: 4, y: 0 })).toBe(false);
    expect(hasGoodBroadside(attacker, { x: 0, y: 9 })).toBe(false);
  });
});
