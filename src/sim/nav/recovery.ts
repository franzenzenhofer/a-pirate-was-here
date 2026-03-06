import type { Ship } from '../../core/types';
import { isSail } from '../world/gen';

export function trackShipRecovery(
  ship: Pick<Ship, 'x' | 'y' | 'angle' | 'speed' | 'targetX' | 'targetY' | 'stuckT' | 'lastSafeX' | 'lastSafeY'> & {
    x: number;
    y: number;
    angle: number;
    speed: number;
    targetX: number | null;
    targetY: number | null;
    stuckT?: number;
    lastSafeX?: number;
    lastSafeY?: number;
  },
  moved: boolean,
  dt: number,
  tiles: Uint8Array,
): void {
  if (moved) {
    ship.stuckT = 0;
    ship.lastSafeX = ship.x;
    ship.lastSafeY = ship.y;
    return;
  }

  if (ship.targetX === null || ship.targetY === null) {
    ship.stuckT = 0;
    return;
  }

  ship.stuckT = (ship.stuckT ?? 0) + dt;
  if (ship.stuckT < 900) return;

  const escapeTarget = findEscapeTarget(tiles, ship.x, ship.y);
  if (escapeTarget) {
    ship.targetX = escapeTarget.x;
    ship.targetY = escapeTarget.y;
    ship.angle = Math.atan2(escapeTarget.y - ship.y, escapeTarget.x - ship.x);
    ship.speed *= 0.65;
  }

  if (ship.stuckT < 1800) return;
  if (ship.lastSafeX === undefined || ship.lastSafeY === undefined) return;
  if (!isSail(tiles, ~~ship.lastSafeX, ~~ship.lastSafeY)) return;

  ship.x = ship.lastSafeX;
  ship.y = ship.lastSafeY;
  ship.targetX = null;
  ship.targetY = null;
  ship.speed = 0;
  ship.stuckT = 0;
}

function findEscapeTarget(tiles: Uint8Array, x: number, y: number): { x: number; y: number } | null {
  for (let radius = 1; radius <= 4; radius++) {
    for (const [dx, dy] of escapeOffsets(radius)) {
      const tx = ~~x + dx;
      const ty = ~~y + dy;
      if (isSail(tiles, tx, ty)) return { x: tx + 0.5, y: ty + 0.5 };
    }
  }
  return null;
}

function escapeOffsets(radius: number): Array<[number, number]> {
  const offsets: Array<[number, number]> = [];
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) continue;
      offsets.push([dx, dy]);
    }
  }
  return offsets;
}
