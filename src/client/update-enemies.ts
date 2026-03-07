import { SPD_SCALE } from '../config/world';
import type { EnemyShip } from '../core/types';
import type { GameState } from '../sim/state/game-state';
import { moveShip } from '../sim/nav/movement';
import { fireBroadside } from '../sim/combat/naval';
import { createExplosion } from '../sim/combat/damage';
import { updateAIState, getAINavTarget, hasReachedPortTarget, shouldFireAtEnemy, shouldFireAtPlayer } from '../sim/ai/strategy';
import { portUnderAttack } from '../sim/state/progression';
import { addLog } from '../renderer/canvas/log';
import { nextRandom } from '../sim/state/random';
import { hasGoodBroadside, preferredBroadsidePoint } from '../sim/combat/shot-selection';
import { updateSpecialEnemy } from '../sim/state/encounters';

export function updateEnemies(gs: GameState, dt: number): void {
  for (const enemy of gs.enemies) {
    if (enemy.sunk || enemy.captured) continue;
    enemy.reloadT = Math.max(0, enemy.reloadT - dt);
    enemy.stunnedT = Math.max(0, (enemy.stunnedT ?? 0) - dt);
    if ((enemy.stunnedT ?? 0) > 0) continue;
    if (enemy.disabled) {
      enemy.speed = Math.max(0, enemy.speed * 0.96);
      enemy.x += Math.cos(enemy.angle) * enemy.speed * dt * SPD_SCALE;
      enemy.y += Math.sin(enemy.angle) * enemy.speed * dt * SPD_SCALE;
      continue;
    }
    const handledSpecial = updateSpecialEnemy(gs, enemy, dt);
    if (!handledSpecial) updateAIState(gs, enemy, dt, gs.world.tiles);
    const { navX, navY } = getAINavTarget(enemy, gs.player);
    const moved = moveShip(enemy, navX, navY, dt * SPD_SCALE, enemy.bspd, enemy.turnRate, gs.wind.angle, 0.9, gs.world.tiles);
    if (moved) {
      enemy.wakePoints.unshift({ x: enemy.x, y: enemy.y });
      if (enemy.wakePoints.length > 16) enemy.wakePoints.pop();
    }
    resolvePortAttack(gs, enemy);
    fireEnemyWeapons(gs, enemy);
  }
}

function resolvePortAttack(gs: GameState, enemy: EnemyShip): void {
  if (!hasReachedPortTarget(enemy) || !enemy.attackTarget) return;
  const result = portUnderAttack(enemy.attackTarget, enemy.cn, enemy.hp, enemy.maxHp, enemy.nat, nextRandom(gs));
  if (result.success) {
    gs.particles.push(...createExplosion(enemy.attackTarget.x, enemy.attackTarget.y, '#ff4400', 18));
    addLog('⚔️ ' + result.msg, 'o');
  } else {
    enemy.hp -= 2 + Math.floor(nextRandom(gs) * 3);
    if (enemy.hp <= 0) enemy.sunk = true;
    addLog(result.msg, 'b');
  }
  enemy.attackTarget = null;
  enemy.state = 'WANDER';
}

function fireEnemyWeapons(gs: GameState, enemy: EnemyShip): void {
  if (enemy.tk === 'MEGALODON' || enemy.tk === 'CRAB_LEVIATHAN') return;
  if (shouldFireAtPlayer(enemy, gs.player)) {
    fireAtPlayer(gs, enemy);
    return;
  }
  if (enemy.reloadT > 0) return;
  for (const other of gs.enemies) {
    if (other === enemy || other.sunk || other.disabled) continue;
    if (Math.hypot(enemy.x - other.x, enemy.y - other.y) > 12) continue;
    if (!shouldFireAtEnemy(enemy, other) || !hasGoodBroadside(enemy, other)) continue;
    gs.cannonballs.push(...fireBroadside(enemy.x, enemy.y, enemy.angle, other.x, other.y, false, 0.8, enemy.rng, 2, () => nextRandom(gs)));
    enemy.reloadT = enemy.rl;
    break;
  }
}

function fireAtPlayer(gs: GameState, enemy: EnemyShip): void {
  if (!hasGoodBroadside(enemy, gs.player)) {
    const point = preferredBroadsidePoint(enemy, gs.player);
    enemy.targetX = point.x;
    enemy.targetY = point.y;
    return;
  }
  const volley = fireBroadside(
    enemy.x,
    enemy.y,
    enemy.angle,
    gs.player.x,
    gs.player.y,
    false,
    1 + enemy.ti * 0.4,
    enemy.rng,
    Math.min(enemy.cn, 5),
    () => nextRandom(gs),
  );
  if (enemy.role === 'GHOST') volley.forEach(ball => { ball.kind = 'cursed'; });
  gs.cannonballs.push(...volley);
  enemy.reloadT = enemy.rl;
}
