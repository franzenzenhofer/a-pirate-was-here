import { describe, expect, it } from 'vitest';
import { displaySailingFlag, displayShipFlag, displayShipLabel, sailingNation } from './ship-identity';

describe('ship-identity', () => {
  it('shows pirate ships under the black flag', () => {
    const ship = { nat: 'PIRATE', flag: 'PIRATE' };

    expect(sailingNation(ship)).toBe('PIRATE');
    expect(displayShipFlag(ship)).toBe('PIR');
    expect(displaySailingFlag(ship)).toBe('BLACK FLAG');
  });

  it('prefers commissioned colors over the hull nation', () => {
    const ship = { nat: 'PIRATE', flag: 'ENGLAND' };

    expect(sailingNation(ship)).toBe('ENGLAND');
    expect(displayShipFlag(ship)).toBe('ENG');
    expect(displaySailingFlag(ship)).toBe('ENGLISH COLORS');
  });

  it('formats the board label as one identity line', () => {
    const ship = { name: 'EMBER CUTLASS', tk: 'BRIG', nat: 'PIRATE', flag: 'ENGLAND' };

    expect(displayShipLabel(ship)).toBe('ENG · EMBER CUTLASS');
  });
});
