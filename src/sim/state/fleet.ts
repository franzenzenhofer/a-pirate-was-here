import type { FleetRoleSummary } from '../../core/campaign-types';
import type { PlayerShip } from '../../core/types';

const BASE_CARGO = 20;
const CARGO_BONUS = 8;
const ESCORT_CARGO_BONUS = 3;

export function cargoCapacity(player: PlayerShip): number {
  const summary = fleetSummary(player);
  return BASE_CARGO + summary.cargo * CARGO_BONUS + summary.escort * ESCORT_CARGO_BONUS;
}

export function fleetDamageBonus(player: PlayerShip): number {
  const summary = fleetSummary(player);
  return Math.min(summary.escort, 4) * 0.35 + summary.raider * 0.2;
}

export function fleetIncomingDamageReduction(player: PlayerShip): number {
  const summary = fleetSummary(player);
  return Math.min(0.3, summary.escort * 0.04);
}

export function fleetBoardingBonus(player: PlayerShip): number {
  const summary = fleetSummary(player);
  return summary.raider * 6 + summary.escort * 2;
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
