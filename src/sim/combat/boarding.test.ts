import { describe, it, expect } from 'vitest';
import { resolveBoarding } from './boarding';
import { asShipId } from '../../core/types';
import type { PlayerShip, EnemyShip } from '../../core/types';

function mkPlayer(overrides: Partial<PlayerShip> = {}): PlayerShip {
  return {
    id: asShipId(0), x: 0, y: 0, angle: 0, speed: 0,
    targetX: null, targetY: null,
    hp: 14, maxHp: 14, cn: 8, rl: 5500, rng: 5.5, acc: 0.6,
    bspd: 1.1, col: '#44aaff', tk: 'BRIGANTINE',
    reloadT: 0, disabled: false, sunk: false, captured: false,
    wakePoints: [], turnRate: 1.0, nat: 'PIRATE',
    gold: 500, crew: 80, fame: 0, kills: 0, day: 1, dayT: 0, fleet: [], cargo: [],
    upgrades: { hull: 0, sails: 0, range: 0 },
    ...overrides,
  };
}

function mkEnemy(): EnemyShip {
  return {
    id: asShipId(1), x: 1, y: 1, angle: 0, speed: 0,
    targetX: null, targetY: null,
    hp: 2, maxHp: 8, cn: 4, rl: 4500, rng: 4.5, acc: 0.55,
    bspd: 1.4, col: '#88ffaa', tk: 'SLOOP',
    reloadT: 0, disabled: true, sunk: false, captured: false,
    wakePoints: [], turnRate: 1.2, nat: 'SPAIN',
    role: 'MERCHANT', tier: 'EASY', ti: 0,
    beh: { aggro: 0, flee: 0.6, wander: true, portAttack: false },
    state: 'WANDER', stTimer: 0, changeT: 300,
    loot: 150, xp: 1, homePort: null, attackTarget: null,
  };
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
