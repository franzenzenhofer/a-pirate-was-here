import type { CrewSpecialists, PlayerShip } from '../../core/types';

const MAX_GUNNERS = 3;
const MAX_MARINES = 3;
const MAX_SURGEONS = 2;
const MAX_NAVIGATORS = 2;
const SPECIALIST_WAGE = 0.8;
const RELOAD_REDUCTION_PER_GUNNER = 0.12;
const BOARDING_PER_MARINE = 15;
const REGEN_PER_SURGEON = 0.3;
const SPEED_PER_NAVIGATOR = 0.08;

export function specialistReloadMultiplier(s: CrewSpecialists, moraleValue: number): number {
  const effectiveness = moraleValue < 30 ? 0.5 : 1.0;
  return Math.max(0.6, 1 - Math.min(s.gunners, MAX_GUNNERS) * RELOAD_REDUCTION_PER_GUNNER * effectiveness);
}

export function specialistBoardingBonus(s: CrewSpecialists, moraleValue: number): number {
  const effectiveness = moraleValue < 30 ? 0.5 : 1.0;
  return Math.min(s.marines, MAX_MARINES) * BOARDING_PER_MARINE * effectiveness;
}

export function specialistHpRegen(s: CrewSpecialists, moraleValue: number): number {
  const effectiveness = moraleValue < 30 ? 0.5 : 1.0;
  return Math.min(s.surgeons, MAX_SURGEONS) * REGEN_PER_SURGEON * effectiveness;
}

export function specialistSpeedBonus(s: CrewSpecialists, moraleValue: number): number {
  const effectiveness = moraleValue < 30 ? 0.5 : 1.0;
  return 1 + Math.min(s.navigators, MAX_NAVIGATORS) * SPEED_PER_NAVIGATOR * effectiveness;
}

export function specialistWagesPerDay(s: CrewSpecialists): number {
  const total = s.gunners + s.marines + s.surgeons + s.navigators;
  return Math.round(total * SPECIALIST_WAGE);
}

export function totalSpecialists(s: CrewSpecialists): number {
  return s.gunners + s.marines + s.surgeons + s.navigators;
}

export function specialistCap(kind: keyof CrewSpecialists): number {
  if (kind === 'gunners') return MAX_GUNNERS;
  if (kind === 'marines') return MAX_MARINES;
  if (kind === 'surgeons') return MAX_SURGEONS;
  return MAX_NAVIGATORS;
}

export function hireSpecialist(player: PlayerShip, kind: keyof CrewSpecialists, cost: number): string {
  const cap = specialistCap(kind);
  if (player.specialists[kind] >= cap) return `Already at max ${kind} (${cap}).`;
  if (player.gold < cost) return `Need ${cost}g to hire a ${kind.slice(0, -1)}.`;
  player.gold -= cost;
  player.specialists[kind]++;
  return `Hired ${kind.slice(0, -1)}! (${player.specialists[kind]}/${cap})`;
}

export function loseSpecialistsOnMutiny(s: CrewSpecialists, fraction: number): void {
  s.gunners = Math.max(0, s.gunners - Math.round(s.gunners * fraction));
  s.marines = Math.max(0, s.marines - Math.round(s.marines * fraction));
  s.surgeons = Math.max(0, s.surgeons - Math.round(s.surgeons * fraction));
  s.navigators = Math.max(0, s.navigators - Math.round(s.navigators * fraction));
}
