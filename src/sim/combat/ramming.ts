import { createExplosion } from './damage';
import type { EnemyShip, PlayerShip, Ship } from '../../core/types';
import type { GameState } from '../state/game-state';
import { emitEvent } from '../state/events';

const IMPACT_COOLDOWN = 900;

export function updateImpactTimers(gs: GameState, dt: number): void {
  gs.player.impactT = Math.max(0, (gs.player.impactT ?? 0) - dt);
  for (const enemy of gs.enemies) enemy.impactT = Math.max(0, (enemy.impactT ?? 0) - dt);
}

export function resolveRamming(gs: GameState): void {
  for (const enemy of gs.enemies) {
    if (enemy.sunk || enemy.captured) continue;
    applyRammingPair(gs, gs.player, enemy);
  }

  for (let index = 0; index < gs.enemies.length; index++) {
    const left = gs.enemies[index];
    if (!left || left.sunk || left.captured) continue;
    for (let next = index + 1; next < gs.enemies.length; next++) {
      const right = gs.enemies[next];
      if (!right || right.sunk || right.captured) continue;
      applyRammingPair(gs, left, right);
    }
  }
}

function applyRammingPair(gs: GameState, left: PlayerShip | EnemyShip, right: EnemyShip): void;
function applyRammingPair(gs: GameState, left: EnemyShip, right: EnemyShip): void;
function applyRammingPair(gs: GameState, left: Ship, right: Ship): void {
  if ((left.impactT ?? 0) > 0 || (right.impactT ?? 0) > 0) return;
  const distance = Math.hypot(left.x - right.x, left.y - right.y);
  if (distance > collisionRadius(left) + collisionRadius(right)) return;

  if (tryBreakCrabShell(gs, left, right) || tryBreakCrabShell(gs, right, left)) {
    gs.particles.push(...createExplosion((left.x + right.x) / 2, (left.y + right.y) / 2, '#e0b840', 14));
  }

  const leftDamage = collisionDamage(left, right);
  const rightDamage = collisionDamage(right, left);
  left.hp = Math.max(0, left.hp - leftDamage);
  right.hp = Math.max(0, right.hp - rightDamage);
  left.impactT = IMPACT_COOLDOWN;
  right.impactT = IMPACT_COOLDOWN;

  gs.particles.push(...createExplosion((left.x + right.x) / 2, (left.y + right.y) / 2, '#ffcc88', 10));

  if (left === gs.player || right === gs.player) {
    emitEvent(gs, { kind: 'log', msg: `💥 COLLISION! -${left === gs.player ? leftDamage : rightDamage} HP`, tone: 'r' });
  }

  if (left.hp <= 0) left.sunk = true;
  if (right.hp <= 0) right.sunk = true;
}

function collisionRadius(ship: Pick<Ship, 'maxHp'>): number {
  return 0.7 + ship.maxHp / 48;
}

function collisionDamage(target: Pick<Ship, 'maxHp' | 'speed'>, other: Pick<Ship, 'maxHp' | 'speed'>): number {
  const sizeFactor = Math.max(0.75, other.maxHp / Math.max(target.maxHp, 1));
  const speedFactor = Math.max(0.8, Math.abs(other.speed - target.speed) + other.speed * 0.45);
  const ramBonus = 'ramBonus' in other && typeof other.ramBonus === 'number' ? other.ramBonus : 0;
  return Math.max(1, Math.round(sizeFactor * speedFactor * (2.2 + ramBonus * 0.35)));
}

function tryBreakCrabShell(gs: GameState, attacker: Ship, defender: Ship): boolean {
  if (!('tk' in defender) || defender.tk !== 'CRAB_LEVIATHAN') return false;
  const exposed = 'stunnedT' in defender && typeof defender.stunnedT === 'number' ? defender.stunnedT : 0;
  if (!('shellBroken' in defender) || defender.shellBroken || exposed <= 0) return false;
  const attackerRamBonus = 'ramBonus' in attacker && typeof attacker.ramBonus === 'number' ? attacker.ramBonus : 0;
  if (attacker.speed < 1 && attackerRamBonus <= 0) return false;
  defender.shellBroken = true;
  defender.hp = Math.max(0, defender.hp - (12 + attackerRamBonus * 3));
  emitEvent(gs, { kind: 'milestone', msg: '💥 The leviathan shell shatters under the ram!', tone: 'g' });
  return true;
}
