import type { PlayerShip, EnemyShip } from '../../core/types';
import { fleetBoardingBonus } from '../state/fleet';
import { specialistBoardingBonus } from '../state/specialists';

export interface BoardingResult {
  success: boolean;
  playerCrewLost: number;
  msg: string;
  loot: number;
  fame: number;
}

/**
 * Resolve boarding action — crew count and morale matter.
 * Boarding is risky but captures more loot than sinking.
 */
export function resolveBoarding(
  player: PlayerShip,
  enemy: EnemyShip,
  randomValue: () => number = Math.random,
): BoardingResult {
  // Player strength: crew count * (hp ratio) * random factor
  const marineBonus = specialistBoardingBonus(player.specialists, 75);
  const playerStr = (player.crew + fleetBoardingBonus(player) + marineBonus) * (player.hp / player.maxHp) * (0.7 + randomValue() * 0.6);

  // Enemy strength: estimated crew (based on ship size)
  const enemyCrew = estimateCrew(enemy.tk);
  const enemyStr = enemyCrew * (enemy.hp / enemy.maxHp) * (0.5 + randomValue() * 0.5);

  const ratio = playerStr / (playerStr + enemyStr + 1);
  const success = ratio > 0.45;

  if (success) {
    const crewLost = Math.max(2, ~~(enemyCrew * 0.3 * randomValue()));
    const lootBonus = ~~(enemy.loot * 1.5); // 50% more loot from boarding
    return {
      success: true,
      playerCrewLost: crewLost,
      msg: `Boarded ${enemy.tk}! Lost ${crewLost} crew in the fight.`,
      loot: lootBonus,
      fame: enemy.xp * 3,
    };
  }

  const crewLost = Math.max(5, ~~(player.crew * 0.15 * randomValue()));
  return {
    success: false,
    playerCrewLost: crewLost,
    msg: `Boarding FAILED! Lost ${crewLost} crew!`,
    loot: 0,
    fame: 0,
  };
}

/** Estimate crew count based on ship type */
function estimateCrew(tk: string): number {
  switch (tk) {
    case 'SLOOP': return 20;
    case 'BRIGANTINE': return 50;
    case 'FRIGATE': return 100;
    case 'GALLEON': return 180;
    case 'MAN_O_WAR': return 300;
    default: return 40;
  }
}
