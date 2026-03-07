import type { GameState } from '../sim/state/game-state';
import { createMorale } from '../sim/state/morale';
import { createTestPlayer, createTestSettings } from './fixture-entities';

export { createTestEnemy, createTestPlayer, createTestPort, createTestSettings } from './fixture-entities';

export function createTestState(overrides: Partial<GameState> = {}): GameState {
  const base = {
    seed: 42,
    world: { tiles: new Uint8Array(), variation: new Uint8Array(), heightmap: new Float32Array() },
    randState: 42,
    player: createTestPlayer(),
    enemies: [] as GameState['enemies'],
    ports: [] as GameState['ports'],
    cannonballs: [] as GameState['cannonballs'],
    particles: [] as GameState['particles'],
    treasures: [] as GameState['treasures'],
    pickups: [] as GameState['pickups'],
    fogZones: [] as GameState['fogZones'],
    wind: { angle: 0, strength: 1, timer: 0 },
    era: 0, spawnTimer: 0, treasureTimer: 0, portWarTimer: 0,
    activeTreasureMapId: null, activePort: null, capturedEnemy: null, tradePort: null,
    captureQueue: [] as string[], paused: false, gameOver: false,
    archive: [] as GameState['archive'], nextArchiveId: 1,
    plunder: [] as GameState['plunder'], reputation: 0,
    milestones: [] as GameState['milestones'], rivals: [] as GameState['rivals'],
    events: [] as GameState['events'], settings: createTestSettings(),
    activeQuest: null, activeEvent: null,
    ...overrides,
  };
  return { ...base, morale: base.morale ?? createMorale() } as GameState;
}
