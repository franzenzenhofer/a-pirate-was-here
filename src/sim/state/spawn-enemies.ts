import type { EnemyShip } from '../../core/types';
import { SHIP_TYPES, shipTypeForRole } from '../../config/ships';
import { ROLES, TIERS, BEHAVIOR } from '../../config/ports';
import { WORLD_W, WORLD_H } from '../../config/world';
import { mkRawRng } from '../../core/rng';
import { asShipId } from '../../core/types';
import { shipNameFromSeed } from '../../core/ship-identity';
import { isSail } from '../world/gen';

let nextId = 1000;
const edgeRng = mkRawRng(55);

export type SpawnRngFn = () => number;

export function createEnemy(
  ex: number,
  ey: number,
  role: string,
  tier: string,
  nat: string | null,
  _tiles: Uint8Array,
  forcedType?: string,
  rngValue: SpawnRngFn = edgeRng,
): EnemyShip {
  const ti = TIERS.indexOf(tier as typeof TIERS[number]);
  const tk = forcedType ?? shipTypeForRole(role, ti >= 0 ? ti : 0, rngValue());
  const stats = SHIP_TYPES[tk];
  if (!stats) throw new Error(`Unknown ship type: ${tk}`);
  const shipId = asShipId(nextId++);
  const chosenNat = nat ?? ['SPAIN', 'ENGLAND', 'FRANCE', 'DUTCH', 'PIRATE'][~~(rngValue() * 5)] ?? 'SPAIN';

  return {
    id: shipId,
    name: shipNameFromSeed(Number(shipId) + ti * 11),
    x: ex,
    y: ey,
    angle: rngValue() * Math.PI * 2,
    speed: 0,
    targetX: null,
    targetY: null,
    hp: stats.hp,
    maxHp: stats.hp,
    cn: stats.cn,
    rl: stats.rl,
    rng: stats.rng,
    acc: stats.acc,
    bspd: stats.spd * (0.8 + rngValue() * 0.4),
    col: stats.col,
    tk,
    role,
    tier,
    ti: ti >= 0 ? ti : 0,
    beh: BEHAVIOR[role] ?? BEHAVIOR['MERCHANT']!,
    state: 'WANDER',
    stTimer: 0,
    changeT: 300 + rngValue() * 500,
    loot: ~~(stats.loot * (0.7 + rngValue() * 0.6)),
    xp: stats.xp * (1 + (ti >= 0 ? ti : 0)),
    reloadT: stats.rl * rngValue(),
    disabled: false,
    sunk: false,
    captured: false,
    wakePoints: [],
    turnRate: stats.turn,
    nat: chosenNat,
    flag: chosenNat,
    stuckT: 0,
    lastSafeX: ex,
    lastSafeY: ey,
    impactT: 0,
    homePort: null,
    attackTarget: null,
    personality: { aggression: rngValue(), greed: rngValue(), caution: rngValue(), exploration: rngValue() },
  };
}

export function spawnEdgeEnemy(tiles: Uint8Array, era: number, forceTier?: number): EnemyShip | null {
  return spawnEdgeEnemyWithRng(tiles, era, forceTier, edgeRng);
}

export function spawnEdgeEnemyWithRng(
  tiles: Uint8Array,
  era: number,
  forceTier: number | undefined,
  rngValue: SpawnRngFn,
): EnemyShip | null {
  for (let attempt = 0; attempt < 200; attempt++) {
    const spawn = randomEdgeTile(rngValue);
    if (!isSail(tiles, spawn.x, spawn.y)) continue;
    const role = ROLES[~~(rngValue() * ROLES.length)] ?? 'MERCHANT';
    const minTier = Math.max(0, era - 1);
    const tier = forceTier ?? Math.min(minTier + ~~(rngValue() * 2), 4);
    return createEnemy(spawn.x + 0.5, spawn.y + 0.5, role, TIERS[tier] ?? 'EASY', null, tiles, undefined, rngValue);
  }
  return null;
}

export function spawnSpecificEdgeEnemy(
  tiles: Uint8Array,
  role: string,
  tier: string,
  nat: string,
  shipType: string,
): EnemyShip | null {
  return spawnSpecificEdgeEnemyWithRng(tiles, role, tier, nat, shipType, edgeRng);
}

export function spawnSpecificEdgeEnemyWithRng(
  tiles: Uint8Array,
  role: string,
  tier: string,
  nat: string,
  shipType: string,
  rngValue: SpawnRngFn,
): EnemyShip | null {
  for (let attempt = 0; attempt < 200; attempt++) {
    const spawn = randomEdgeTile(rngValue);
    if (isSail(tiles, spawn.x, spawn.y)) {
      return createEnemy(spawn.x + 0.5, spawn.y + 0.5, role, tier, nat, tiles, shipType, rngValue);
    }
  }
  return null;
}

export function spawnInitialEnemiesWithSeed(tiles: Uint8Array, count: number, seed: number): EnemyShip[] {
  const rngValue = mkRawRng(seed);
  const enemies: EnemyShip[] = [];

  for (let index = 0; index < count; index++) {
    const spawn = randomSeaTile(tiles, rngValue);
    if (!spawn) continue;
    const role = ROLES[~~(rngValue() * ROLES.length)] ?? 'MERCHANT';
    const tier = ~~(rngValue() * rngValue() * 3);
    enemies.push(createEnemy(spawn.x + 0.5, spawn.y + 0.5, role, TIERS[tier] ?? 'EASY', null, tiles, undefined, rngValue));
  }

  return enemies;
}

export function spawnInitialEnemies(tiles: Uint8Array, count: number): EnemyShip[] {
  return spawnInitialEnemiesWithSeed(tiles, count, 55);
}

function randomEdgeTile(rngValue: SpawnRngFn): { x: number; y: number } {
  const side = ~~(rngValue() * 4);
  if (side === 0) return { x: ~~(rngValue() * WORLD_W), y: 2 };
  if (side === 1) return { x: ~~(rngValue() * WORLD_W), y: WORLD_H - 3 };
  if (side === 2) return { x: 2, y: ~~(rngValue() * WORLD_H) };
  return { x: WORLD_W - 3, y: ~~(rngValue() * WORLD_H) };
}

function randomSeaTile(tiles: Uint8Array, rngValue: SpawnRngFn): { x: number; y: number } | null {
  for (let attempt = 0; attempt < 300; attempt++) {
    const x = 3 + ~~(rngValue() * (WORLD_W - 6));
    const y = 3 + ~~(rngValue() * (WORLD_H - 6));
    if (isSail(tiles, x, y)) return { x, y };
  }
  return null;
}
