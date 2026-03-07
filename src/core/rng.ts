import type { Seed } from './types';

/** Mulberry32 deterministic PRNG — same seed = same sequence */
export interface Rng {
  next(): number;
  int(min: number, max: number): number;
  float(min: number, max: number): number;
  pick<T>(arr: readonly T[]): T;
}

export function createRng(seed: Seed): Rng {
  let s = seed as number;

  function next(): number {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0x100000000;
  }

  return {
    next,
    int(min: number, max: number): number {
      return min + Math.floor(next() * (max - min + 1));
    },
    float(min: number, max: number): number {
      return min + next() * (max - min);
    },
    pick<T>(arr: readonly T[]): T {
      return arr[Math.floor(next() * arr.length)] as T;
    },
  };
}

/** Simple raw RNG function for hot paths (noise generation) */
export function mkRawRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0x100000000;
  };
}
