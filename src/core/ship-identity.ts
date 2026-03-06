import { NATION_FLAGS } from '../config/ports';
import type { Ship } from './types';

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
  return NATION_FLAGS[ship.flag ?? ship.nat] ?? '🏴';
}

export function displaySailingFlag(ship: Pick<Ship, 'flag' | 'nat'>): string {
  const flag = ship.flag ?? ship.nat;
  return `${displayShipFlag(ship)} ${flag.toUpperCase()} COLORS`;
}
