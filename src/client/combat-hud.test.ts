import { describe, expect, it } from 'vitest';
import { createHullMeter, createReloadMeter, getCombatHudState, selectCombatTarget } from './combat-hud';
import type { EnemyShip, PlayerShip } from '../core/types';
import { asShipId } from '../core/types';
import type { GameState } from '../sim/state/game-state';
import { createTestEnemy, createTestPlayer, createTestSettings, createTestState } from '../test/fixtures';

function createPlayer(overrides: Partial<PlayerShip> = {}): PlayerShip {
  return createTestPlayer({ id: asShipId(1), x: 10, y: 10, ...overrides });
}

function createEnemy(overrides: Partial<EnemyShip> = {}): EnemyShip {
  return createTestEnemy({ id: asShipId(2), x: 13, y: 10, maxHp: 10, hp: 10, reloadT: 1200, turnRate: 1, ...overrides });
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

  it('rounds hull labels to clean integers', () => {
    expect(createHullMeter(48.25, 60)).toEqual({
      label: '48/60',
      progress: 48.25 / 60,
    });
  });

  it('hides the combat hud after defeat', () => {
    const player = createPlayer({ hp: 0, name: 'EMBER CUTLASS' });
    const enemy = createEnemy({ name: 'ROYAL BANNER' });
    const gs = createGameState(player, [enemy], true);

    expect(getCombatHudState(gs)).toBeNull();
  });
});

function createGameState(player: PlayerShip, enemies: EnemyShip[], gameOver = false): GameState {
  return createTestState({
    seed: 1,
    world: { tiles: new Uint8Array(4), variation: new Uint8Array(4), heightmap: new Float32Array(4) },
    player,
    enemies,
    gameOver,
    settings: createTestSettings({ minimapMode: 'hidden', preferredSeed: 1 }),
  });
}
