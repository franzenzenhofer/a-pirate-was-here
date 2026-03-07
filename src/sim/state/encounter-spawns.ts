import { shipNameFromSeed } from '../../core/ship-identity';
import { emitEvent } from './events';
import type { GameState } from './game-state';
import { nextRandom, randomChance } from './random';
import { createEnemy } from './spawn';
import { findSeaSpawnNearPlayer } from './encounter-utils';

const HUNTER_GOLD_THRESHOLD = 9000;
const HUNTER_FAME_THRESHOLD = 140;
const RIVAL_FAME_THRESHOLD = 120;

export function maybeSpawnHunters(gs: GameState, dt: number): void {
  const activeHunters = gs.enemies.filter(enemy => enemy.isHunter && !enemy.sunk && !enemy.captured).length;
  if (activeHunters >= 2 || gs.player.gold < HUNTER_GOLD_THRESHOLD || gs.player.fame > HUNTER_FAME_THRESHOLD) return;
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

export function maybeSpawnRival(gs: GameState, dt: number): void {
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

export function maybeSpawnMegalodon(gs: GameState, dt: number): void {
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

export function maybeSpawnGhostFleet(gs: GameState, dt: number): void {
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
