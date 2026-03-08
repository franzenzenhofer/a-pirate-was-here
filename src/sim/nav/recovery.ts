import type { Ship } from '../../core/types';
import { findNearestSailablePoint, isSailablePoint } from './collision';

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

  const escapeTarget = findNearestSailablePoint(tiles, ship.x, ship.y);
  if (escapeTarget) {
    ship.targetX = escapeTarget.x;
    ship.targetY = escapeTarget.y;
    ship.angle = Math.atan2(escapeTarget.y - ship.y, escapeTarget.x - ship.x);
    ship.speed *= 0.65;
  }

  if (ship.stuckT < 1800) return;
  if (ship.lastSafeX === undefined || ship.lastSafeY === undefined) return;
  if (!isSailablePoint(tiles, ship.lastSafeX, ship.lastSafeY)) return;

  ship.x = ship.lastSafeX;
  ship.y = ship.lastSafeY;
  ship.targetX = null;
  ship.targetY = null;
  ship.speed = 0;
  ship.stuckT = 0;
}
