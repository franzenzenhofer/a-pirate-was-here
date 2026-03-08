import { describe, expect, it } from 'vitest';
import { resolveRamming } from './ramming';
import { createTestEnemy, createTestPlayer, createTestState } from '../../test/fixtures';

function collisionRadius(maxHp: number): number {
  return 0.7 + maxHp / 48;
}

describe('resolveRamming', () => {
  it('separates overlapping ships after impact', () => {
    const player = createTestPlayer({ x: 10, y: 10, angle: 0, speed: 2 });
    const enemy = createTestEnemy({ x: 10.4, y: 10, angle: Math.PI, speed: 2 });
    const gs = createTestState({ player, enemies: [enemy] });

    resolveRamming(gs);

    const distance = Math.hypot(gs.player.x - gs.enemies[0]!.x, gs.player.y - gs.enemies[0]!.y);
    const minimumDistance = collisionRadius(gs.player.maxHp) + collisionRadius(gs.enemies[0]!.maxHp);

    expect(distance).toBeGreaterThanOrEqual(minimumDistance - 0.02);
    expect(gs.player.impactT).toBeGreaterThan(0);
    expect(gs.enemies[0]!.impactT).toBeGreaterThan(0);
  });
});
