/** Branded type helper — prevents mixing IDs of different entity types */
import type { ShipUpgradeLevels } from './campaign-types';

export type { Cannonball, Particle, Treasure } from './visual-types';

type Brand<T, B extends string> = T & { readonly __brand: B };

export type Seed = Brand<number, 'Seed'>;
export type ShipId = Brand<number, 'ShipId'>;
export type PortId = Brand<number, 'PortId'>;
export type TileX = Brand<number, 'TileX'>;
export type TileY = Brand<number, 'TileY'>;

export const asSeed = (n: number): Seed => n as Seed;
export const asShipId = (n: number): ShipId => n as ShipId;
export const asPortId = (n: number): PortId => n as PortId;
export const asTileX = (n: number): TileX => n as TileX;
export const asTileY = (n: number): TileY => n as TileY;

export interface Vec2 { x: number; y: number }

export interface Ship {
  id: ShipId;
  name?: string;
  x: number; y: number; angle: number; speed: number;
  targetX: number | null; targetY: number | null;
  hp: number; maxHp: number; cn: number; rl: number; rng: number; acc: number;
  bspd: number; col: string; tk: string; reloadT: number;
  disabled: boolean; sunk: boolean; captured: boolean;
  wakePoints: Vec2[]; turnRate: number; nat: string; flag?: string;
  stuckT?: number; lastSafeX?: number; lastSafeY?: number; impactT?: number;
}

export type FleetOrder = 'line_abreast' | 'attack_line' | 'screen';
export interface CrewSpecialists { gunners: number; marines: number; surgeons: number; navigators: number }

export interface PlayerShip extends Ship {
  gold: number; unsharedGold: number; crew: number; fame: number; kills: number;
  day: number; dayT: number; feverT: number; hypedT: number; deafenedT: number;
  mutinyGold: number; ramBonus: number;
  fleet: FleetShip[]; cargo: CargoItem[]; upgrades: ShipUpgradeLevels;
  fleetOrder: FleetOrder; specialists: CrewSpecialists;
}

export interface FleetShip { name?: string; tk: string; role?: 'escort' | 'cargo' | 'raider' }
export interface CargoItem { good: string; qty: number; buyPrice: number }

export interface EnemyShip extends Ship {
  role: string; tier: string; ti: number; beh: BehaviorProfile;
  state: string; stTimer: number; changeT: number; loot: number; xp: number;
  shellBroken?: boolean; stunnedT?: number; isHunter?: boolean; isRival?: boolean;
  intimidated?: boolean; cargoDropDone?: boolean;
  homePort: Port | null; attackTarget: Port | null;
  personality?: { aggression: number; greed: number; caution: number; exploration: number };
}

export interface BehaviorProfile { aggro: number; flee: number; wander: boolean; portAttack: boolean }

export interface Port {
  id: PortId; x: number; y: number; name: string; nat: string; rel: string;
  garrison: number; wealth: number; cannons: number; attackTimer: number;
  defFleet: EnemyShip[]; prices: Record<string, number>;
}
