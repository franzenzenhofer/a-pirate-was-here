/** Tile type enum — ordinal values used as array indices */
export const Tile = {
  DEEP: 0,
  SEA: 1,
  SHALLOW: 2,
  SAND: 3,
  GRASS: 4,
  FOREST: 5,
  HILL: 6,
  PEAK: 7,
  SNOW: 8,
  PORT: 9,
  REEF: 10,
} as const;

export type TileType = (typeof Tile)[keyof typeof Tile];

/** RGB tile colours — 3 variations per tile for visual variety */
export const TILE_COLORS: string[][] = [
  ['#1a3a6b', '#162d5a', '#0f2248'], // DEEP
  ['#2255aa', '#1f4d99', '#2266cc'], // SEA
  ['#2288bb', '#3399cc', '#44aacc'], // SHALLOW
  ['#d4a830', '#c49020', '#e0b840'], // SAND
  ['#228833', '#1a6622', '#339944'], // GRASS
  ['#115522', '#0d4418', '#1a5522'], // FOREST
  ['#887744', '#776633', '#998855'], // HILL
  ['#bbaa99', '#aaa088', '#ccbbaa'], // PEAK
  ['#eeeeff', '#ddddff', '#ffffff'], // SNOW
  ['#cc4422', '#ff6644', '#dd5533'], // PORT
  ['#1177aa', '#0d6688', '#1188aa'], // REEF
];

/** Check if a tile type is sailable (water or reef) */
export function isSailable(t: TileType): boolean {
  return t <= Tile.REEF && t !== Tile.SAND && t !== Tile.GRASS &&
    t !== Tile.FOREST && t !== Tile.HILL && t !== Tile.PEAK && t !== Tile.SNOW;
}
