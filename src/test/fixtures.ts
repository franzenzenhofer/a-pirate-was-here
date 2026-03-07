import type { GameState } from '../sim/state/game-state';
import { createTestPlayer, createTestSettings } from './fixture-entities';

export { createTestEnemy, createTestPlayer, createTestPort, createTestSettings } from './fixture-entities';

export function createTestState(overrides: Partial<GameState> = {}): GameState {
  return {
    seed: 42,
    world: {
      tiles: new Uint8Array(),
      variation: new Uint8Array(),
      heightmap: new Float32Array(),
    },
    randState: 42,
    player: createTestPlayer(),
    enemies: [],
    ports: [],
    cannonballs: [],
    particles: [],
    treasures: [],
    pickups: [],
    fogZones: [],
    wind: { angle: 0, strength: 1, timer: 0 },
    era: 0,
    spawnTimer: 0,
    treasureTimer: 0,
    portWarTimer: 0,
    activeTreasureMapId: null,
    activePort: null,
    capturedEnemy: null,
    tradePort: null,
    captureQueue: [],
    paused: false,
    gameOver: false,
    archive: [],
    nextArchiveId: 1,
    plunder: [],
    reputation: 0,
    milestones: [],
    rivals: [],
    events: [],
    settings: createTestSettings(),
    activeQuest: null,
    activeEvent: null,
    ...overrides,
  };
}
