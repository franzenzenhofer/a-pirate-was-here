import { Tile } from '../../config/tiles';
import { PORT_NAMES, NATIONS } from '../../config/ports';
import { generatePortPrices } from '../../config/economy';
import { WORLD_W, WORLD_H } from '../../config/world';
import { mkRawRng } from '../../core/rng';
import { asPortId } from '../../core/types';
import type { Port } from '../../core/types';
import { isSail } from './gen';

/** Place ports on coastline tiles adjacent to water */
export function placePorts(tiles: Uint8Array, seed: number): Port[] {
  const rP = mkRawRng(seed + 7);
  const rPrices = mkRawRng(seed + 333);
  const ports: Port[] = [];

  for (let a = 0; a < 8000 && ports.length < PORT_NAMES.length; a++) {
    const px = 5 + ~~(rP() * (WORLD_W - 10));
    const py = 5 + ~~(rP() * (WORLD_H - 10));
    const t = tiles[py * WORLD_W + px];
    if (t !== Tile.SAND && t !== Tile.GRASS) continue;

    // Must be near water
    let hasWater = false;
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        if (isSail(tiles, px + dx, py + dy)) hasWater = true;
      }
    }
    if (!hasWater) continue;

    // Must not be too close to existing ports
    if (ports.some(p => Math.abs(p.x - px) < 14 && Math.abs(p.y - py) < 14)) continue;

    const nat = NATIONS[~~(rP() * NATIONS.length)] ?? 'SPAIN';
    tiles[py * WORLD_W + px] = Tile.PORT;

    ports.push({
      id: asPortId(ports.length),
      x: px,
      y: py,
      name: PORT_NAMES[ports.length] ?? 'UNKNOWN',
      nat,
      rel: nat === 'PIRATE' ? 'neutral' : 'friendly',
      garrison: 5 + ~~(rP() * 20),
      wealth: 600 + ~~(rP() * 2000),
      cannons: 4 + ~~(rP() * 12),
      attackTimer: 0,
      defFleet: [],
      prices: generatePortPrices(ports.length, rPrices),
    });
  }

  return ports;
}
