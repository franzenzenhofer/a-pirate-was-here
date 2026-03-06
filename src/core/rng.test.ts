import { describe, it, expect } from 'vitest';
import { createRng, mkRawRng } from './rng';
import { asSeed } from './types';

describe('createRng', () => {
  it('produces deterministic sequences', () => {
    const a = createRng(asSeed(42));
    const b = createRng(asSeed(42));
    expect(a.next()).toBe(b.next());
    expect(a.next()).toBe(b.next());
    expect(a.next()).toBe(b.next());
  });

  it('produces values in [0, 1)', () => {
    const rng = createRng(asSeed(123));
    for (let i = 0; i < 100; i++) {
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('int produces values in range', () => {
    const rng = createRng(asSeed(99));
    for (let i = 0; i < 100; i++) {
      const v = rng.int(1, 6);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(6);
    }
  });

  it('different seeds produce different sequences', () => {
    const a = createRng(asSeed(1));
    const b = createRng(asSeed(2));
    const va = [a.next(), a.next(), a.next()];
    const vb = [b.next(), b.next(), b.next()];
    expect(va).not.toEqual(vb);
  });
});

describe('mkRawRng', () => {
  it('produces deterministic results', () => {
    const a = mkRawRng(42);
    const b = mkRawRng(42);
    expect(a()).toBe(b());
    expect(a()).toBe(b());
  });
});
