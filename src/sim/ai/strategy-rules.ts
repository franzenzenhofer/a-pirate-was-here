import type { EnemyShip, PlayerShip } from '../../core/types';

export function looksLikeRichTarget(player: Pick<PlayerShip, 'gold' | 'fame'>): boolean {
  return player.gold > Math.max(2200, player.fame * 28);
}

export function shouldMerchantPanic(
  player: Pick<PlayerShip, 'gold' | 'fame'>,
  enemy: Pick<EnemyShip, 'intimidated'>,
  distance: number,
): boolean {
  if (enemy.intimidated || distance >= 8) return false;
  const pressure = player.fame + player.gold / 18;
  return player.fame > 500 || pressure > 520;
}

export function shouldPiratePressTarget(
  role: string,
  player: Pick<PlayerShip, 'gold' | 'fame'>,
  distance: number,
): boolean {
  return role === 'PIRATE' && distance < 15 && looksLikeRichTarget(player);
}

export function desiredCombatRange(
  enemy: Pick<EnemyShip, 'rng' | 'reloadT' | 'rl' | 'hp' | 'maxHp' | 'role' | 'isHunter'>,
  player: Pick<PlayerShip, 'hp' | 'maxHp'>,
): number {
  const enemyHull = enemy.maxHp > 0 ? enemy.hp / enemy.maxHp : 1;
  const playerHull = player.maxHp > 0 ? player.hp / player.maxHp : 1;
  const recovering = enemy.reloadT > enemy.rl * 0.45;
  const advantage = enemyHull - playerHull + (enemy.isHunter ? 0.12 : 0) + (enemy.role === 'WARSHIP' ? 0.08 : 0);
  const base = recovering ? 0.92 : 0.78;
  return enemy.rng * Math.min(1.05, Math.max(0.62, base - advantage * 0.08));
}
