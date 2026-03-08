import { describe, expect, it } from 'vitest';
import { getContextHint } from './context-hint';
import { createTestEnemy, createTestPort, createTestState, createTestPlayer } from '../test/fixtures';

describe('getContextHint', () => {
  it('prioritizes combat guidance', () => {
    const gs = createTestState({
      player: createTestPlayer({ x: 10, y: 10, rng: 6, reloadT: 0 }),
      enemies: [createTestEnemy({ x: 12, y: 10, state: 'CHASE', reloadT: 2000, name: 'RED COMET' })],
    });
    const hint = getContextHint(gs);
    expect(hint?.title).toContain('ENGAGING');
    expect(hint?.detail).toContain('enemy');
  });

  it('prompts boarding for disabled ships in range', () => {
    const gs = createTestState({
      player: createTestPlayer({ x: 10, y: 10 }),
      enemies: [createTestEnemy({ x: 11, y: 10, disabled: true, name: 'BLACK WRAITH' })],
    });
    const hint = getContextHint(gs);
    expect(hint?.title).toContain('BOARD');
  });

  it('describes friendly ports', () => {
    const gs = createTestState({
      player: createTestPlayer({ x: 10, y: 10 }),
      ports: [createTestPort({ x: 12, y: 10, name: 'NASSAU', rel: 'friendly' })],
    });
    const hint = getContextHint(gs);
    expect(hint?.title).toContain('FRIENDLY PORT');
    expect(hint?.detail).toContain('repair');
  });

  it('warns about gold fever', () => {
    const gs = createTestState({
      player: createTestPlayer({ feverT: 12_000, unsharedGold: 500 }),
    });
    const hint = getContextHint(gs);
    expect(hint?.title).toBe('GOLD FEVER');
  });

  it('shows early voyage guidance for fresh captains', () => {
    const gs = createTestState({
      player: createTestPlayer({ fame: 0, day: 1 }),
      activeQuest: null,
    });
    const hint = getContextHint(gs);
    expect(hint?.title).toBe('SEA LEGS');
    expect(hint?.detail).toContain('Trade first');
  });
});
