import type { PlayerShip, Port } from '../../core/types';

export const FLAG_COMMISSION_FAME = 90;

export interface FlagCommission {
  reward: number;
  flag: string;
}

export function getFlagCommission(player: PlayerShip, port: Port): FlagCommission | null {
  if (port.rel === 'enemy' || player.fame < FLAG_COMMISSION_FAME) return null;
  const currentFlag = player.flag ?? player.nat;
  if (currentFlag === port.nat) return null;
  const reward = 140 + Math.round(player.fame * 1.2) + (port.rel === 'friendly' ? 90 : 0);
  return { reward, flag: port.nat };
}

export function acceptFlagCommission(player: PlayerShip, port: Port): string {
  const offer = getFlagCommission(player, port);
  if (!offer) return `${port.name} has no flag contract for you.`;
  player.flag = offer.flag;
  player.gold += offer.reward;
  return `${port.name} pays ${offer.reward}g to fly ${offer.flag} colors.`;
}
