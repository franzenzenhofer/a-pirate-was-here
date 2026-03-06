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
  SLOOP:       { spd: 1.4,  hp: 8,  cn: 4,  rl: 4500,  rng: 4.5, acc: 0.55, col: '#88ffaa', loot: 150,  xp: 1,  turn: 1.2 },
  BRIGANTINE:  { spd: 1.1,  hp: 14, cn: 8,  rl: 5500,  rng: 5.5, acc: 0.60, col: '#44aaff', loot: 320,  xp: 2,  turn: 1.0 },
  FRIGATE:     { spd: 0.85, hp: 22, cn: 16, rl: 7000,  rng: 6.5, acc: 0.65, col: '#ffaa44', loot: 650,  xp: 5,  turn: 0.85 },
  GALLEON:     { spd: 0.65, hp: 36, cn: 28, rl: 9000,  rng: 7.5, acc: 0.68, col: '#ff8822', loot: 1400, xp: 9,  turn: 0.65 },
  MAN_O_WAR:   { spd: 0.45, hp: 60, cn: 44, rl: 12000, rng: 9.0, acc: 0.72, col: '#ff2222', loot: 2500, xp: 22, turn: 0.5 },
};

export const SHIP_KEYS = Object.keys(SHIP_TYPES);

/** Pick ship type for a given role and tier index */
export function shipTypeForRole(role: string, ti: number, rngVal: number): string {
  if (role === 'MERCHANT') {
    return ti < 2 ? 'SLOOP' : ti < 3 ? 'BRIGANTINE' : 'GALLEON';
  }
  return SHIP_KEYS[Math.min(~~(ti * 1.1 + rngVal * 1.5), SHIP_KEYS.length - 1)] ?? 'SLOOP';
}
