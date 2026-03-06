import { describe, expect, it } from 'vitest';
import { createReloadMeter, selectCombatTarget } from './combat-hud';
import type { EnemyShip, PlayerShip } from '../core/types';
import { asShipId } from '../core/types';

function createPlayer(overrides: Partial<PlayerShip> = {}): PlayerShip {
  return {
    id: asShipId(1),
    x: 10,
    y: 10,
    angle: 0,
    speed: 0,
    targetX: null,
    targetY: null,
    hp: 14,
    maxHp: 14,
    cn: 8,
    rl: 5500,
    rng: 5.5,
    acc: 0.6,
    bspd: 2.6,
    col: '#44aaff',
    tk: 'BRIGANTINE',
    reloadT: 0,
    disabled: false,
    sunk: false,
    captured: false,
    wakePoints: [],
    turnRate: 1,
    nat: 'PIRATE',
    gold: 500,
    crew: 80,
    fame: 0,
    kills: 0,
    day: 1,
    dayT: 0,
    fleet: [],
    cargo: [],
    upgrades: { hull: 0, sails: 0, range: 0 },
    ...overrides,
  };
}

function createEnemy(overrides: Partial<EnemyShip> = {}): EnemyShip {
  return {
    id: asShipId(2),
    x: 13,
    y: 10,
    angle: 0,
    speed: 0,
    targetX: null,
    targetY: null,
    hp: 10,
    maxHp: 10,
    cn: 4,
    rl: 4500,
    rng: 4.5,
    acc: 0.55,
    bspd: 3,
    col: '#88ffaa',
    tk: 'SLOOP',
    reloadT: 1200,
    disabled: false,
    sunk: false,
    captured: false,
    wakePoints: [],
    turnRate: 1,
    nat: 'SPAIN',
    role: 'MERCHANT',
    tier: 'I',
    ti: 0,
    beh: { aggro: 0, flee: 0.3, wander: true, portAttack: false },
    state: 'WANDER',
    stTimer: 0,
    changeT: 0,
    loot: 100,
    xp: 1,
    homePort: null,
    attackTarget: null,
    ...overrides,
  };
}

describe('combat-hud', () => {
  it('tracks the nearest active enemy in engagement range', () => {
    const player = createPlayer();
    const nearEnemy = createEnemy({ id: asShipId(2), x: 13, y: 10, tk: 'SLOOP' });
    const farEnemy = createEnemy({ id: asShipId(3), x: 20, y: 10, tk: 'FRIGATE' });

    const selected = selectCombatTarget(player, [farEnemy, nearEnemy]);

    expect(selected?.id).toBe(nearEnemy.id);
  });

  it('ignores disabled and out-of-range ships', () => {
    const player = createPlayer();
    const disabledEnemy = createEnemy({ id: asShipId(2), x: 12, y: 10, disabled: true });
    const distantEnemy = createEnemy({ id: asShipId(3), x: 30, y: 10 });

    const selected = selectCombatTarget(player, [disabledEnemy, distantEnemy]);

    expect(selected).toBeNull();
  });

  it('reports reload progress and readiness labels', () => {
    expect(createReloadMeter(0, 5500)).toEqual({
      label: 'READY',
      progress: 1,
      remainingMs: 0,
    });

    expect(createReloadMeter(2750, 5500)).toEqual({
      label: '2.8s',
      progress: 0.5,
      remainingMs: 2750,
    });
  });
});
