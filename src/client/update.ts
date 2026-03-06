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
import { updateWind, windModifier } from '../sim/nav/wind';
import { addLog } from '../renderer/canvas/log';
import { fleetDamageBonus } from '../sim/state/fleet';
import { collectNearbyPickups, updatePickups } from '../sim/state/pickups';
import { applyCombatBuff, registerSeaLoot, updateCrewChaos } from '../sim/state/crew-chaos';
import { nextRandom } from '../sim/state/random';
import { resolveRamming, updateImpactTimers } from '../sim/combat/ramming';
import { hasGoodBroadside, preferredBroadsidePoint, selectBestBroadsideTarget } from '../sim/combat/shot-selection';
import { updateSpecialEnemy, updateWorldEncounters } from '../sim/state/encounters';

let windWarningCooldown = 0;

export function updateGame(gs: GameState, cam: Camera, dt: number, renderFn: () => void): void {
  if (gs.paused || gs.gameOver) { renderFn(); return; }
  updateWind(gs.wind, dt, () => nextRandom(gs));
  updateCrewChaos(gs, dt);
  updateWorldEncounters(gs, dt);
  updatePlayer(gs, cam, dt);
  updateEnemies(gs, dt);
  updateCballs(gs, dt);
  updateImpactTimers(gs, dt);
  resolveRamming(gs);
  updatePickups(gs, dt);
  gs.particles = updateParticles(gs.particles, dt);
  updateProgression(gs, dt);
  renderFn();
}

function updatePlayer(gs: GameState, cam: Camera, dt: number): void {
  const player = gs.player;
  if (player.hp <= 0) return;
  windWarningCooldown = Math.max(0, windWarningCooldown - dt);
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
    const buffed = applyCombatBuff(st?.spd ?? 1.0, player.rl, player.acc, player);
    const moved = moveShip(player, player.targetX, player.targetY,
      dt * SPD_SCALE, buffed.speed, st?.turn ?? 1.0, gs.wind.angle, 1.0, gs.world.tiles);
    maybeWarnAgainstWind(gs, buffed.speed);
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
  collectNearbyPickups(gs);
}

function maybeWarnAgainstWind(gs: GameState, baseSpeed: number): void {
  if (windWarningCooldown > 0) return;
  const player = gs.player;
  const windEffect = windModifier(player.angle, gs.wind.angle, 1.0);
  if (windEffect > 0.58 || player.speed > baseSpeed * 0.72) return;
  addLog('🌬 Slow going — you are sailing into the wind.', 'o');
  windWarningCooldown = 6000;
}

function autoFirePlayer(gs: GameState): void {
  const player = gs.player;
  if (player.reloadT > 0) return;
  const near = selectBestBroadsideTarget(player, gs.enemies);
  if (near) {
    if (!hasGoodBroadside(player, near)) {
      const point = preferredBroadsidePoint(player, near);
      player.targetX = point.x;
      player.targetY = point.y;
      return;
    }
    const dmg = 2 + fleetDamageBonus(player);
    const reload = applyCombatBuff(player.bspd, player.rl, player.acc, player).reload;
    gs.cannonballs.push(...fireBroadside(
      player.x,
      player.y,
      player.angle,
      near.x,
      near.y,
      true,
      dmg,
      player.rng,
      Math.min(player.cn, 5),
      () => nextRandom(gs),
    ));
    player.reloadT = reload;
  }
}

function pickupTreasures(gs: GameState): void {
  const p = gs.player;
  for (const t of gs.treasures) {
    if (t.hidden && !t.revealed) continue;
    if (!t.looted && Math.hypot(t.x + 0.5 - p.x, t.y + 0.5 - p.y) < 1.8) {
      p.gold += t.gold; t.looted = true;
      registerSeaLoot(gs, t.gold, t.mapId ? 'BURIED TREASURE' : 'TREASURE');
      gs.particles.push(...createExplosion(t.x + 0.5, t.y + 0.5, '#ffdd00', 14));
      addLog('💰 TREASURE: +' + t.gold + 'g!', 'g');
    }
  }
}

function updateEnemies(gs: GameState, dt: number): void {
  for (const en of gs.enemies) {
    if (en.sunk || en.captured) continue;
    en.reloadT = Math.max(0, en.reloadT - dt);
    en.stunnedT = Math.max(0, (en.stunnedT ?? 0) - dt);
    if ((en.stunnedT ?? 0) > 0) continue;
    if (en.disabled) {
      en.speed = Math.max(0, en.speed * 0.96);
      en.x += Math.cos(en.angle) * en.speed * dt * SPD_SCALE;
      en.y += Math.sin(en.angle) * en.speed * dt * SPD_SCALE;
      continue;
    }
    const handledSpecial = updateSpecialEnemy(gs, en, dt);
    if (!handledSpecial) updateAIState(gs, en, dt, gs.world.tiles);
    const { navX, navY } = getAINavTarget(en, gs.player);
    const moved = moveShip(en, navX, navY, dt * SPD_SCALE, en.bspd, en.turnRate, gs.wind.angle, 0.9, gs.world.tiles);
    if (moved) { en.wakePoints.unshift({ x: en.x, y: en.y }); if (en.wakePoints.length > 16) en.wakePoints.pop(); }
    resolvePortAttack(gs, en);
    fireEnemyWeapons(gs, en);
  }
}

function resolvePortAttack(gs: GameState, en: EnemyShip): void {
  if (!hasReachedPortTarget(en) || !en.attackTarget) return;
  const result = portUnderAttack(en.attackTarget, en.cn, en.hp, en.maxHp, en.nat, nextRandom(gs));
  if (result.success) {
    gs.particles.push(...createExplosion(en.attackTarget.x, en.attackTarget.y, '#ff4400', 18));
    addLog('⚔️ ' + result.msg, 'o');
  } else {
    en.hp -= 2 + Math.floor(nextRandom(gs) * 3);
    if (en.hp <= 0) en.sunk = true;
    addLog(result.msg, 'b');
  }
  en.attackTarget = null; en.state = 'WANDER';
}

function fireEnemyWeapons(gs: GameState, en: EnemyShip): void {
  if (en.tk === 'MEGALODON' || en.tk === 'CRAB_LEVIATHAN') return;

  if (shouldFireAtPlayer(en, gs.player)) {
    if (!hasGoodBroadside(en, gs.player)) {
      const point = preferredBroadsidePoint(en, gs.player);
      en.targetX = point.x;
      en.targetY = point.y;
      return;
    }
    const volley = fireBroadside(
      en.x,
      en.y,
      en.angle,
      gs.player.x,
      gs.player.y,
      false,
      1 + en.ti * 0.4,
      en.rng,
      Math.min(en.cn, 5),
      () => nextRandom(gs),
    );
    if (en.role === 'GHOST') volley.forEach(ball => { ball.kind = 'cursed'; });
    gs.cannonballs.push(...volley);
    en.reloadT = en.rl;
  }
  if (en.reloadT <= 0) {
    for (const o of gs.enemies) {
      if (o === en || o.sunk || o.disabled) continue;
      if (Math.hypot(en.x - o.x, en.y - o.y) > 12) continue;
      if (shouldFireAtEnemy(en, o)) {
        if (!hasGoodBroadside(en, o)) continue;
        gs.cannonballs.push(...fireBroadside(en.x, en.y, en.angle, o.x, o.y, false, 0.8, en.rng, 2, () => nextRandom(gs)));
        en.reloadT = en.rl; break;
      }
    }
  }
}
