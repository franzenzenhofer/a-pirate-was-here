import type { Cannonball } from '../../core/types';

/** Cannonball speed in tiles/ms */
const CBALL_SPD = 0.008;

/**
 * Fire a broadside volley — shots fire perpendicular to ship heading
 * from the side facing the target. Used by both player and AI.
 */
export function fireBroadside(
  fx: number, fy: number,
  shipAngle: number,
  targetX: number, targetY: number,
  isPlayer: boolean,
  dmg: number,
  range: number,
  cannonCount: number,
): Cannonball[] {
  const toTarget = Math.atan2(targetY - fy, targetX - fx);
  const relAngle = toTarget - shipAngle;
  const norm = (relAngle % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
  const side = norm < Math.PI ? 1 : -1;
  const broadsideAngle = shipAngle + side * Math.PI / 2;
  const shots = Math.max(1, Math.min(cannonCount, 5));
  const spread = 0.18;
  const balls: Cannonball[] = [];

  for (let i = 0; i < shots; i++) {
    const sa = broadsideAngle + (i - (shots - 1) / 2) * spread + (Math.random() - 0.5) * 0.08;
    balls.push({
      x: fx + Math.cos(broadsideAngle) * 0.6,
      y: fy + Math.sin(broadsideAngle) * 0.6,
      vx: Math.cos(sa) * CBALL_SPD,
      vy: Math.sin(sa) * CBALL_SPD,
      isPlayer,
      dmg,
      dist: 0,
      maxDist: range,
      trail: [],
      fromX: fx,
      fromY: fy,
    });
  }

  return balls;
}
