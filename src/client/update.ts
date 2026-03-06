import { SHIP_TYPES } from '../config/ships';
import { SPD_SCALE, DAY_DURATION } from '../config/world';
import type { EnemyShip } from '../core/types';
import type { GameState } from '../sim/state/game-state';
import { moveShip } from '../sim/nav/movement';
import { fireBroadside } from '../sim/combat/naval';
import { createExplosion, updateParticles } from '../sim/combat/damage';
import { updateCballs } from './cballs';
import { updateAIState, getAINavTarget, shouldFireAtPlayer, shouldFireAtEnemy, hasReachedPortTarget } from '../sim/ai/strategy';
import { updateProgression, portUnderAttack } from '../sim/state/progression';
import { crewWagesPerDay } from '../config/economy';
import { followTarget } from '../renderer/camera';
import type { Camera } from '../renderer/camera';
import { updateWind } from '../sim/nav/wind';
import { addLog } from '../renderer/canvas/log';

export function updateGame(gs: GameState, cam: Camera, dt: number, renderFn: () => void): void {
  if (gs.paused || gs.gameOver) { renderFn(); return; }
  updateWind(gs.wind, dt);
  updatePlayer(gs, cam, dt);
  updateEnemies(gs, dt);
  updateCballs(gs, dt);
  gs.particles = updateParticles(gs.particles, dt);
  updateProgression(gs, dt);
  renderFn();
}

function updatePlayer(gs: GameState, cam: Camera, dt: number): void {
  const player = gs.player;
  if (player.hp <= 0) return;
  player.reloadT = Math.max(0, player.reloadT - dt);
  player.dayT += dt;
  if (player.dayT > DAY_DURATION) {
    player.dayT = 0;
    player.day++;
    const wages = crewWagesPerDay(player.crew);
    if (player.gold >= wages) player.gold -= wages;
    else { player.crew = Math.max(1, player.crew - 2); addLog('Crew deserts — no pay!', 'r'); }
  }

  if (player.targetX !== null && player.targetY !== null) {
    const st = SHIP_TYPES[player.tk];
    const moved = moveShip(player, player.targetX, player.targetY,
      dt * SPD_SCALE, st?.spd ?? 1.0, st?.turn ?? 1.0, gs.wind.angle, 1.0, gs.world.tiles);
    if (Math.hypot(player.targetX - player.x, player.targetY - player.y) < 0.3) {
      player.targetX = null; player.targetY = null; player.speed = 0;
    }
    if (moved) {
      followTarget(cam, player.x, player.y, 0.12);
      player.wakePoints.unshift({ x: player.x, y: player.y });
      if (player.wakePoints.length > 25) player.wakePoints.pop();
    }
  }

  autoFirePlayer(gs);
  pickupTreasures(gs);
}

function autoFirePlayer(gs: GameState): void {
  const player = gs.player;
  if (player.reloadT > 0) return;
  let near: EnemyShip | null = null;
  let nd = player.rng;
  for (const e of gs.enemies) {
    if (e.sunk || e.disabled || e.captured) continue;
    const d = Math.hypot(player.x - e.x, player.y - e.y);
    if (d < nd) { nd = d; near = e; }
  }
  if (near) {
    gs.cannonballs.push(...fireBroadside(player.x, player.y, player.angle, near.x, near.y, true, 2, player.rng, Math.min(player.cn, 5)));
    player.reloadT = SHIP_TYPES[player.tk]?.rl ?? 5500;
  }
}

function pickupTreasures(gs: GameState): void {
  const p = gs.player;
  for (const t of gs.treasures) {
    if (!t.looted && Math.hypot(t.x + 0.5 - p.x, t.y + 0.5 - p.y) < 1.8) {
      p.gold += t.gold; t.looted = true;
      gs.particles.push(...createExplosion(t.x + 0.5, t.y + 0.5, '#ffdd00', 14));
      addLog('💰 TREASURE: +' + t.gold + 'g!', 'g');
    }
  }
}

function updateEnemies(gs: GameState, dt: number): void {
  for (const en of gs.enemies) {
    if (en.sunk || en.captured) continue;
    en.reloadT = Math.max(0, en.reloadT - dt);
    if (en.disabled) {
      en.speed = Math.max(0, en.speed * 0.96);
      en.x += Math.cos(en.angle) * en.speed * dt * SPD_SCALE;
      en.y += Math.sin(en.angle) * en.speed * dt * SPD_SCALE;
      continue;
    }
    updateAIState(en, gs.player, dt, gs.world.tiles);
    const { navX, navY } = getAINavTarget(en, gs.player);
    const moved = moveShip(en, navX, navY, dt * SPD_SCALE, en.bspd, en.turnRate, gs.wind.angle, 0.9, gs.world.tiles);
    if (moved) { en.wakePoints.unshift({ x: en.x, y: en.y }); if (en.wakePoints.length > 16) en.wakePoints.pop(); }
    resolvePortAttack(gs, en);
    fireEnemyWeapons(gs, en);
  }
}

function resolvePortAttack(gs: GameState, en: EnemyShip): void {
  if (!hasReachedPortTarget(en) || !en.attackTarget) return;
  const result = portUnderAttack(en.attackTarget, en.cn, en.hp, en.maxHp, en.nat);
  if (result.success) {
    gs.particles.push(...createExplosion(en.attackTarget.x, en.attackTarget.y, '#ff4400', 18));
    addLog('⚔️ ' + result.msg, 'o');
  } else {
    en.hp -= 2 + ~~(Math.random() * 3);
    if (en.hp <= 0) en.sunk = true;
    addLog(result.msg, 'b');
  }
  en.attackTarget = null; en.state = 'WANDER';
}

function fireEnemyWeapons(gs: GameState, en: EnemyShip): void {
  if (shouldFireAtPlayer(en, gs.player)) {
    gs.cannonballs.push(...fireBroadside(en.x, en.y, en.angle, gs.player.x, gs.player.y, false, 1 + en.ti * 0.4, en.rng, Math.min(en.cn, 5)));
    en.reloadT = en.rl;
  }
  if (en.reloadT <= 0) {
    for (const o of gs.enemies) {
      if (o === en || o.sunk || o.disabled) continue;
      if (Math.hypot(en.x - o.x, en.y - o.y) > 12) continue;
      if (shouldFireAtEnemy(en, o)) {
        gs.cannonballs.push(...fireBroadside(en.x, en.y, en.angle, o.x, o.y, false, 0.8, en.rng, 2));
        en.reloadT = en.rl; break;
      }
    }
  }
}
