import type { PlayerShip, EnemyShip, Port, Cannonball, Particle, Treasure } from '../../core/types';
import type {
  ArchiveEntry,
  FloatingPickup,
  FogZone,
  GameMilestone,
  GameSettings,
  PlunderItem,
  QuestState,
  RivalCaptain,
  SimEvent,
  WorldEventState,
} from '../../core/campaign-types';
import type { WindState } from '../nav/wind';
import type { WorldData } from '../world/gen';

/** Central game state — all mutable game data in one place */
export interface GameState {
  seed: number;
  world: WorldData;
  randState: number;
  player: PlayerShip;
  enemies: EnemyShip[];
  ports: Port[];
  cannonballs: Cannonball[];
  particles: Particle[];
  treasures: Treasure[];
  pickups: FloatingPickup[];
  fogZones: FogZone[];
  wind: WindState;
  era: number;
  spawnTimer: number;
  treasureTimer: number;
  portWarTimer: number;
  activeTreasureMapId: string | null;
  activePort: Port | null;
  capturedEnemy: EnemyShip | null;
  tradePort: Port | null;
  captureQueue: string[];
  paused: boolean;
  gameOver: boolean;
  archive: ArchiveEntry[];
  nextArchiveId: number;
  plunder: PlunderItem[];
  reputation: number;
  milestones: GameMilestone[];
  rivals: RivalCaptain[];
  events: SimEvent[];
  settings: GameSettings;
  activeQuest: QuestState | null;
  activeEvent: WorldEventState | null;
}
