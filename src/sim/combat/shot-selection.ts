import { angleTo, clamp, dist } from '../../core/math';
import type { EnemyShip, Ship } from '../../core/types';

const MIN_BROADSIDE_SCORE = 0.58;

export function broadsideScore(attacker: Pick<Ship, 'x' | 'y' | 'angle'>, target: Pick<Ship, 'x' | 'y'>): number {
  const facing = normalizeAngle(angleTo(attacker.x, attacker.y, target.x, target.y) - attacker.angle);
  const sideDistance = Math.min(
    Math.abs(facing - Math.PI / 2),
    Math.abs(facing + Math.PI / 2),
  );
  return 1 - clamp(sideDistance / (Math.PI / 2), 0, 1);
}

export function hasGoodBroadside(
  attacker: Pick<Ship, 'x' | 'y' | 'angle' | 'rng'>,
  target: Pick<Ship, 'x' | 'y'>,
): boolean {
  return dist(attacker.x, attacker.y, target.x, target.y) <= attacker.rng
    && broadsideScore(attacker, target) >= MIN_BROADSIDE_SCORE;
}

export function selectBestBroadsideTarget(
  attacker: Pick<Ship, 'x' | 'y' | 'angle' | 'rng'>,
  enemies: EnemyShip[],
): EnemyShip | null {
  let best: EnemyShip | null = null;
  let bestScore = MIN_BROADSIDE_SCORE;

  for (const enemy of enemies) {
    if (enemy.sunk || enemy.disabled || enemy.captured) continue;
    const distance = dist(attacker.x, attacker.y, enemy.x, enemy.y);
    if (distance > attacker.rng) continue;
    const score = broadsideScore(attacker, enemy) - distance / Math.max(attacker.rng, 1) * 0.14;
    if (score <= bestScore) continue;
    best = enemy;
    bestScore = score;
  }

  return best;
}

export function preferredBroadsidePoint(
  attacker: Pick<Ship, 'x' | 'y' | 'angle' | 'rng'>,
  target: Pick<Ship, 'x' | 'y'>,
): { x: number; y: number } {
  const chaseAngle = angleTo(attacker.x, attacker.y, target.x, target.y);
  const side = normalizeAngle(chaseAngle - attacker.angle) >= 0 ? 1 : -1;
  const broadsideAngle = chaseAngle - side * Math.PI / 2;
  const orbitRange = attacker.rng * 0.72;
  return {
    x: target.x + Math.cos(broadsideAngle) * orbitRange,
    y: target.y + Math.sin(broadsideAngle) * orbitRange,
  };
}

function normalizeAngle(angle: number): number {
  let normalized = angle;
  while (normalized > Math.PI) normalized -= Math.PI * 2;
  while (normalized < -Math.PI) normalized += Math.PI * 2;
  return normalized;
}
