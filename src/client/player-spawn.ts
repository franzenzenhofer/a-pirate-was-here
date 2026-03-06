import { WORLD_H, WORLD_W } from '../config/world';
import type { Port } from '../core/types';
import { isSail } from '../sim/world/gen';

const PORT_SPAWN_OFFSETS = [
  { dx: 0, dy: 2 },
  { dx: 1, dy: 2 },
  { dx: -1, dy: 2 },
  { dx: 0, dy: 3 },
  { dx: 2, dy: 1 },
  { dx: -2, dy: 1 },
  { dx: 2, dy: 0 },
  { dx: -2, dy: 0 },
  { dx: 0, dy: -2 },
] as const;

export interface SpawnPoint {
  x: number;
  y: number;
}

export function findPlayerSpawn(tiles: Uint8Array, ports: Port[]): SpawnPoint {
  const nearPortSpawn = findSpawnNearPort(tiles, ports);
  return nearPortSpawn ?? findCentralSeaSpawn(tiles);
}

export function findSpawnNearPort(tiles: Uint8Array, ports: Port[]): SpawnPoint | null {
  for (const port of prioritizePorts(ports)) {
    for (const offset of PORT_SPAWN_OFFSETS) {
      const x = port.x + offset.dx;
      const y = port.y + offset.dy;
      if (isSail(tiles, x, y)) return { x, y };
    }
  }

  return null;
}

export function findCentralSeaSpawn(tiles: Uint8Array): SpawnPoint {
  let bestSpawn: SpawnPoint = { x: WORLD_W / 2, y: WORLD_H / 2 };
  let bestDistance = Infinity;

  for (let y = 2; y < WORLD_H - 2; y++) {
    for (let x = 2; x < WORLD_W - 2; x++) {
      if (!isSail(tiles, x, y)) continue;
      const distance = Math.hypot(x - WORLD_W / 2, y - WORLD_H / 2);
      if (distance >= bestDistance) continue;
      bestDistance = distance;
      bestSpawn = { x, y };
    }
  }

  return bestSpawn;
}

function prioritizePorts(ports: Port[]): Port[] {
  return [...ports].sort((left, right) => scorePort(left) - scorePort(right));
}

function scorePort(port: Port): number {
  const relationBias = port.rel === 'friendly' ? 0 : port.rel === 'neutral' ? 1000 : 2000;
  const centerDistance = Math.hypot(port.x - WORLD_W / 2, port.y - WORLD_H / 2);
  return relationBias + centerDistance;
}
