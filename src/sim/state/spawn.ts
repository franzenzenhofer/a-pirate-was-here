import type { EnemyShip, Treasure } from '../../core/types';
import { SHIP_TYPES, shipTypeForRole } from '../../config/ships';
import { ROLES, TIERS, BEHAVIOR } from '../../config/ports';
import { WORLD_W, WORLD_H } from '../../config/world';
import { mkRawRng } from '../../core/rng';
import { asShipId } from '../../core/types';
import { isSail } from '../world/gen';

let nextId = 1000;
const rE = mkRawRng(55);

export function createEnemy(
  ex: number, ey: number,
  role: string, tier: string,
  nat: string | null,
  _tiles: Uint8Array,
  forcedType?: string,
): EnemyShip {
  const ti = TIERS.indexOf(tier as typeof TIERS[number]);
  const tk = forcedType ?? shipTypeForRole(role, ti >= 0 ? ti : 0, rE());
  const s = SHIP_TYPES[tk];
  if (!s) throw new Error(`Unknown ship type: ${tk}`);

  const beh = BEHAVIOR[role] ?? BEHAVIOR['MERCHANT']!;

  return {
    id: asShipId(nextId++),
    x: ex, y: ey,
    angle: rE() * Math.PI * 2,
    speed: 0,
    targetX: null, targetY: null,
    hp: s.hp, maxHp: s.hp,
    cn: s.cn, rl: s.rl, rng: s.rng, acc: s.acc,
    bspd: s.spd * (0.8 + rE() * 0.4),
    col: s.col, tk, role, tier,
    ti: ti >= 0 ? ti : 0,
    beh,
    state: 'WANDER', stTimer: 0,
    changeT: 300 + rE() * 500,
    loot: ~~(s.loot * (0.7 + rE() * 0.6)),
    xp: s.xp * (1 + (ti >= 0 ? ti : 0)),
    reloadT: s.rl * rE(),
    disabled: false, sunk: false, captured: false,
    wakePoints: [],
    turnRate: s.turn,
    nat: nat ?? ['SPAIN', 'ENGLAND', 'FRANCE', 'DUTCH', 'PIRATE'][~~(rE() * 5)] ?? 'SPAIN',
    homePort: null,
    attackTarget: null,
  };
}

/** Spawn enemy at map edge */
export function spawnEdgeEnemy(tiles: Uint8Array, era: number, forceTier?: number): EnemyShip | null {
  for (let att = 0; att < 200; att++) {
    const side = ~~(rE() * 4);
    let ex: number, ey: number;
    if (side === 0)      { ex = ~~(rE() * WORLD_W); ey = 2; }
    else if (side === 1) { ex = ~~(rE() * WORLD_W); ey = WORLD_H - 3; }
    else if (side === 2) { ex = 2; ey = ~~(rE() * WORLD_H); }
    else                 { ex = WORLD_W - 3; ey = ~~(rE() * WORLD_H); }

    if (isSail(tiles, ex, ey)) {
      const role = ROLES[~~(rE() * ROLES.length)] ?? 'MERCHANT';
      const minTier = Math.max(0, era - 1);
      const ti = forceTier ?? Math.min(minTier + ~~(rE() * 2), 4);
      return createEnemy(ex + 0.5, ey + 0.5, role, TIERS[ti] ?? 'EASY', null, tiles);
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
  for (let att = 0; att < 200; att++) {
    const side = ~~(rE() * 4);
    const ex = side < 2 ? ~~(rE() * WORLD_W) : side === 2 ? 2 : WORLD_W - 3;
    const ey = side === 0 ? 2 : side === 1 ? WORLD_H - 3 : ~~(rE() * WORLD_H);
    if (isSail(tiles, ex, ey)) return createEnemy(ex + 0.5, ey + 0.5, role, tier, nat, tiles, shipType);
  }
  return null;
}

/** Spawn initial population of enemies */
export function spawnInitialEnemies(tiles: Uint8Array, count: number): EnemyShip[] {
  const enemies: EnemyShip[] = [];
  const rInit = mkRawRng(55);

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
    enemies.push(createEnemy(ex + 0.5, ey + 0.5, role, TIERS[ti] ?? 'EASY', null, tiles));
  }

  return enemies;
}

/** Spawn treasure chests on beaches */
export function spawnTreasures(tiles: Uint8Array, count: number, existing: Treasure[]): Treasure[] {
  const rT = mkRawRng(22 + existing.length);
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
