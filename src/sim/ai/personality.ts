import type { EnemyShip, PlayerShip } from '../../core/types';

/** Score a potential chase action factoring in personality */
export function scoreChaseAction(
  en: EnemyShip,
  target: PlayerShip,
): number {
  const p = en.personality;
  if (!p) return 0;
  const hpRatio = en.hp / en.maxHp;
  const distPenalty = Math.hypot(en.x - target.x, en.y - target.y) / 30;
  const strengthBonus = (en.cn / (target.cn + 1)) * 0.5;

  return p.aggression * 2
    + strengthBonus
    - p.caution * (1 - hpRatio) * 3
    - distPenalty * (1 - p.aggression);
}

/** Score fleeing factoring in personality */
export function scoreFleeAction(en: EnemyShip): number {
  const p = en.personality;
  if (!p) return 0;
  const dangerLevel = 1 - en.hp / en.maxHp;

  return p.caution * dangerLevel * 3
    + (1 - p.aggression) * dangerLevel;
}
