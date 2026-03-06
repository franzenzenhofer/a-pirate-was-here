/** Trade goods available in the Caribbean */
export interface TradeGood {
  name: string;
  basePrice: number;
  volatility: number;
  color: string;
}

export const TRADE_GOODS: TradeGood[] = [
  { name: 'RUM',       basePrice: 40,  volatility: 0.4, color: '#cc8844' },
  { name: 'SUGAR',     basePrice: 25,  volatility: 0.3, color: '#ffeecc' },
  { name: 'TOBACCO',   basePrice: 55,  volatility: 0.5, color: '#886633' },
  { name: 'SPICES',    basePrice: 80,  volatility: 0.6, color: '#ff6644' },
  { name: 'SILK',      basePrice: 120, volatility: 0.7, color: '#cc88ff' },
  { name: 'COTTON',    basePrice: 30,  volatility: 0.25, color: '#eeeedd' },
  { name: 'WEAPONS',   basePrice: 100, volatility: 0.5, color: '#888899' },
  { name: 'MEDICINE',  basePrice: 90,  volatility: 0.4, color: '#44dd88' },
];

/** Generate port-specific prices using seed-based variation */
export function generatePortPrices(_portIndex: number, rngVal: () => number): Record<string, number> {
  const prices: Record<string, number> = {};
  for (const good of TRADE_GOODS) {
    const variation = 1 + (rngVal() - 0.5) * 2 * good.volatility;
    prices[good.name] = Math.max(5, ~~(good.basePrice * variation));
  }
  return prices;
}

/** Calculate crew wages per day */
export function crewWagesPerDay(crewCount: number): number {
  return ~~(crewCount * 0.3);
}
