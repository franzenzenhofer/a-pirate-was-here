import { SHIP_TYPES } from '../config/ships';
import { WORLD_W, WORLD_H } from '../config/world';
import { asShipId } from '../core/types';
import { createCamera, type Camera } from '../renderer/camera';
import { createWind } from '../sim/nav/wind';
import type { GameState } from '../sim/state/game-state';
import { spawnInitialEnemies, spawnTreasures } from '../sim/state/spawn';
import { generateWorld } from '../sim/world/gen';
import { placePorts } from '../sim/world/ports';

export function createInitialGame(seed: number, screenW: number, screenH: number): {
  cam: Camera;
  gs: GameState;
} {
  const world = generateWorld(seed);
  const ports = placePorts(world.tiles, seed);
  const enemies = spawnInitialEnemies(world.tiles, 55);
  const treasures = spawnTreasures(world.tiles, 35, []);
  const player = createPlayer(world.tiles);
  const cam = createCamera(player.x, player.y, screenW, screenH);

  return {
    cam,
    gs: {
      seed,
      world, player, enemies, ports,
      cannonballs: [], particles: [], treasures, wind: createWind(),
      era: 0, spawnTimer: 0, treasureTimer: 0, portWarTimer: 0,
      activePort: null, capturedEnemy: null, tradePort: null, paused: false,
      gameOver: false, archive: [], nextArchiveId: 1, plunder: [], reputation: 0,
      settings: { audio: true, reducedMotion: false, textScale: 1, minimapMode: 'full' },
      activeQuest: null, activeEvent: null,
    },
  };
}

function createPlayer(tiles: Uint8Array) {
  const spawn = findPlayerSpawn(tiles);
  const stats = SHIP_TYPES['BRIGANTINE']!;
  return {
    id: asShipId(0), x: spawn.x + 0.5, y: spawn.y + 0.5,
    angle: 0, speed: 0, targetX: null as number | null, targetY: null as number | null,
    hp: stats.hp, maxHp: stats.hp, cn: stats.cn, rl: stats.rl, rng: stats.rng, acc: stats.acc,
    bspd: stats.spd, col: stats.col, tk: 'BRIGANTINE',
    reloadT: 0, disabled: false, sunk: false, captured: false,
    wakePoints: [] as { x: number; y: number }[], turnRate: stats.turn, nat: 'PIRATE',
    gold: 500, crew: 80, fame: 0, kills: 0, day: 1, dayT: 0,
    fleet: [] as { tk: string }[], cargo: [] as { good: string; qty: number; buyPrice: number }[],
    upgrades: { hull: 0, sails: 0, range: 0 },
  };
}

function findPlayerSpawn(tiles: Uint8Array): { x: number; y: number } {
  let spawnX = WORLD_W / 2, spawnY = WORLD_H / 2, bestDist = Infinity;
  for (let y = 2; y < WORLD_H - 2; y++) {
    for (let x = 2; x < WORLD_W - 2; x++) {
      const t = tiles[y * WORLD_W + x];
      if (t === 0 || t === 1) {
        const d = Math.hypot(x - WORLD_W / 2, y - WORLD_H / 2);
        if (d < bestDist) { bestDist = d; spawnX = x; spawnY = y; }
      }
    }
  }
  return { x: spawnX, y: spawnY };
}
