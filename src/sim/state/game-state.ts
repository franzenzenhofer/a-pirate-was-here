import type { PlayerShip, EnemyShip, Port, Cannonball, Particle, Treasure } from '../../core/types';
import type { WindState } from '../nav/wind';
import type { WorldData } from '../world/gen';

/** Central game state — all mutable game data in one place */
export interface GameState {
  world: WorldData;
  player: PlayerShip;
  enemies: EnemyShip[];
  ports: Port[];
  cannonballs: Cannonball[];
  particles: Particle[];
  treasures: Treasure[];
  wind: WindState;
  era: number;
  spawnTimer: number;
  treasureTimer: number;
  portWarTimer: number;
  activePort: Port | null;
  capturedEnemy: EnemyShip | null;
  tradePort: Port | null;
  paused: boolean;
}

/** Log entry for the event log */
export interface LogEntry {
  msg: string;
  type: string;
  time: number;
}
