import type { GameState } from '../sim/state/game-state';

const SAVE_KEY = 'pirates-save-v1';

export interface SavedGame {
  seed: number;
  world: { tiles: number[]; variation: number[]; heightmap: number[] };
  [key: string]: unknown;
}

export function snapshotGame(gs: GameState): SavedGame {
  return {
    ...gs,
    world: {
      tiles: Array.from(gs.world.tiles),
      variation: Array.from(gs.world.variation),
      heightmap: Array.from(gs.world.heightmap),
    },
  };
}

export function applySnapshot(gs: GameState, saved: SavedGame): void {
  gs.seed = Number(saved.seed ?? gs.seed);
  const world = saved.world as SavedGame['world'];
  gs.world = {
    tiles: Uint8Array.from(world.tiles),
    variation: Uint8Array.from(world.variation),
    heightmap: Float32Array.from(world.heightmap),
  };
  Object.assign(gs.player, saved.player);
  gs.enemies = (saved.enemies as GameState['enemies']) ?? gs.enemies;
  gs.ports = (saved.ports as GameState['ports']) ?? gs.ports;
  gs.cannonballs = (saved.cannonballs as GameState['cannonballs']) ?? [];
  gs.particles = (saved.particles as GameState['particles']) ?? [];
  gs.treasures = (saved.treasures as GameState['treasures']) ?? [];
  gs.wind = (saved.wind as GameState['wind']) ?? gs.wind;
  gs.era = Number(saved.era ?? gs.era);
  gs.spawnTimer = Number(saved.spawnTimer ?? 0);
  gs.treasureTimer = Number(saved.treasureTimer ?? 0);
  gs.portWarTimer = Number(saved.portWarTimer ?? 0);
  gs.gameOver = Boolean(saved.gameOver);
  gs.archive = (saved.archive as GameState['archive']) ?? [];
  gs.nextArchiveId = Number(saved.nextArchiveId ?? 1);
  gs.plunder = (saved.plunder as GameState['plunder']) ?? [];
  gs.reputation = Number(saved.reputation ?? 0);
  gs.settings = (saved.settings as GameState['settings']) ?? gs.settings;
  gs.activeQuest = (saved.activeQuest as GameState['activeQuest']) ?? null;
  gs.activeEvent = (saved.activeEvent as GameState['activeEvent']) ?? null;
}

export function saveToStorage(gs: GameState): string {
  localStorage.setItem(SAVE_KEY, JSON.stringify(snapshotGame(gs)));
  return 'Captain log saved.';
}

export function loadFromStorage(gs: GameState): boolean {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return false;
  applySnapshot(gs, JSON.parse(raw) as SavedGame);
  return true;
}
