import { describe, expect, it } from 'vitest';
import { desiredCombatRange, looksLikeRichTarget, shouldMerchantPanic, shouldPiratePressTarget } from './strategy-rules';

describe('strategy-rules', () => {
  it('flags rich low-fame players as prime targets', () => {
    expect(looksLikeRichTarget({ gold: 4000, fame: 40 })).toBe(true);
    expect(looksLikeRichTarget({ gold: 900, fame: 200 })).toBe(false);
  });

  it('makes merchants panic under pressure', () => {
    expect(shouldMerchantPanic({ gold: 3000, fame: 480 }, { intimidated: false }, 6)).toBe(true);
    expect(shouldMerchantPanic({ gold: 400, fame: 50 }, { intimidated: false }, 6)).toBe(false);
  });

  it('pushes pirates toward rich targets', () => {
    expect(shouldPiratePressTarget('PIRATE', { gold: 5000, fame: 20 }, 10)).toBe(true);
    expect(shouldPiratePressTarget('MERCHANT', { gold: 5000, fame: 20 }, 10)).toBe(false);
  });

  it('changes desired combat range based on pressure and reload', () => {
    const conservative = desiredCombatRange(
      { rng: 6, reloadT: 4000, rl: 5000, hp: 8, maxHp: 14, role: 'PIRATE', isHunter: false },
      { hp: 14, maxHp: 14 },
    );
    const aggressive = desiredCombatRange(
      { rng: 6, reloadT: 500, rl: 5000, hp: 14, maxHp: 14, role: 'WARSHIP', isHunter: true },
      { hp: 6, maxHp: 14 },
    );
    expect(conservative).toBeGreaterThan(aggressive);
  });
});
