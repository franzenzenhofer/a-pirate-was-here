import { lerpAngle, angleTo } from '../../core/math';
import { windModifier } from './wind';
import { isSail } from '../world/gen';

/**
 * Shared ship movement — used by BOTH player and AI enemies.
 * Same function, same physics. AI just sets targetX/targetY differently.
 * IMPROVED: faster turn response, smoother acceleration, better obstacle avoidance.
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

  // Turn toward target — responsive, dt-scaled
  const ta = angleTo(ship.x, ship.y, targetX, targetY);
  const turnFactor = turnRate * 1.4 * dt;
  ship.angle = lerpAngle(ship.angle, ta, Math.min(turnFactor, 0.4));

  // Wind effect with minimum speed floor
  const we = windModifier(ship.angle, windAngle, windBonus);
  const topSpd = baseSpeed * we;

  // Snappy acceleration
  ship.speed += (topSpd - ship.speed) * 0.09;

  const move = Math.min(ship.speed * dt, d);

  // Obstacle avoidance — IMPROVED: look further ahead, try multiple angles
  const lookDist = Math.max(2.0, ship.speed * dt * 4);
  const lx = ship.x + Math.cos(ship.angle) * lookDist;
  const ly = ship.y + Math.sin(ship.angle) * lookDist;

  if (!isSail(tiles, ~~lx, ~~ly)) {
    // Try alternate steering angles
    for (const offset of [0.5, -0.5, 1.0, -1.0]) {
      const testAngle = ship.angle + offset;
      const tx2 = ship.x + Math.cos(testAngle) * lookDist;
      const ty2 = ship.y + Math.sin(testAngle) * lookDist;
      if (isSail(tiles, ~~tx2, ~~ty2)) {
        ship.angle += offset * 0.6;
        ship.speed *= 0.5;
        return false;
      }
    }
    if (triggerDrift(ship, lookDist, tiles)) return true;
    ship.angle += 0.4;
    ship.speed *= 0.3;
    return false;
  }

  const nx = ship.x + Math.cos(ship.angle) * move;
  const ny = ship.y + Math.sin(ship.angle) * move;

  if (isSail(tiles, ~~nx, ~~ny)) {
    ship.x = nx;
    ship.y = ny;
    return true;
  }

  if (triggerDrift(ship, lookDist, tiles)) return true;
  ship.speed *= 0.2;
  ship.angle += 0.35;
  return false;
}

function triggerDrift(
  ship: { x: number; y: number; angle: number; speed: number; hp?: number; impactT?: number },
  lookDist: number,
  tiles: Uint8Array,
): boolean {
  if (ship.speed < 0.9 || (ship.impactT ?? 0) > 0) return false;
  for (const offset of [Math.PI * 0.7, -Math.PI * 0.7]) {
    const nextAngle = ship.angle + offset;
    const tx = ship.x + Math.cos(nextAngle) * lookDist;
    const ty = ship.y + Math.sin(nextAngle) * lookDist;
    if (!isSail(tiles, ~~tx, ~~ty)) continue;
    ship.angle = nextAngle;
    ship.speed *= 0.6;
    ship.impactT = 900;
    if (typeof ship.hp === 'number') ship.hp = Math.max(0, ship.hp - 1);
    ship.x += Math.cos(ship.angle) * Math.max(0.18, ship.speed * 0.35);
    ship.y += Math.sin(ship.angle) * Math.max(0.18, ship.speed * 0.35);
    return true;
  }
  return false;
}
