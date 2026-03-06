import { describe, expect, it } from 'vitest';
import { asShipId } from '../core/types';
import type { GameState } from '../sim/state/game-state';
import { applySnapshot, prepareFreshStart, shouldLoadFromStorage, snapshotGame } from './save-game';
import { createTestPlayer, createTestSettings, createTestState } from '../test/fixtures';

function mkState(): GameState {
  return createTestState({
    seed: 42,
    world: { tiles: Uint8Array.from([0, 1, 2]), variation: Uint8Array.from([0, 1, 2]), heightmap: Float32Array.from([0, 0.5, 1]) },
    player: createTestPlayer({
      id: asShipId(0),
      x: 1,
      y: 2,
      hp: 10,
      maxHp: 12,
      cn: 4,
      rl: 4000,
      rng: 4,
      acc: 0.5,
      bspd: 2,
      col: '#fff',
      tk: 'SLOOP',
      gold: 120,
      crew: 50,
      fame: 20,
      kills: 1,
      day: 3,
      fleet: [{ tk: 'CUTTER' }],
      upgrades: { hull: 1, sails: 0, range: 2 },
    }),
    era: 1,
    reputation: 4,
    settings: createTestSettings({ minimapMode: 'full', preferredSeed: 42 }),
  });
}

describe('save-game', () => {
  it('round-trips a game snapshot back into state', () => {
    const original = mkState();
    const saved = snapshotGame(original);
    const restored = mkState();
    applySnapshot(restored, saved);
    expect(restored.player.gold).toBe(original.player.gold);
    expect(restored.player.upgrades.range).toBe(2);
    expect(Array.from(restored.world.tiles)).toEqual([0, 1, 2]);
  });

  it('skips saved game loading once after starting fresh', () => {
    const session = new Map<string, string>();
    const local = new Map<string, string>();
    Object.defineProperty(globalThis, 'sessionStorage', {
      value: {
        getItem: (key: string) => session.get(key) ?? null,
        setItem: (key: string, value: string) => { session.set(key, value); },
        removeItem: (key: string) => { session.delete(key); },
      },
      configurable: true,
    });
    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: (key: string) => local.get(key) ?? null,
        setItem: (key: string, value: string) => { local.set(key, value); },
        removeItem: (key: string) => { local.delete(key); },
      },
      configurable: true,
    });

    prepareFreshStart();

    expect(shouldLoadFromStorage()).toBe(false);
    expect(shouldLoadFromStorage()).toBe(true);
  });
});
