import { describe, expect, it } from 'vitest';
import { buyDrinksForTown, demandTribute } from './port-actions';
import { createTestPort, createTestState } from '../../test/fixtures';

describe('port-actions', () => {
  it('converts gold into fame and friendship when buying drinks', () => {
    const port = createTestPort({ rel: 'neutral' });
    const gs = createTestState({ ports: [port] });

    const msg = buyDrinksForTown(gs, port);

    expect(msg).toContain(port.name);
    expect(gs.player.fame).toBeGreaterThan(0);
    expect(gs.player.gold).toBeLessThan(500);
    expect(port.rel).toBe('friendly');
  });

  it('lets legendary captains demand tribute from neutral ports', () => {
    const port = createTestPort({ rel: 'neutral', wealth: 4000 });
    const gs = createTestState({
      player: { ...createTestState().player, fame: 1200 },
      ports: [port],
    });

    const msg = demandTribute(gs, port);

    expect(msg).toContain('pays');
    expect(gs.player.gold).toBeGreaterThan(500);
    expect(port.wealth).toBeLessThan(4000);
  });
});
