import type { GameState } from '../sim/state/game-state';
import { createMorale } from '../sim/state/morale';

const SAVE_KEY = 'pirates-save-v1';
const SKIP_LOAD_ONCE_KEY = 'pirates-skip-load-once';
const NEXT_SEED_KEY = 'pirates-next-seed';

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
  gs.randState = Number(saved.randState ?? gs.randState ?? gs.seed);
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
  gs.pickups = (saved.pickups as GameState['pickups']) ?? [];
  gs.fogZones = (saved.fogZones as GameState['fogZones']) ?? [];
  gs.wind = (saved.wind as GameState['wind']) ?? gs.wind;
  gs.era = Number(saved.era ?? gs.era);
  gs.spawnTimer = Number(saved.spawnTimer ?? 0);
  gs.treasureTimer = Number(saved.treasureTimer ?? 0);
  gs.portWarTimer = Number(saved.portWarTimer ?? 0);
  gs.activeTreasureMapId = (saved.activeTreasureMapId as string | null | undefined) ?? null;
  gs.gameOver = Boolean(saved.gameOver);
  gs.archive = (saved.archive as GameState['archive']) ?? [];
  gs.nextArchiveId = Number(saved.nextArchiveId ?? 1);
  gs.plunder = (saved.plunder as GameState['plunder']) ?? [];
  gs.reputation = Number(saved.reputation ?? 0);
  gs.milestones = (saved.milestones as GameState['milestones']) ?? [];
  gs.rivals = (saved.rivals as GameState['rivals']) ?? [];
  gs.events = [];
  gs.captureQueue = (saved.captureQueue as GameState['captureQueue']) ?? [];
  const savedSettings = (saved.settings as GameState['settings']) ?? gs.settings;
  gs.settings = {
    ...gs.settings,
    ...savedSettings,
    textScale: Math.max(1, Number(savedSettings.textScale ?? gs.settings.textScale)),
    minimapMode: 'hidden',
    colorSafeHud: Boolean(savedSettings.colorSafeHud ?? gs.settings.colorSafeHud),
    seaAudio: Math.max(0, Math.min(1, Number(savedSettings.seaAudio ?? gs.settings.seaAudio))),
    musicAudio: Math.max(0, Math.min(1, Number(savedSettings.musicAudio ?? gs.settings.musicAudio))),
    preferredSeed: Number(savedSettings.preferredSeed ?? gs.settings.preferredSeed ?? gs.seed),
  };
  gs.activeQuest = (saved.activeQuest as GameState['activeQuest']) ?? null;
  gs.activeEvent = (saved.activeEvent as GameState['activeEvent']) ?? null;
  gs.morale = (saved.morale as GameState['morale']) ?? createMorale();
  if (!gs.player.fleetOrder) gs.player.fleetOrder = 'line_abreast';
  if (!gs.player.specialists) gs.player.specialists = { gunners: 0, marines: 0, surgeons: 0, navigators: 0 };
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

export function clearStorage(): void {
  localStorage.removeItem(SAVE_KEY);
}

export function prepareFreshStart(seed?: number): void {
  clearStorage();
  const session = getSessionStore();
  session?.setItem(SKIP_LOAD_ONCE_KEY, '1');
  if (typeof seed === 'number' && Number.isFinite(seed)) session?.setItem(NEXT_SEED_KEY, String(Math.max(1, Math.floor(seed))));
  else session?.removeItem(NEXT_SEED_KEY);
}

export function shouldLoadFromStorage(): boolean {
  const session = getSessionStore();
  if (!session) return true;
  const shouldSkip = session.getItem(SKIP_LOAD_ONCE_KEY) === '1';
  if (shouldSkip) session.removeItem(SKIP_LOAD_ONCE_KEY);
  return !shouldSkip;
}

function getSessionStore(): Storage | null {
  return typeof sessionStorage === 'undefined' ? null : sessionStorage;
}

export function consumeRequestedFreshSeed(fallbackSeed: number): number {
  const session = getSessionStore();
  if (!session) return fallbackSeed;
  const raw = session.getItem(NEXT_SEED_KEY);
  if (!raw) return fallbackSeed;
  session.removeItem(NEXT_SEED_KEY);
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallbackSeed;
}
