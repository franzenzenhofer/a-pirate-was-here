import { describe, expect, it } from 'vitest';
import { assignHiddenTreasureMap, revealTreasureByBlast } from './pickups';
import { createTestState } from '../../test/fixtures';

describe('pickups', () => {
  it('assigns a hidden treasure map and reveals it when blasted', () => {
    const gs = createTestState({
      treasures: [{ x: 8, y: 9, gold: 600, looted: false }],
    });

    const hidden = assignHiddenTreasureMap(gs, 'TEST CAPTAIN');
    const revealed = revealTreasureByBlast(gs, 8.5, 9.5);

    expect(hidden?.hidden).toBe(false);
    expect(hidden?.mapId).toBeTruthy();
    expect(revealed?.revealed).toBe(true);
    expect(gs.activeTreasureMapId).toBeNull();
  });
});
