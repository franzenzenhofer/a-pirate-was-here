/** Ship class definitions — spd: tiles/sec, rl: reload ms, rng: broadside range tiles */
export interface ShipStats {
  spd: number;
  hp: number;
  cn: number;
  rl: number;
  rng: number;
  acc: number;
  col: string;
  loot: number;
  xp: number;
  turn: number;
}

export const SHIP_TYPES: Record<string, ShipStats> = {
  CUTTER:      { spd: 3.7,  hp: 6,  cn: 2,  rl: 3200,  rng: 4.0, acc: 0.58, col: '#6ee7ff', loot: 110,  xp: 1,  turn: 1.45 },
  SLOOP:       { spd: 3.2,  hp: 8,  cn: 4,  rl: 4500,  rng: 4.5, acc: 0.55, col: '#88ffaa', loot: 150,  xp: 1,  turn: 1.2 },
  BRIGANTINE:  { spd: 2.6,  hp: 14, cn: 8,  rl: 5500,  rng: 5.5, acc: 0.60, col: '#44aaff', loot: 320,  xp: 2,  turn: 1.0 },
  CORVETTE:    { spd: 2.35, hp: 18, cn: 12, rl: 6100,  rng: 6.0, acc: 0.63, col: '#d8a8ff', loot: 500,  xp: 4,  turn: 0.95 },
  FRIGATE:     { spd: 2.0,  hp: 22, cn: 16, rl: 7000,  rng: 6.5, acc: 0.65, col: '#ffaa44', loot: 650,  xp: 5,  turn: 0.85 },
  FIRESHIP:    { spd: 2.8,  hp: 12, cn: 6,  rl: 4800,  rng: 4.8, acc: 0.57, col: '#ff6655', loot: 420,  xp: 4,  turn: 1.1 },
  GALLEON:     { spd: 1.5,  hp: 36, cn: 28, rl: 9000,  rng: 7.5, acc: 0.68, col: '#ff8822', loot: 1400, xp: 9,  turn: 0.65 },
  MAN_O_WAR:   { spd: 1.0,  hp: 60, cn: 44, rl: 12000, rng: 9.0, acc: 0.72, col: '#ff2222', loot: 2500, xp: 22, turn: 0.5 },
  DREAD_GHOST: { spd: 2.1,  hp: 26, cn: 18, rl: 6500,  rng: 7.2, acc: 0.74, col: '#bbf8ff', loot: 1800, xp: 14, turn: 0.9 },
  MEGALODON:   { spd: 4.2,  hp: 38, cn: 0,  rl: 0,     rng: 0,   acc: 1.0,  col: '#9aa7b4', loot: 0,    xp: 16, turn: 1.6 },
  CRAB_LEVIATHAN: { spd: 1.8, hp: 52, cn: 0, rl: 0,    rng: 0,   acc: 1.0,  col: '#b48a52', loot: 2200, xp: 20, turn: 0.7 },
};

export const SHIP_KEYS = ['CUTTER', 'SLOOP', 'BRIGANTINE', 'FRIGATE', 'GALLEON', 'MAN_O_WAR'];

const ROLE_POOLS: Record<string, readonly string[]> = {
  MERCHANT: ['CUTTER', 'SLOOP', 'BRIGANTINE', 'GALLEON'],
  PIRATE: ['SLOOP', 'BRIGANTINE', 'FIRESHIP', 'CORVETTE'],
  WARSHIP: ['CORVETTE', 'FRIGATE', 'MAN_O_WAR', 'DREAD_GHOST'],
  ESCORT: ['CUTTER', 'BRIGANTINE', 'CORVETTE', 'FRIGATE'],
  PATROL: ['CUTTER', 'SLOOP', 'CORVETTE', 'FRIGATE'],
};

/** Pick ship type for a given role and tier index */
export function shipTypeForRole(role: string, ti: number, rngVal: number): string {
  const pool = ROLE_POOLS[role] ?? SHIP_KEYS;
  const idx = Math.min(pool.length - 1, Math.max(0, ~~(ti * 0.9 + rngVal * (pool.length - 0.2))));
  return pool[idx] ?? 'SLOOP';
}
