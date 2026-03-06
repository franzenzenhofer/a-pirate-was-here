import { describe, it, expect } from 'vitest';
import { makeNoise } from './noise';
import { mkRawRng } from './rng';

describe('makeNoise', () => {
  it('produces deterministic output for same seed', () => {
    const a = makeNoise(mkRawRng(42), 32, 32, 3);
    const b = makeNoise(mkRawRng(42), 32, 32, 3);
    expect(a.length).toBe(32 * 32);
    for (let i = 0; i < a.length; i++) {
      expect(a[i]).toBe(b[i]);
    }
  });

  it('produces values roughly in [0, 1]', () => {
    const noise = makeNoise(mkRawRng(7), 64, 64, 4);
    for (let i = 0; i < noise.length; i++) {
      expect(noise[i]).toBeGreaterThanOrEqual(-0.1);
      expect(noise[i]).toBeLessThanOrEqual(1.1);
    }
  });

  it('produces different output for different seeds', () => {
    const a = makeNoise(mkRawRng(1), 16, 16, 3);
    const b = makeNoise(mkRawRng(2), 16, 16, 3);
    let same = 0;
    for (let i = 0; i < a.length; i++) {
      if (a[i] === b[i]) same++;
    }
    expect(same).toBeLessThan(a.length * 0.5);
  });
});
