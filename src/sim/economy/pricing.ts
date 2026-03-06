import type { Port } from '../../core/types';

const RELATION_MULTIPLIER: Record<string, number> = {
  friendly: 1,
  neutral: 1.3,
  enemy: 1.6,
};

export function tradeMultiplier(relation: string): number {
  return RELATION_MULTIPLIER[relation] ?? 1.1;
}

export function tradePriceFor(port: Port, goodName: string): number | null {
  const base = port.prices[goodName];
  if (base === undefined) return null;
  return Math.max(1, ~~(base * tradeMultiplier(port.rel)));
}
