import { describe, expect, it } from 'vitest';
import { asShipId, asPortId } from '../../core/types';
import { sellPlunder } from './plunder';
import type { GameState } from '../state/game-state';

function mkState(): GameState {
  return {
    seed: 42,
    world: { tiles: new Uint8Array(), variation: new Uint8Array(), heightmap: new Float32Array() },
    player: {
      id: asShipId(0), x: 0, y: 0, angle: 0, speed: 0, targetX: null, targetY: null,
      hp: 10, maxHp: 10, cn: 4, rl: 4000, rng: 4, acc: 0.5, bspd: 2, col: '#fff', tk: 'SLOOP',
      reloadT: 0, disabled: false, sunk: false, captured: false, wakePoints: [], turnRate: 1, nat: 'PIRATE',
      gold: 100, crew: 50, fame: 0, kills: 0, day: 1, dayT: 0, fleet: [], cargo: [],
      upgrades: { hull: 0, sails: 0, range: 0 },
    },
    enemies: [], ports: [], cannonballs: [], particles: [], treasures: [], wind: { angle: 0, strength: 1, timer: 0 },
    era: 0, spawnTimer: 0, treasureTimer: 0, portWarTimer: 0,
    activePort: null, capturedEnemy: null, tradePort: null, paused: false, gameOver: false,
    archive: [], nextArchiveId: 1, plunder: [{ name: 'Port Booty', value: 100, source: 'HAVANA', qty: 2 }],
    reputation: 0, settings: { audio: true, reducedMotion: false, textScale: 1, minimapMode: 'full' },
    activeQuest: null, activeEvent: null,
  };
}

describe('sellPlunder', () => {
  it('sells stored plunder using port relation pricing', () => {
    const gs = mkState();
    const msg = sellPlunder(gs, {
      id: asPortId(1), x: 0, y: 0, name: 'HAVANA', nat: 'SPAIN', rel: 'neutral',
      garrison: 0, wealth: 0, cannons: 0, attackTimer: 0, defFleet: [], prices: {},
    });
    expect(msg).toContain('260g');
    expect(gs.player.gold).toBe(360);
    expect(gs.plunder.length).toBe(0);
  });
});
