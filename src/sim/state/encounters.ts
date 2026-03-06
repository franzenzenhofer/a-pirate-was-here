import { shipNameFromSeed } from '../../core/ship-identity';
import type { EnemyShip, Port } from '../../core/types';
import { isSail } from '../world/gen';
import { emitEvent } from './events';
import type { GameState } from './game-state';
import { spawnToothPickup } from './pickups';
import { nextRandom, randomChance, randomFloat, randomPick } from './random';
import { createEnemy } from './spawn';

const HUNTER_GOLD_THRESHOLD = 9000;
const HUNTER_FAME_THRESHOLD = 140;
const RIVAL_FAME_THRESHOLD = 120;
const SIREN_RADIUS = 7;

export function updateWorldEncounters(gs: GameState, dt: number): void {
  updateFogZones(gs, dt);
  maybeSpawnHunters(gs, dt);
  maybeSpawnRival(gs, dt);
  maybeSpawnMegalodon(gs, dt);
  maybeSpawnGhostFleet(gs, dt);
  maybeSpawnSirenFog(gs, dt);
  tagFalseIslands(gs);
}

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

export function isFogLocked(gs: GameState): boolean {
  return activeFog(gs) !== null && gs.player.deafenedT <= 0;
}

export function activeFog(gs: GameState) {
  return gs.fogZones.find(fog => Math.hypot(gs.player.x - fog.x, gs.player.y - fog.y) < fog.radius) ?? null;
}

export function tryBreakSirenFog(gs: GameState): boolean {
  const fog = activeFog(gs);
  if (!fog) return false;
  gs.player.deafenedT = 3000;
  emitEvent(gs, { kind: 'sound', msg: 'weather' });
  emitEvent(gs, { kind: 'log', msg: '🔊 Your broadside shatters the siren song for a few breaths.', tone: 'b' });
  return true;
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

function updateFogZones(gs: GameState, dt: number): void {
  for (let index = gs.fogZones.length - 1; index >= 0; index--) {
    const fog = gs.fogZones[index];
    if (!fog) continue;
    fog.ttl -= dt;
    fog.x += Math.cos((gs.player.day + index) * 0.8) * 0.0006 * dt;
    fog.y += Math.sin((gs.player.day + index) * 0.6) * 0.0005 * dt;
    if (fog.ttl <= 0) gs.fogZones.splice(index, 1);
  }

  const fog = activeFog(gs);
  if (!fog || gs.player.deafenedT > 0) return;
  gs.player.targetX = fog.x;
  gs.player.targetY = fog.y;
  if (randomChance(gs, Math.min(0.18, dt / 2000))) {
    gs.player.crew = Math.max(1, gs.player.crew - 3);
    emitEvent(gs, { kind: 'log', msg: '🎶 Siren fog grips the helm. 3 crew leap overboard!', tone: 'r' });
  }
}

function maybeSpawnHunters(gs: GameState, dt: number): void {
  const activeHunters = gs.enemies.filter(enemy => enemy.isHunter && !enemy.sunk && !enemy.captured).length;
  if (activeHunters >= 2) return;
  if (gs.player.gold < HUNTER_GOLD_THRESHOLD || gs.player.fame > HUNTER_FAME_THRESHOLD) return;
  if (!randomChance(gs, Math.min(0.005, dt / 180000))) return;
  const spawn = findSeaSpawnNearPlayer(gs, 12, 18);
  if (!spawn) return;
  const hunter = createEnemy(spawn.x, spawn.y, 'PIRATE', 'ELITE', 'PIRATE', gs.world.tiles, undefined, () => nextRandom(gs));
  hunter.isHunter = true;
  hunter.name = 'BLOOD TAX';
  hunter.state = 'CHASE';
  hunter.targetX = gs.player.x;
  hunter.targetY = gs.player.y;
  gs.enemies.push(hunter);
  emitEvent(gs, { kind: 'log', msg: '☠️ A hunter pack scents your gold-heavy wake.', tone: 'r' });
}

function maybeSpawnRival(gs: GameState, dt: number): void {
  const activeRival = gs.enemies.find(enemy => enemy.isRival && !enemy.sunk && !enemy.captured);
  if (activeRival || gs.player.fame < RIVAL_FAME_THRESHOLD) return;
  if (!randomChance(gs, Math.min(0.004, dt / 200000))) return;
  const spawn = findSeaSpawnNearPlayer(gs, 14, 22);
  if (!spawn) return;
  const rivalSeed = gs.seed + gs.player.day * 17 + gs.rivals.length * 31;
  const rival = createEnemy(spawn.x, spawn.y, 'PIRATE', gs.era >= 2 ? 'ELITE' : 'HARD', 'PIRATE', gs.world.tiles, undefined, () => nextRandom(gs));
  rival.name = shipNameFromSeed(rivalSeed);
  rival.isRival = true;
  rival.state = 'CHASE';
  gs.enemies.push(rival);
  gs.rivals.push({
    id: `rival-${rivalSeed}`,
    name: rival.name,
    shipType: rival.tk,
    fame: gs.player.fame + 40,
    defeated: false,
  });
  emitEvent(gs, { kind: 'log', msg: `🗡 Rival captain ${rival.name} enters the hunt.`, tone: 'o' });
}

function maybeSpawnMegalodon(gs: GameState, dt: number): void {
  if (gs.era < 2) return;
  if (gs.enemies.some(enemy => enemy.tk === 'MEGALODON' && !enemy.sunk && !enemy.captured)) return;
  if (!randomChance(gs, Math.min(0.004, dt / 180000))) return;
  const spawn = findSeaSpawnNearPlayer(gs, 10, 16);
  if (!spawn) return;
  const mega = createEnemy(spawn.x, spawn.y, 'MONSTER', 'LEGEND', 'MONSTER', gs.world.tiles, 'MEGALODON', () => nextRandom(gs));
  mega.name = 'THE MAW';
  mega.beh.aggro = 1;
  mega.state = 'MEGA_CIRCLE';
  mega.changeT = 6000;
  gs.enemies.push(mega);
  gs.activeEvent = {
    id: `mega-${gs.player.day}`,
    title: 'THE MAW',
    detail: 'Turn broadside and stun the megalodon during its charge.',
    targetShip: 'MEGALODON',
    rewardGold: 0,
    rewardFame: 140,
    active: true,
  };
  emitEvent(gs, { kind: 'milestone', msg: '🦈 A colossal fin cuts across the swells.', tone: 'o' });
}

function maybeSpawnGhostFleet(gs: GameState, dt: number): void {
  if (gs.era < 3 || gs.reputation < 20) return;
  if (gs.enemies.some(enemy => enemy.role === 'GHOST' && !enemy.sunk && !enemy.captured)) return;
  if (!randomChance(gs, Math.min(0.0035, dt / 220000))) return;
  const anchor = findSeaSpawnNearPlayer(gs, 14, 20);
  if (!anchor) return;
  for (let index = 0; index < 2; index++) {
    const ghost = createEnemy(anchor.x + index * 1.8, anchor.y + index * 0.8, 'GHOST', 'LEGEND', 'GHOST', gs.world.tiles, 'DREAD_GHOST', () => nextRandom(gs));
    ghost.name = index === 0 ? 'PALE RECKONING' : 'MOURNING TIDE';
    ghost.role = 'GHOST';
    ghost.state = 'CHASE';
    ghost.col = '#bbf8ff';
    gs.enemies.push(ghost);
  }
  emitEvent(gs, { kind: 'milestone', msg: '👻 The Ghost Fleet rises from a cold blue haze.', tone: 'o' });
}

function maybeSpawnSirenFog(gs: GameState, dt: number): void {
  if (gs.era < 2 || gs.fogZones.length > 0) return;
  if (!randomChance(gs, Math.min(0.004, dt / 160000))) return;
  const spawn = findSeaSpawnNearPlayer(gs, 6, 12);
  if (!spawn) return;
  gs.fogZones.push({
    id: `fog-${gs.player.day}-${gs.fogZones.length}`,
    x: spawn.x,
    y: spawn.y,
    radius: SIREN_RADIUS,
    ttl: 90_000,
    strength: 1,
  });
  emitEvent(gs, { kind: 'log', msg: '🌫 Pink siren fog drifts across the sea lanes.', tone: 'o' });
}

function updateMegalodon(gs: GameState, enemy: EnemyShip, dt: number): void {
  const player = gs.player;
  if ((enemy.stunnedT ?? 0) > 0) {
    enemy.state = 'MEGA_STUNNED';
    enemy.targetX = enemy.x;
    enemy.targetY = enemy.y;
    return;
  }

  enemy.changeT -= dt;
  if (enemy.state === 'MEGA_CHARGE') {
    enemy.targetX = player.x;
    enemy.targetY = player.y;
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

  const orbitAngle = Math.atan2(player.y - enemy.y, player.x - enemy.x) + Math.PI * 0.5;
  enemy.state = 'MEGA_CIRCLE';
  enemy.targetX = player.x + Math.cos(orbitAngle) * 5.5;
  enemy.targetY = player.y + Math.sin(orbitAngle) * 5.5;
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

function findSeaSpawnNearPlayer(
  gs: GameState,
  minDistance: number,
  maxDistance: number,
): { x: number; y: number } | null {
  for (let attempt = 0; attempt < 24; attempt++) {
    const angle = nextRandom(gs) * Math.PI * 2;
    const distance = randomFloat(gs, minDistance, maxDistance);
    const x = gs.player.x + Math.cos(angle) * distance;
    const y = gs.player.y + Math.sin(angle) * distance;
    if (isSail(gs.world.tiles, Math.round(x), Math.round(y))) return { x, y };
  }
  return null;
}

function tagFalseIslands(gs: GameState): void {
  if (!gs.activeTreasureMapId) return;
  const target = gs.treasures.find(treasure => treasure.mapId === gs.activeTreasureMapId && !treasure.looted);
  if (!target || typeof target.fakeIsland === 'boolean') return;
  target.fakeIsland = ((target.x * 13 + target.y * 17 + gs.seed) % 5) === 0;
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

export function nearestRumor(gs: GameState, port: Port): string {
  const rumors = [
    gs.activeTreasureMapId ? `Locals whisper that a marked beach east of ${port.name} hides fresh treasure.` : null,
    gs.rivals.find(entry => !entry.defeated) ? `A tavern keeper saw ${gs.rivals.find(entry => !entry.defeated)?.name} near the trade lanes.` : null,
    gs.player.gold > gs.player.fame * 50 ? 'Pirates are calling you a rich coward. Hunters are forming.' : null,
    gs.era >= 2 ? 'Sailors speak of pink fog that steals the helm unless cannon thunder breaks the spell.' : null,
    gs.era >= 3 ? 'A pale fleet has been seen where the moonlight meets dead-calm water.' : null,
  ].filter(Boolean) as string[];
  return randomPick(gs, rumors.length > 0 ? rumors : ['The next legend is always one sea lane away.']);
}
