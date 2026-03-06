import { describe, expect, it } from 'vitest';
import { eraForFame } from './progression';

describe('eraForFame', () => {
  it('advances eras from fame thresholds', () => {
    expect(eraForFame(0)).toBe(0);
    expect(eraForFame(65)).toBe(1);
    expect(eraForFame(170)).toBe(2);
    expect(eraForFame(320)).toBe(3);
    expect(eraForFame(600)).toBe(4);
  });
});
