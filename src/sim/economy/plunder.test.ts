import { describe, expect, it } from 'vitest';
import { asShipId, asPortId } from '../../core/types';
import { sellPlunder } from './plunder';
import type { GameState } from '../state/game-state';
import { createTestPlayer, createTestSettings, createTestState } from '../../test/fixtures';

function mkState(): GameState {
  return createTestState({
    player: createTestPlayer({
      id: asShipId(0),
      hp: 10,
      maxHp: 10,
      cn: 4,
      rl: 4000,
      rng: 4,
      acc: 0.5,
      bspd: 2,
      col: '#fff',
      tk: 'SLOOP',
      gold: 100,
      crew: 50,
    }),
    plunder: [{ name: 'Port Booty', value: 100, source: 'HAVANA', qty: 2 }],
    settings: createTestSettings({ minimapMode: 'full' }),
  });
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
