import type { EnemyShip, Treasure } from '../../core/types';
import { SHIP_TYPES, shipTypeForRole } from '../../config/ships';
import { ROLES, TIERS, BEHAVIOR } from '../../config/ports';
import { WORLD_W, WORLD_H } from '../../config/world';
import { mkRawRng } from '../../core/rng';
import { asShipId } from '../../core/types';
import { shipNameFromSeed } from '../../core/ship-identity';
import { isSail } from '../world/gen';

let nextId = 1000;
const rE = mkRawRng(55);
type RngFn = () => number;

export function createEnemy(
  ex: number, ey: number,
  role: string, tier: string,
  nat: string | null,
  _tiles: Uint8Array,
  forcedType?: string,
  rngValue: RngFn = rE,
): EnemyShip {
  const ti = TIERS.indexOf(tier as typeof TIERS[number]);
  const tk = forcedType ?? shipTypeForRole(role, ti >= 0 ? ti : 0, rngValue());
  const s = SHIP_TYPES[tk];
  if (!s) throw new Error(`Unknown ship type: ${tk}`);
  const shipId = asShipId(nextId++);
  const chosenNat = nat ?? ['SPAIN', 'ENGLAND', 'FRANCE', 'DUTCH', 'PIRATE'][~~(rngValue() * 5)] ?? 'SPAIN';

  const beh = BEHAVIOR[role] ?? BEHAVIOR['MERCHANT']!;

  return {
    id: shipId,
    name: shipNameFromSeed(Number(shipId) + ti * 11),
    x: ex, y: ey,
    angle: rngValue() * Math.PI * 2,
    speed: 0,
    targetX: null, targetY: null,
    hp: s.hp, maxHp: s.hp,
    cn: s.cn, rl: s.rl, rng: s.rng, acc: s.acc,
    bspd: s.spd * (0.8 + rngValue() * 0.4),
    col: s.col, tk, role, tier,
    ti: ti >= 0 ? ti : 0,
    beh,
    state: 'WANDER', stTimer: 0,
    changeT: 300 + rngValue() * 500,
    loot: ~~(s.loot * (0.7 + rngValue() * 0.6)),
    xp: s.xp * (1 + (ti >= 0 ? ti : 0)),
    reloadT: s.rl * rngValue(),
    disabled: false, sunk: false, captured: false,
    wakePoints: [],
    turnRate: s.turn,
    nat: chosenNat,
    flag: chosenNat,
    stuckT: 0,
    lastSafeX: ex,
    lastSafeY: ey,
    impactT: 0,
    homePort: null,
    attackTarget: null,
  };
}

/** Spawn enemy at map edge */
export function spawnEdgeEnemy(tiles: Uint8Array, era: number, forceTier?: number): EnemyShip | null {
  return spawnEdgeEnemyWithRng(tiles, era, forceTier, rE);
}

export function spawnEdgeEnemyWithRng(
  tiles: Uint8Array,
  era: number,
  forceTier: number | undefined,
  rngValue: RngFn,
): EnemyShip | null {
  for (let att = 0; att < 200; att++) {
    const side = ~~(rngValue() * 4);
    let ex: number, ey: number;
    if (side === 0)      { ex = ~~(rngValue() * WORLD_W); ey = 2; }
    else if (side === 1) { ex = ~~(rngValue() * WORLD_W); ey = WORLD_H - 3; }
    else if (side === 2) { ex = 2; ey = ~~(rngValue() * WORLD_H); }
    else                 { ex = WORLD_W - 3; ey = ~~(rngValue() * WORLD_H); }

    if (isSail(tiles, ex, ey)) {
      const role = ROLES[~~(rngValue() * ROLES.length)] ?? 'MERCHANT';
      const minTier = Math.max(0, era - 1);
      const ti = forceTier ?? Math.min(minTier + ~~(rngValue() * 2), 4);
      return createEnemy(ex + 0.5, ey + 0.5, role, TIERS[ti] ?? 'EASY', null, tiles, undefined, rngValue);
    }
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
  return spawnSpecificEdgeEnemyWithRng(tiles, role, tier, nat, shipType, rE);
}

export function spawnSpecificEdgeEnemyWithRng(
  tiles: Uint8Array,
  role: string,
  tier: string,
  nat: string,
  shipType: string,
  rngValue: RngFn,
): EnemyShip | null {
  for (let att = 0; att < 200; att++) {
    const side = ~~(rngValue() * 4);
    const ex = side < 2 ? ~~(rngValue() * WORLD_W) : side === 2 ? 2 : WORLD_W - 3;
    const ey = side === 0 ? 2 : side === 1 ? WORLD_H - 3 : ~~(rngValue() * WORLD_H);
    if (isSail(tiles, ex, ey)) return createEnemy(ex + 0.5, ey + 0.5, role, tier, nat, tiles, shipType, rngValue);
  }
  return null;
}

/** Spawn initial population of enemies */
export function spawnInitialEnemies(tiles: Uint8Array, count: number): EnemyShip[] {
  return spawnInitialEnemiesWithSeed(tiles, count, 55);
}

export function spawnInitialEnemiesWithSeed(tiles: Uint8Array, count: number, seed: number): EnemyShip[] {
  const enemies: EnemyShip[] = [];
  const rInit = mkRawRng(seed);

  for (let i = 0; i < count; i++) {
    let ex: number, ey: number, t = 0;
    do {
      ex = 3 + ~~(rInit() * (WORLD_W - 6));
      ey = 3 + ~~(rInit() * (WORLD_H - 6));
      t++;
    } while (t < 300 && !isSail(tiles, ex, ey));
    if (t >= 300) continue;

    const role = ROLES[~~(rInit() * ROLES.length)] ?? 'MERCHANT';
    const ti = ~~(rInit() * rInit() * 3);
    enemies.push(createEnemy(ex + 0.5, ey + 0.5, role, TIERS[ti] ?? 'EASY', null, tiles, undefined, rInit));
  }

  return enemies;
}

/** Spawn treasure chests on beaches */
export function spawnTreasures(tiles: Uint8Array, count: number, existing: Treasure[]): Treasure[] {
  return spawnTreasuresWithSeed(tiles, count, existing, 22 + existing.length);
}

export function spawnTreasuresWithSeed(
  tiles: Uint8Array,
  count: number,
  existing: Treasure[],
  seed: number,
): Treasure[] {
  const rT = mkRawRng(seed);
  const newTreas: Treasure[] = [];

  for (let a = 0; a < 5000 && newTreas.length < count; a++) {
    const tx = ~~(rT() * WORLD_W);
    const ty = ~~(rT() * WORLD_H);
    if (!isTreasureShoreSpot(tiles, tx, ty)) continue;

    const tooClose = [...existing, ...newTreas].some(
      t => !t.looted && Math.abs(t.x - tx) < 5 && Math.abs(t.y - ty) < 5
    );
    if (tooClose) continue;

    newTreas.push({ x: tx, y: ty, gold: 200 + ~~(rT() * 1400), looted: false });
  }

  return newTreas;
}

export function isTreasureShoreSpot(tiles: Uint8Array, tx: number, ty: number): boolean {
  const tile = tiles[ty * WORLD_W + tx];
  if (tile !== 3 && tile !== 4) return false;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      if (isSail(tiles, tx + dx, ty + dy)) return true;
    }
  }
  return false;
}
