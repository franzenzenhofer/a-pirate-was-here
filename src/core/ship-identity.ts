import type { Ship } from './types';
import { nationStyle, normalizeNationKey } from './nation-style';

const NAME_PREFIXES = [
  'BLACK', 'IRON', 'SEA', 'STORM', 'GOLDEN', 'NIGHT',
  'RAVEN', 'BLOOD', 'SALT', 'EMBER', 'GHOST', 'ROYAL',
] as const;

const NAME_SUFFIXES = [
  'TIDE', 'WRAITH', 'LANTERN', 'TEMPEST', 'MARLIN', 'VOW',
  'CUTLASS', 'HORIZON', 'BANNER', 'WHISPER', 'COMET', 'SIREN',
] as const;

export function shipNameFromSeed(seed: number): string {
  const prefix = NAME_PREFIXES[Math.abs(seed) % NAME_PREFIXES.length] ?? 'SEA';
  const suffix = NAME_SUFFIXES[Math.abs(seed * 7 + 3) % NAME_SUFFIXES.length] ?? 'TIDE';
  return `${prefix} ${suffix}`;
}

export function displayShipName(ship: Pick<Ship, 'name' | 'tk'>): string {
  return (ship.name ?? ship.tk).toUpperCase();
}

export function displayShipFlag(ship: Pick<Ship, 'flag' | 'nat'>): string {
  return nationStyle(sailingNation(ship)).code;
}

export function displaySailingFlag(ship: Pick<Ship, 'flag' | 'nat'>): string {
  return nationStyle(sailingNation(ship)).sailingLabel;
}

export function sailingNation(ship: Pick<Ship, 'flag' | 'nat'>): string {
  return normalizeNationKey(ship.flag ?? ship.nat);
}

export function shipNationStyle(ship: Pick<Ship, 'flag' | 'nat'>) {
  return nationStyle(sailingNation(ship));
}
