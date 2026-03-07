import { SHIP_TYPES } from '../config/ships';
import { asShipId } from '../core/types';
import { shipNameFromSeed } from '../core/ship-identity';
import { createCamera, type Camera } from '../renderer/camera';
import { createWind } from '../sim/nav/wind';
import type { GameState } from '../sim/state/game-state';
import { spawnInitialEnemiesWithSeed, spawnTreasuresWithSeed } from '../sim/state/spawn';
import { generateWorld } from '../sim/world/gen';
import { placePorts } from '../sim/world/ports';
import { findPlayerSpawn } from './player-spawn';
import { mkRawRng } from '../core/rng';
import { createMorale } from '../sim/state/morale';

export function createInitialGame(seed: number, screenW: number, screenH: number): {
  cam: Camera;
  gs: GameState;
} {
  const world = generateWorld(seed);
  const ports = placePorts(world.tiles, seed);
  const enemies = spawnInitialEnemiesWithSeed(world.tiles, 55, seed + 101);
  const treasures = spawnTreasuresWithSeed(world.tiles, 35, [], seed + 202);
  const player = createPlayer(seed, world.tiles, ports);
  const cam = createCamera(player.x, player.y, screenW, screenH);

  return {
    cam,
    gs: {
      seed,
      randState: seed >>> 0,
      world, player, enemies, ports,
      cannonballs: [], particles: [], treasures, pickups: [], fogZones: [], wind: createWind(seed),
      era: 0, spawnTimer: 0, treasureTimer: 0, portWarTimer: 0, activeTreasureMapId: null,
      activePort: null, capturedEnemy: null, tradePort: null, captureQueue: [], paused: false,
      gameOver: false, archive: [], nextArchiveId: 1, plunder: [], reputation: 0, milestones: [], rivals: [], events: [],
      settings: {
        audio: true,
        reducedMotion: false,
        textScale: 1,
        minimapMode: 'hidden',
        colorSafeHud: false,
        seaAudio: 0.7,
        musicAudio: 0.6,
        preferredSeed: seed,
      },
      activeQuest: null, activeEvent: null, morale: createMorale(),
    },
  };
}

function createPlayer(seed: number, tiles: Uint8Array, ports: GameState['ports']) {
  const spawn = findPlayerSpawn(tiles, ports);
  const stats = SHIP_TYPES['BRIGANTINE']!;
  const seeded = mkRawRng(seed + 303);
  const playerNameSeed = seed + Math.floor(seeded() * 10_000);
  return {
    id: asShipId(0), name: shipNameFromSeed(playerNameSeed), x: spawn.x + 0.5, y: spawn.y + 0.5,
    angle: 0, speed: 0, targetX: null as number | null, targetY: null as number | null,
    hp: stats.hp, maxHp: stats.hp, cn: stats.cn, rl: stats.rl, rng: stats.rng, acc: stats.acc,
    bspd: stats.spd, col: stats.col, tk: 'BRIGANTINE',
    reloadT: 0, disabled: false, sunk: false, captured: false,
    wakePoints: [] as { x: number; y: number }[], turnRate: stats.turn, nat: 'PIRATE', flag: 'PIRATE',
    stuckT: 0, lastSafeX: spawn.x + 0.5, lastSafeY: spawn.y + 0.5, impactT: 0,
    gold: 500, unsharedGold: 0, crew: 80, fame: 0, kills: 0, day: 1, dayT: 0, feverT: 0, hypedT: 0, deafenedT: 0, mutinyGold: 0, ramBonus: 0,
    fleet: [] as { tk: string }[], cargo: [] as { good: string; qty: number; buyPrice: number }[],
    upgrades: { hull: 0, sails: 0, range: 0 },
    fleetOrder: 'line_abreast' as const,
    specialists: { gunners: 0, marines: 0, surgeons: 0, navigators: 0 },
  };
}
