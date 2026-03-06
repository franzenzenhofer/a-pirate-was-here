import type { EnemyShip, PlayerShip } from '../../core/types';
import type { Port } from '../../core/types';

/** AI personality weights — each captain has unique tendencies */
export interface Personality {
  aggression: number;  // 0-1: how eagerly they pick fights
  greed: number;       // 0-1: how much they prioritize loot/trade routes
  caution: number;     // 0-1: how early they flee
  exploration: number; // 0-1: how far they wander from home
}

/** Generate a random personality for an AI captain */
export function generatePersonality(rng: () => number): Personality {
  return {
    aggression: rng(),
    greed: rng(),
    caution: rng(),
    exploration: rng(),
  };
}

/** Score a potential action based on personality */
export function scoreChaseAction(
  personality: Personality,
  en: EnemyShip,
  target: PlayerShip,
): number {
  const hpRatio = en.hp / en.maxHp;
  const distPenalty = Math.hypot(en.x - target.x, en.y - target.y) / 30;
  const strengthBonus = (en.cn / (target.cn + 1)) * 0.5;

  return personality.aggression * 2
    + strengthBonus
    - personality.caution * (1 - hpRatio) * 3
    - distPenalty * (1 - personality.aggression);
}

/** Score fleeing based on personality */
export function scoreFleeAction(
  personality: Personality,
  en: EnemyShip,
): number {
  const hpRatio = en.hp / en.maxHp;
  const dangerLevel = 1 - hpRatio;

  return personality.caution * dangerLevel * 3
    + (1 - personality.aggression) * dangerLevel;
}

/** Score wandering to a port for trading */
export function scoreTradeAction(
  personality: Personality,
  en: EnemyShip,
  port: Port,
): number {
  const dist = Math.hypot(en.x - port.x, en.y - port.y);
  return personality.greed * 2
    - dist / 50
    + (en.role === 'MERCHANT' ? 1.5 : 0);
}

/** Pick the best action based on personality scores */
export function bestAction(scores: Record<string, number>): string {
  let best = '';
  let bestScore = -Infinity;
  for (const [action, score] of Object.entries(scores)) {
    if (score > bestScore) { bestScore = score; best = action; }
  }
  return best;
}
