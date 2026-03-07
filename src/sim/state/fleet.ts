import type { FleetRoleSummary } from '../../core/campaign-types';
import type { FleetOrder, PlayerShip } from '../../core/types';

const BASE_CARGO = 20;
const CARGO_BONUS = 8;
const ESCORT_CARGO_BONUS = 3;

interface OrderMultipliers {
  damage: number;
  defense: number;
  boarding: number;
  speed: number;
}

const ORDER_MUL: Record<FleetOrder, OrderMultipliers> = {
  line_abreast: { damage: 1.0, defense: 1.0, boarding: 1.0, speed: 1.0 },
  attack_line: { damage: 1.6, defense: 0.5, boarding: 1.4, speed: 0.9 },
  screen: { damage: 0.6, defense: 1.8, boarding: 0.7, speed: 1.1 },
};

export function orderMultipliers(order: FleetOrder): OrderMultipliers {
  return ORDER_MUL[order];
}

export function cargoCapacity(player: PlayerShip): number {
  const summary = fleetSummary(player);
  return BASE_CARGO + summary.cargo * CARGO_BONUS + summary.escort * ESCORT_CARGO_BONUS;
}

export function fleetDamageBonus(player: PlayerShip): number {
  const summary = fleetSummary(player);
  const raw = Math.min(summary.escort, 4) * 0.35 + summary.raider * 0.2;
  return raw * ORDER_MUL[player.fleetOrder].damage;
}

export function fleetIncomingDamageReduction(player: PlayerShip): number {
  const summary = fleetSummary(player);
  const raw = Math.min(0.3, summary.escort * 0.04);
  return raw * ORDER_MUL[player.fleetOrder].defense;
}

export function fleetBoardingBonus(player: PlayerShip): number {
  const summary = fleetSummary(player);
  const raw = summary.raider * 6 + summary.escort * 2;
  return raw * ORDER_MUL[player.fleetOrder].boarding;
}

export function fleetSpeedBonus(player: PlayerShip): number {
  if (player.fleet.length === 0) return 1.0;
  return ORDER_MUL[player.fleetOrder].speed;
}

export function fleetSummary(player: PlayerShip): FleetRoleSummary {
  const summary: FleetRoleSummary = { escort: 0, cargo: 0, raider: 0 };
  for (const ship of player.fleet) {
    const role = ship.role ?? fleetRoleForShip(ship.tk);
    summary[role]++;
  }
  return summary;
}

export function fleetRoleForShip(tk: string): 'escort' | 'cargo' | 'raider' {
  if (tk === 'CUTTER' || tk === 'SLOOP' || tk === 'GALLEON') return 'cargo';
  if (tk === 'CORVETTE' || tk === 'FRIGATE' || tk === 'MAN_O_WAR') return 'escort';
  return 'raider';
}

export function fleetOrderLabel(order: FleetOrder): string {
  if (order === 'attack_line') return 'ATTACK LINE';
  if (order === 'screen') return 'SCREEN';
  return 'LINE ABREAST';
}
