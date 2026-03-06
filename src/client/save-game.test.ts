import { describe, expect, it } from 'vitest';
import { asShipId } from '../core/types';
import type { GameState } from '../sim/state/game-state';
import { applySnapshot, snapshotGame } from './save-game';

function mkState(): GameState {
  return {
    seed: 42,
    world: { tiles: Uint8Array.from([0, 1, 2]), variation: Uint8Array.from([0, 1, 2]), heightmap: Float32Array.from([0, 0.5, 1]) },
    player: {
      id: asShipId(0), x: 1, y: 2, angle: 0, speed: 0, targetX: null, targetY: null,
      hp: 10, maxHp: 12, cn: 4, rl: 4000, rng: 4, acc: 0.5, bspd: 2, col: '#fff', tk: 'SLOOP',
      reloadT: 0, disabled: false, sunk: false, captured: false, wakePoints: [], turnRate: 1, nat: 'PIRATE',
      gold: 120, crew: 50, fame: 20, kills: 1, day: 3, dayT: 0, fleet: [{ tk: 'CUTTER' }], cargo: [],
      upgrades: { hull: 1, sails: 0, range: 2 },
    },
    enemies: [], ports: [], cannonballs: [], particles: [], treasures: [], wind: { angle: 0, strength: 1, timer: 0 },
    era: 1, spawnTimer: 0, treasureTimer: 0, portWarTimer: 0,
    activePort: null, capturedEnemy: null, tradePort: null, paused: false, gameOver: false,
    archive: [], nextArchiveId: 1, plunder: [], reputation: 4,
    settings: { audio: true, reducedMotion: false, textScale: 1, minimapMode: 'full' },
    activeQuest: null, activeEvent: null,
  };
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
});
