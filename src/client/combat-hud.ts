import { displayShipName } from '../core/ship-identity';
import type { EnemyShip, PlayerShip } from '../core/types';
import type { GameState } from '../sim/state/game-state';

const ENGAGEMENT_BUFFER = 1.5;

export interface ReloadMeter {
  label: string;
  progress: number;
  remainingMs: number;
}

export interface CombatHudState {
  playerName: string;
  targetName: string;
  distance: number;
  player: ReloadMeter;
  enemy: ReloadMeter;
  playerHull: HullMeter;
  enemyHull: HullMeter;
}

export interface HullMeter {
  label: string;
  progress: number;
}

export function getCombatHudState(gs: GameState): CombatHudState | null {
  if (gs.gameOver || gs.player.hp <= 0) return null;
  const target = selectCombatTarget(gs.player, gs.enemies);
  if (!target) return null;

  const distance = Math.hypot(gs.player.x - target.x, gs.player.y - target.y);
  return {
    playerName: displayShipName(gs.player),
    targetName: displayShipName(target),
    distance,
    player: createReloadMeter(gs.player.reloadT, gs.player.rl),
    enemy: createReloadMeter(target.reloadT, target.rl),
    playerHull: createHullMeter(gs.player.hp, gs.player.maxHp),
    enemyHull: createHullMeter(target.hp, target.maxHp),
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

export function createHullMeter(hp: number, maxHp: number): HullMeter {
  const totalHp = Math.max(1, maxHp);
  const currentHp = clamp(hp, 0, totalHp);
  const visibleHp = Math.max(0, Math.round(currentHp));
  const visibleMaxHp = Math.max(1, Math.round(totalHp));

  return {
    label: `${visibleHp}/${visibleMaxHp}`,
    progress: clamp(currentHp / totalHp, 0, 1),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
