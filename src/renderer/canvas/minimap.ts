import { Tile } from '../../config/tiles';
import { WORLD_W, WORLD_H, TILE_PX } from '../../config/world';
import type { PlayerShip, EnemyShip, Port } from '../../core/types';
import type { Camera } from '../camera';

const MMW = 110;
const MMH = 88;

const TILE_RGB: Record<number, [number, number, number]> = {
  [Tile.DEEP]:    [26, 58, 107],
  [Tile.SEA]:     [34, 85, 170],
  [Tile.SHALLOW]: [51, 153, 204],
  [Tile.SAND]:    [212, 168, 48],
  [Tile.GRASS]:   [34, 136, 51],
  [Tile.FOREST]:  [17, 85, 34],
  [Tile.HILL]:    [136, 119, 68],
  [Tile.PEAK]:    [187, 170, 153],
  [Tile.SNOW]:    [238, 238, 255],
  [Tile.PORT]:    [204, 68, 34],
  [Tile.REEF]:    [17, 119, 136],
};

let baseImage: ImageData | null = null;

/** Build the base minimap image (call once after world gen) */
export function buildMinimapBase(
  mc: CanvasRenderingContext2D,
  tiles: Uint8Array,
): void {
  baseImage = mc.createImageData(MMW, MMH);
  for (let my = 0; my < MMH; my++) {
    for (let mx = 0; mx < MMW; mx++) {
      const wx = ~~(mx * WORLD_W / MMW);
      const wy = ~~(my * WORLD_H / MMH);
      const c = TILE_RGB[tiles[wy * WORLD_W + wx] ?? 0] ?? [0, 0, 0];
      const pi = (my * MMW + mx) * 4;
      baseImage.data[pi] = c[0];
      baseImage.data[pi + 1] = c[1];
      baseImage.data[pi + 2] = c[2];
      baseImage.data[pi + 3] = 255;
    }
  }
}

/** Draw the minimap with entities */
export function drawMinimap(
  mc: CanvasRenderingContext2D,
  ports: Port[],
  enemies: EnemyShip[],
  player: PlayerShip,
  cam: Camera,
): void {
  if (baseImage) mc.putImageData(baseImage, 0, 0);

  // Ports
  for (const p of ports) {
    const mx = ~~(p.x * MMW / WORLD_W);
    const my = ~~(p.y * MMH / WORLD_H);
    mc.fillStyle = p.rel === 'friendly' ? '#44ff88' : p.rel === 'enemy' ? '#ff4444' : '#ffcc44';
    mc.fillRect(mx - 1, my - 1, 3, 3);
  }

  // Enemies
  for (const e of enemies) {
    if (e.sunk || e.captured) continue;
    mc.fillStyle = e.role === 'PIRATE' ? '#ff44ff' : e.role === 'WARSHIP' ? '#ff8800'
      : e.role === 'MERCHANT' ? '#88ffaa' : '#44aaff';
    mc.fillRect(~~(e.x * MMW / WORLD_W), ~~(e.y * MMH / WORLD_H), 2, 2);
  }

  // Player
  mc.fillStyle = '#ffff00';
  mc.fillRect(~~(player.x * MMW / WORLD_W) - 2, ~~(player.y * MMH / WORLD_H) - 2, 5, 5);

  // Viewport
  mc.strokeStyle = 'rgba(255,255,100,0.45)';
  mc.lineWidth = 1;
  mc.strokeRect(
    ~~(cam.x * MMW / WORLD_W),
    ~~(cam.y * MMH / WORLD_H),
    ~~((cam.screenW / TILE_PX) * MMW / WORLD_W),
    ~~((cam.screenH / TILE_PX) * MMH / WORLD_H),
  );
}
