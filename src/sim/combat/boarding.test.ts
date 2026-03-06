import { describe, it, expect } from 'vitest';
import { resolveBoarding } from './boarding';
import { asShipId } from '../../core/types';
import type { PlayerShip, EnemyShip } from '../../core/types';
import { createTestEnemy, createTestPlayer } from '../../test/fixtures';

function mkPlayer(overrides: Partial<PlayerShip> = {}): PlayerShip {
  return createTestPlayer({ id: asShipId(0), bspd: 1.1, ...overrides });
}

function mkEnemy(): EnemyShip {
  return createTestEnemy({
    id: asShipId(1),
    hp: 2,
    maxHp: 8,
    bspd: 1.4,
    disabled: true,
    tier: 'EASY',
    beh: { aggro: 0, flee: 0.6, wander: true, portAttack: false },
    changeT: 300,
    loot: 150,
  });
}

describe('resolveBoarding', () => {
  it('returns a result with crew losses', () => {
    const player = mkPlayer({ crew: 100 });
    const enemy = mkEnemy();
    const result = resolveBoarding(player, enemy);
    expect(result.playerCrewLost).toBeGreaterThan(0);
    expect(typeof result.success).toBe('boolean');
    expect(result.msg.length).toBeGreaterThan(0);
  });

  it('more crew = better chances', () => {
    let wins = 0;
    for (let i = 0; i < 50; i++) {
      const player = mkPlayer({ crew: 200, hp: 14, maxHp: 14 });
      const enemy = mkEnemy();
      if (resolveBoarding(player, enemy).success) wins++;
    }
    expect(wins).toBeGreaterThan(20); // Should win most with 200 crew vs sloop
  });

  it('successful boarding gives more loot than basic looting', () => {
    const player = mkPlayer({ crew: 200 });
    const enemy = mkEnemy();
    const result = resolveBoarding(player, enemy);
    if (result.success) {
      expect(result.loot).toBeGreaterThan(enemy.loot); // 1.5x bonus
    }
  });
});
