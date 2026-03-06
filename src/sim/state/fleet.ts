import type { PlayerShip } from '../../core/types';

const BASE_CARGO = 20;
const BONUS_CARGO_PER_SHIP = 5;

export function cargoCapacity(player: PlayerShip): number {
  return BASE_CARGO + player.fleet.length * BONUS_CARGO_PER_SHIP;
}

export function fleetDamageBonus(player: PlayerShip): number {
  return Math.min(player.fleet.length, 4) * 0.35;
}
