import { describe, expect, it } from 'vitest';
import { updateObjectives } from './objectives';
import { createTestPlayer, createTestState } from '../../test/fixtures';

describe('updateObjectives', () => {
  it('starts fresh captains on the cargo tutorial quest', () => {
    const gs = createTestState({
      player: createTestPlayer({ fame: 0, day: 1, cargo: [], fleet: [], kills: 0 }),
    });

    updateObjectives(gs);

    expect(gs.activeQuest?.id).toBe('first-hold');
    expect(gs.activeQuest?.detail).toContain('buy 5 cargo');
  });

  it('moves the starter ladder to fleet capture after the first cargo milestone', () => {
    const gs = createTestState({
      player: createTestPlayer({
        fame: 0,
        day: 2,
        cargo: [{ good: 'RUM', qty: 5, buyPrice: 40 }],
        fleet: [],
        kills: 0,
      }),
    });

    updateObjectives(gs);

    expect(gs.activeQuest?.id).toBe('first-prize');
  });

  it('falls back to the repeatable quest pool once the starter ladder is done', () => {
    const gs = createTestState({
      player: createTestPlayer({
        fame: 45,
        day: 3,
        cargo: [{ good: 'RUM', qty: 12, buyPrice: 40 }],
        fleet: [{ tk: 'SLOOP' }],
        kills: 2,
      }),
    });

    updateObjectives(gs);

    expect(['sinkers', 'traders', 'fleet']).toContain(gs.activeQuest?.id);
  });
});
