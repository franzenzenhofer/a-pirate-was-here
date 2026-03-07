import { describe, expect, it } from 'vitest';
import { buyDrinksForTown, demandTribute, portPlunderMultiplier, serviceProfile } from './port-actions';
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

  it('gives ports economic personality through service profiles', () => {
    const player = createTestState().player;
    const dutch = createTestPort({ nat: 'DUTCH', rel: 'friendly' });
    const pirate = createTestPort({ nat: 'PIRATE', rel: 'friendly' });

    const dutchProfile = serviceProfile(dutch, player);
    const pirateProfile = serviceProfile(pirate, player);

    expect(dutchProfile.tradeBonusText).toContain('Plunder sells');
    expect(portPlunderMultiplier(dutch, player)).toBeGreaterThan(portPlunderMultiplier(createTestPort({ nat: 'SPAIN', rel: 'neutral' }), player));
    expect(pirateProfile.recruitCount).toBeGreaterThan(10);
  });
});
