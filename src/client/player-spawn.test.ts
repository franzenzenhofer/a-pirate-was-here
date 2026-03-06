import { describe, expect, it } from 'vitest';
import { Tile } from '../config/tiles';
import { WORLD_H, WORLD_W } from '../config/world';
import type { Port } from '../core/types';
import { asPortId } from '../core/types';
import { findCentralSeaSpawn, findPlayerSpawn, findSpawnNearPort } from './player-spawn';

function createTiles(): Uint8Array {
  return new Uint8Array(WORLD_W * WORLD_H).fill(Tile.GRASS);
}

function createPort(overrides: Partial<Port> = {}): Port {
  return {
    id: asPortId(1),
    x: 40,
    y: 40,
    name: 'Port Royal',
    nat: 'PIRATE',
    rel: 'friendly',
    garrison: 0,
    wealth: 0,
    cannons: 0,
    attackTimer: 0,
    defFleet: [],
    prices: {},
    ...overrides,
  };
}

describe('player-spawn', () => {
  it('spawns near a friendly port when water is available below it', () => {
    const tiles = createTiles();
    const port = createPort();
    tiles[(port.y + 2) * WORLD_W + port.x] = Tile.SEA;

    expect(findSpawnNearPort(tiles, [port])).toEqual({ x: port.x, y: port.y + 2 });
  });

  it('falls back to the central sea tile when no port-adjacent water exists', () => {
    const tiles = createTiles();
    tiles[100 * WORLD_W + 120] = Tile.SEA;
    const port = createPort();

    expect(findPlayerSpawn(tiles, [port])).toEqual({ x: 120, y: 100 });
    expect(findCentralSeaSpawn(tiles)).toEqual({ x: 120, y: 100 });
  });

  it('prefers friendly ports over neutral ports', () => {
    const tiles = createTiles();
    const neutralPort = createPort({ id: asPortId(1), x: 20, y: 20, rel: 'neutral', nat: 'SPAIN' });
    const friendlyPort = createPort({ id: asPortId(2), x: 80, y: 50, rel: 'friendly', nat: 'PIRATE' });
    tiles[(neutralPort.y + 2) * WORLD_W + neutralPort.x] = Tile.SEA;
    tiles[(friendlyPort.y + 2) * WORLD_W + friendlyPort.x] = Tile.SEA;

    expect(findSpawnNearPort(tiles, [neutralPort, friendlyPort])).toEqual({
      x: friendlyPort.x,
      y: friendlyPort.y + 2,
    });
  });
});
