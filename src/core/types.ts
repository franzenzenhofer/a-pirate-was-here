/** Branded type helper — prevents mixing IDs of different entity types */
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

export interface Vec2 {
  x: number;
  y: number;
}

export interface Ship {
  id: ShipId;
  x: number;
  y: number;
  angle: number;
  speed: number;
  targetX: number | null;
  targetY: number | null;
  hp: number;
  maxHp: number;
  cn: number;
  rl: number;
  rng: number;
  acc: number;
  bspd: number;
  col: string;
  tk: string;
  reloadT: number;
  disabled: boolean;
  sunk: boolean;
  captured: boolean;
  wakePoints: Vec2[];
  turnRate: number;
  nat: string;
}

export interface PlayerShip extends Ship {
  gold: number;
  crew: number;
  fame: number;
  kills: number;
  day: number;
  dayT: number;
  fleet: FleetShip[];
  cargo: CargoItem[];
}

export interface FleetShip {
  tk: string;
}

export interface CargoItem {
  good: string;
  qty: number;
  buyPrice: number;
}

export interface EnemyShip extends Ship {
  role: string;
  tier: string;
  ti: number;
  beh: BehaviorProfile;
  state: string;
  stTimer: number;
  changeT: number;
  loot: number;
  xp: number;
  homePort: Port | null;
  attackTarget: Port | null;
}

export interface BehaviorProfile {
  aggro: number;
  flee: number;
  wander: boolean;
  portAttack: boolean;
}

export interface Port {
  id: PortId;
  x: number;
  y: number;
  name: string;
  nat: string;
  rel: string;
  garrison: number;
  wealth: number;
  cannons: number;
  attackTimer: number;
  defFleet: EnemyShip[];
  prices: Record<string, number>;
}

export interface Cannonball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isPlayer: boolean;
  dmg: number;
  dist: number;
  maxDist: number;
  trail: Vec2[];
  fromX: number;
  fromY: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  col: string;
  sz: number;
}

export interface Treasure {
  x: number;
  y: number;
  gold: number;
  looted: boolean;
}
