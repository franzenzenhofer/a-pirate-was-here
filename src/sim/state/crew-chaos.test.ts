import { describe, expect, it } from 'vitest';
import { FEVER_DURATION, HYPED_DURATION, shareLootAndPassRum, updateCrewChaos } from './crew-chaos';
import { createTestState } from '../../test/fixtures';

describe('crew-chaos', () => {
  it('shares loot at sea and grants the hyped buff', () => {
    const gs = createTestState({
      player: {
        ...createTestState().player,
        gold: 1000,
        unsharedGold: 500,
        feverT: FEVER_DURATION,
      },
    });

    const msg = shareLootAndPassRum(gs);

    expect(msg).toContain('HYPED');
    expect(gs.player.gold).toBe(800);
    expect(gs.player.unsharedGold).toBe(0);
    expect(gs.player.feverT).toBe(0);
    expect(gs.player.hypedT).toBe(HYPED_DURATION);
  });

  it('triggers mutiny when gold fever expires', () => {
    const baseline = createTestState().player;
    const gs = createTestState({
      player: {
        ...baseline,
        crew: 80,
        gold: 1200,
        unsharedGold: 300,
        feverT: 1,
      },
    });

    updateCrewChaos(gs, 10);

    expect(gs.player.crew).toBeLessThan(80);
    expect(gs.player.mutinyGold).toBeGreaterThan(0);
    expect(gs.enemies.some(enemy => enemy.name?.includes('MUTINEERS'))).toBe(true);
  });
});
