import type { EnemyShip } from '../../core/types';
import { emitEvent } from './events';
import type { GameState } from './game-state';
import { spawnToothPickup } from './pickups';
import { nextRandom } from './random';
import { createEnemy } from './spawn';

export function updateSpecialEnemy(gs: GameState, enemy: EnemyShip, dt: number): boolean {
  if (enemy.tk === 'MEGALODON') {
    updateMegalodon(gs, enemy, dt);
    return true;
  }
  if (enemy.tk === 'CRAB_LEVIATHAN') {
    updateCrabLeviathan(gs, enemy, dt);
    return true;
  }
  if (enemy.role === 'GHOST') {
    enemy.state = 'CHASE';
    enemy.targetX = gs.player.x;
    enemy.targetY = gs.player.y;
    enemy.flag = 'GHOST';
    return false;
  }
  if (enemy.isHunter) {
    enemy.state = 'CHASE';
    enemy.targetX = gs.player.x;
    enemy.targetY = gs.player.y;
  }
  return false;
}

export function rewardSpecialVictory(gs: GameState, enemy: EnemyShip): void {
  if (enemy.tk === 'MEGALODON') {
    spawnToothPickup(gs, enemy.x, enemy.y);
    emitEvent(gs, { kind: 'milestone', msg: '🦈 Megalodon slain. Its tooth bobs in the wake.', tone: 'g' });
  }
  if (enemy.isRival) {
    const rival = gs.rivals.find(entry => entry.name === enemy.name);
    if (rival) rival.defeated = true;
    emitEvent(gs, { kind: 'milestone', msg: `⚔️ Rival captain ${enemy.name ?? enemy.tk} is broken.`, tone: 'g' });
  }
  if (enemy.tk === 'CRAB_LEVIATHAN') {
    emitEvent(gs, { kind: 'milestone', msg: '🦀 The false island cracks open. Booty spills into the surf.', tone: 'g' });
  }
}

export function spawnCrabLeviathan(gs: GameState, x: number, y: number): EnemyShip {
  const crab = createEnemy(x + 0.5, y + 0.5, 'MONSTER', 'LEGEND', 'MONSTER', gs.world.tiles, 'CRAB_LEVIATHAN', () => nextRandom(gs));
  crab.name = 'CRAB LEVIATHAN';
  crab.shellBroken = false;
  crab.state = 'CRAB_GUARD';
  crab.changeT = 5500;
  gs.enemies.push(crab);
  emitEvent(gs, { kind: 'milestone', msg: '🦀 The island stands up. It was a leviathan all along.', tone: 'r' });
  return crab;
}

function updateMegalodon(gs: GameState, enemy: EnemyShip, dt: number): void {
  if ((enemy.stunnedT ?? 0) > 0) {
    enemy.state = 'MEGA_STUNNED';
    enemy.targetX = enemy.x;
    enemy.targetY = enemy.y;
    return;
  }

  enemy.changeT -= dt;
  if (enemy.state === 'MEGA_CHARGE') {
    enemy.targetX = gs.player.x;
    enemy.targetY = gs.player.y;
    if (enemy.changeT <= 0) {
      enemy.state = 'MEGA_CIRCLE';
      enemy.changeT = 5000;
    }
    return;
  }

  if (enemy.changeT <= 0) {
    enemy.state = 'MEGA_CHARGE';
    enemy.changeT = 2400;
    emitEvent(gs, { kind: 'log', msg: '🦈 The Megalodon turns and charges!', tone: 'r' });
    return;
  }

  const orbitAngle = Math.atan2(gs.player.y - enemy.y, gs.player.x - enemy.x) + Math.PI * 0.5;
  enemy.state = 'MEGA_CIRCLE';
  enemy.targetX = gs.player.x + Math.cos(orbitAngle) * 5.5;
  enemy.targetY = gs.player.y + Math.sin(orbitAngle) * 5.5;
}

function updateCrabLeviathan(gs: GameState, enemy: EnemyShip, dt: number): void {
  const distance = Math.hypot(enemy.x - gs.player.x, enemy.y - gs.player.y);
  enemy.changeT -= dt;
  if ((enemy.stunnedT ?? 0) > 0) {
    enemy.state = 'CRAB_EXPOSED';
    enemy.targetX = enemy.x;
    enemy.targetY = enemy.y;
    return;
  }
  if (enemy.changeT <= 0 && distance < 8) {
    enemy.stunnedT = 2200;
    enemy.changeT = 7500;
    emitEvent(gs, { kind: 'log', msg: '🦀 The leviathan rears up, exposing its glowing belly!', tone: 'o' });
    return;
  }
  enemy.state = 'CHASE';
  enemy.targetX = gs.player.x;
  enemy.targetY = gs.player.y;
}
