import { lerpAngle, angleTo } from '../../core/math';
import { windModifier } from './wind';
import { resolveShipStep } from './collision';

const MAX_TURN_BLEND = 0.4;
const TURN_RESPONSE = 1.4;
const ACCEL_RESPONSE = 5.5;

/**
 * Shared ship movement — used by BOTH player and AI enemies.
 * Same function, same physics. Collision resolution happens in one place.
 */
export function moveShip(
  ship: { x: number; y: number; angle: number; speed: number; hp?: number; impactT?: number },
  targetX: number,
  targetY: number,
  dt: number,
  baseSpeed: number,
  turnRate: number,
  windAngle: number,
  windBonus: number,
  tiles: Uint8Array,
): boolean {
  const dx = targetX - ship.x;
  const dy = targetY - ship.y;
  const d = Math.hypot(dx, dy);
  if (d < 0.3) { ship.speed = 0; return false; }

  const ta = angleTo(ship.x, ship.y, targetX, targetY);
  ship.angle = lerpAngle(ship.angle, ta, Math.min(turnRate * TURN_RESPONSE * dt, MAX_TURN_BLEND));

  const we = windModifier(ship.angle, windAngle, windBonus);
  const topSpd = baseSpeed * we;
  ship.speed += (topSpd - ship.speed) * Math.min(ACCEL_RESPONSE * dt, 0.24);

  const move = Math.min(ship.speed * dt, d);
  if (move <= 1e-6) return false;

  return resolveShipStep(
    ship,
    Math.cos(ship.angle) * move,
    Math.sin(ship.angle) * move,
    targetX,
    targetY,
    tiles,
  );
}
