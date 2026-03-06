/** World generation parameters */
export const WORLD_W = 256;
export const WORLD_H = 200;
export const DEFAULT_SEED = 42;
export const TILE_PX = 16;

/** Speed scale — multiply by dt(ms) to get tiles moved */
export const SPD_SCALE = 1 / 1000;

/** Island generation count */
export const ISLAND_COUNT = 65;

/** Reef cluster count */
export const REEF_CLUSTERS = 100;

/** Terrain height thresholds */
export const TERRAIN_THRESHOLDS = {
  DEEP: 0.08,
  SEA: 0.18,
  SHALLOW: 0.25,
  SAND: 0.30,
  GRASS: 0.44,
  FOREST: 0.56,
  HILL: 0.68,
  PEAK: 0.76,
} as const;

/** Era definitions */
export const ERA_NAMES = [
  'AGE OF SAIL',
  'ERA OF CONFLICT',
  'CARIBBEAN WAR',
  'AGE OF CHAOS',
  'LEGENDARY SEAS',
] as const;

export const ERA_DAYS = [0, 15, 35, 60, 90] as const;
export const ERA_FAME = [0, 60, 150, 300, 520] as const;

/** Timing constants (milliseconds) */
export const DAY_DURATION = 12000;
export const SPAWN_INTERVAL = 25000;
export const TREASURE_RESPAWN = 40000;
export const PORT_WAR_CHECK = 30000;
export const WIND_CHANGE_MIN = 18000;
export const WIND_CHANGE_VAR = 12000;
