import { SHIP_TYPES } from '../config/ships';
import { DAY_DURATION, SPD_SCALE } from '../config/world';
import { crewWagesPerDay } from '../config/economy';
import type { GameState } from '../sim/state/game-state';
import type { Camera } from '../renderer/camera';
import { followTarget } from '../renderer/camera';
import { moveShip } from '../sim/nav/movement';
import { fireBroadside } from '../sim/combat/naval';
import { createExplosion } from '../sim/combat/damage';
import { windModifier } from '../sim/nav/wind';
import { addLog } from '../renderer/canvas/log';
import { fleetDamageBonus } from '../sim/state/fleet';
import { collectNearbyPickups } from '../sim/state/pickups';
import { applyCombatBuff, registerSeaLoot } from '../sim/state/crew-chaos';
import { nextRandom } from '../sim/state/random';
import { hasGoodBroadside, preferredBroadsidePoint, selectBestBroadsideTarget } from '../sim/combat/shot-selection';

let windWarningCooldown = 0;

export function updatePlayer(gs: GameState, cam: Camera, dt: number): void {
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
    else {
      player.crew = Math.max(1, player.crew - 2);
      addLog('Crew deserts — no pay!', 'r');
    }
  }

  if (player.targetX !== null && player.targetY !== null) {
    const stats = SHIP_TYPES[player.tk];
    const buffed = applyCombatBuff(stats?.spd ?? 1.0, player.rl, player.acc, player);
    const moved = moveShip(
      player,
      player.targetX,
      player.targetY,
      dt * SPD_SCALE,
      buffed.speed,
      stats?.turn ?? 1.0,
      gs.wind.angle,
      1.0,
      gs.world.tiles,
    );
    maybeWarnAgainstWind(gs, buffed.speed);
    if (Math.hypot(player.targetX - player.x, player.targetY - player.y) < 0.3) {
      player.targetX = null;
      player.targetY = null;
      player.speed = 0;
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
  const windEffect = windModifier(gs.player.angle, gs.wind.angle, 1.0);
  if (windEffect > 0.58 || gs.player.speed > baseSpeed * 0.72) return;
  addLog('🌬 Slow going — you are sailing into the wind.', 'o');
  windWarningCooldown = 6000;
}

function autoFirePlayer(gs: GameState): void {
  const player = gs.player;
  if (player.reloadT > 0) return;
  const target = selectBestBroadsideTarget(player, gs.enemies);
  if (!target) return;
  if (!hasGoodBroadside(player, target)) {
    const point = preferredBroadsidePoint(player, target);
    player.targetX = point.x;
    player.targetY = point.y;
    return;
  }
  const damage = 2 + fleetDamageBonus(player);
  const reload = applyCombatBuff(player.bspd, player.rl, player.acc, player).reload;
  gs.cannonballs.push(...fireBroadside(
    player.x,
    player.y,
    player.angle,
    target.x,
    target.y,
    true,
    damage,
    player.rng,
    Math.min(player.cn, 5),
    () => nextRandom(gs),
  ));
  player.reloadT = reload;
}

function pickupTreasures(gs: GameState): void {
  const player = gs.player;
  for (const treasure of gs.treasures) {
    if (treasure.hidden && !treasure.revealed) continue;
    if (treasure.looted || Math.hypot(treasure.x + 0.5 - player.x, treasure.y + 0.5 - player.y) >= 1.8) continue;
    player.gold += treasure.gold;
    treasure.looted = true;
    registerSeaLoot(gs, treasure.gold, treasure.mapId ? 'BURIED TREASURE' : 'TREASURE');
    gs.particles.push(...createExplosion(treasure.x + 0.5, treasure.y + 0.5, '#ffdd00', 14));
    addLog('💰 TREASURE: +' + treasure.gold + 'g!', 'g');
  }
}
