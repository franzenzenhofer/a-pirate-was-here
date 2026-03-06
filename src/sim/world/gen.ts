import { Tile } from '../../config/tiles';
import { WORLD_W, WORLD_H, ISLAND_COUNT, REEF_CLUSTERS, TERRAIN_THRESHOLDS } from '../../config/world';
import { makeNoise } from '../../core/noise';
import { mkRawRng } from '../../core/rng';

export interface WorldData {
  tiles: Uint8Array;
  variation: Uint8Array;
  heightmap: Float32Array;
}

/** Generate the full procedural Caribbean world from a seed */
export function generateWorld(seed: number): WorldData {
  const W = WORLD_W;
  const H = WORLD_H;
  const n0 = makeNoise(mkRawRng(seed), W, H, 5);
  const n1 = makeNoise(mkRawRng(seed + 1), W, H, 3);
  const tiles = new Uint8Array(W * H);
  const variation = new Uint8Array(W * H);
  const heightmap = new Float32Array(W * H);

  // Generate island centers
  const rIsle = mkRawRng(seed + 200);
  const isles: Array<{ cx: number; cy: number; rx: number; ry: number; str: number }> = [];
  for (let i = 0; i < ISLAND_COUNT; i++) {
    isles.push({
      cx: 4 + rIsle() * (W - 8),
      cy: 4 + rIsle() * (H - 8),
      rx: 4 + rIsle() * 18,
      ry: 4 + rIsle() * 14,
      str: 0.55 + rIsle() * 0.5,
    });
  }

  // Build heightmap from islands + noise
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      let peak = 0;
      for (const isle of isles) {
        const dx = (x - isle.cx) / isle.rx;
        const dy = (y - isle.cy) / isle.ry;
        const d2 = dx * dx + dy * dy;
        if (d2 < 1) {
          const h = isle.str * (1 - d2) * (1 - d2);
          if (h > peak) peak = h;
        }
      }
      heightmap[i] = peak + (n0[i] ?? 0) * 0.12 - 0.04;
      variation[i] = ~~((n1[i] ?? 0) * 3);
    }
  }

  // Classify terrain from heightmap
  const T = TERRAIN_THRESHOLDS;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const v = heightmap[i] ?? 0;
      if (v < T.DEEP) tiles[i] = Tile.DEEP;
      else if (v < T.SEA) tiles[i] = Tile.SEA;
      else if (v < T.SHALLOW) tiles[i] = Tile.SHALLOW;
      else if (v < T.SAND) tiles[i] = Tile.SAND;
      else if (v < T.GRASS) tiles[i] = Tile.GRASS;
      else if (v < T.FOREST) tiles[i] = Tile.FOREST;
      else if (v < T.HILL) tiles[i] = Tile.HILL;
      else if (v < T.PEAK) tiles[i] = Tile.PEAK;
      else tiles[i] = Tile.SNOW;
    }
  }

  floodFillOcean(tiles, W, H);
  addReefs(tiles, seed, W, H);

  return { tiles, variation, heightmap };
}

/** Flood-fill from edges to mark ocean; convert inland lakes to grass */
function floodFillOcean(tiles: Uint8Array, W: number, H: number): void {
  const ocean = new Uint8Array(W * H);
  const queue: number[] = [];

  // Seed edges
  for (let x = 0; x < W; x++) {
    for (const i of [x, (H - 1) * W + x]) {
      if ((tiles[i] ?? 99) <= Tile.SHALLOW) { ocean[i] = 1; queue.push(i); }
    }
  }
  for (let y = 0; y < H; y++) {
    for (const i of [y * W, y * W + W - 1]) {
      if ((tiles[i] ?? 99) <= Tile.SHALLOW) { ocean[i] = 1; queue.push(i); }
    }
  }

  for (let qi = 0; qi < queue.length; qi++) {
    const idx = queue[qi]!;
    const x = idx % W;
    for (const nb of [idx - 1, idx + 1, idx - W, idx + W]) {
      if (nb < 0 || nb >= W * H || Math.abs(nb % W - x) > 1) continue;
      if (!ocean[nb] && ((tiles[nb] ?? 99) <= Tile.SHALLOW || (tiles[nb] ?? 99) === Tile.REEF)) {
        ocean[nb] = 1;
        queue.push(nb);
      }
    }
  }

  for (let i = 0; i < W * H; i++) {
    if (!ocean[i] && (tiles[i] ?? 99) <= Tile.SHALLOW) tiles[i] = Tile.GRASS;
  }
}

/** Scatter reef clusters in shallow/sea tiles */
function addReefs(tiles: Uint8Array, seed: number, W: number, H: number): void {
  const rR = mkRawRng(seed + 99);
  for (let i = 0; i < REEF_CLUSTERS; i++) {
    const rx = ~~(rR() * W);
    const ry = ~~(rR() * H);
    const t = tiles[ry * W + rx];
    if (t === Tile.SEA || t === Tile.SHALLOW) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = rx + dx;
          const ny = ry + dy;
          if (nx >= 0 && nx < W && ny >= 0 && ny < H && rR() < 0.5) {
            tiles[ny * W + nx] = Tile.REEF;
          }
        }
      }
    }
  }
}

/** Check if tile coordinates are sailable (DEEP, SEA, SHALLOW, REEF) */
export function isSail(tiles: Uint8Array, tx: number, ty: number): boolean {
  if (tx < 0 || tx >= WORLD_W || ty < 0 || ty >= WORLD_H) return false;
  const t = tiles[ty * WORLD_W + tx] ?? 99;
  return t <= Tile.SHALLOW || t === Tile.REEF;
}
