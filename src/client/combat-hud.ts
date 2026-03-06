import type { EnemyShip, PlayerShip } from '../core/types';
import type { GameState } from '../sim/state/game-state';

const ENGAGEMENT_BUFFER = 1.5;

export interface ReloadMeter {
  label: string;
  progress: number;
  remainingMs: number;
}

export interface CombatHudState {
  targetName: string;
  distance: number;
  player: ReloadMeter;
  enemy: ReloadMeter;
}

export function getCombatHudState(gs: GameState): CombatHudState | null {
  const target = selectCombatTarget(gs.player, gs.enemies);
  if (!target) return null;

  const distance = Math.hypot(gs.player.x - target.x, gs.player.y - target.y);
  return {
    targetName: target.tk,
    distance,
    player: createReloadMeter(gs.player.reloadT, gs.player.rl),
    enemy: createReloadMeter(target.reloadT, target.rl),
  };
}

export function selectCombatTarget(
  player: PlayerShip,
  enemies: EnemyShip[],
): EnemyShip | null {
  let nearest: EnemyShip | null = null;
  let nearestDistance = Infinity;

  for (const enemy of enemies) {
    if (enemy.sunk || enemy.disabled || enemy.captured) continue;

    const distance = Math.hypot(player.x - enemy.x, player.y - enemy.y);
    const engagementRange = Math.max(player.rng, enemy.rng) + ENGAGEMENT_BUFFER;
    if (distance > engagementRange || distance >= nearestDistance) continue;

    nearest = enemy;
    nearestDistance = distance;
  }

  return nearest;
}

export function createReloadMeter(reloadT: number, reloadMs: number): ReloadMeter {
  const remainingMs = Math.max(0, reloadT);
  const totalMs = Math.max(1, reloadMs);
  const progress = remainingMs <= 0 ? 1 : 1 - remainingMs / totalMs;

  return {
    label: remainingMs <= 0 ? 'READY' : `${(remainingMs / 1000).toFixed(1)}s`,
    progress: clamp(progress, 0, 1),
    remainingMs,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
