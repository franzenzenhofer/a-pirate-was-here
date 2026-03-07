import type { Cannonball, Particle, PlayerShip, EnemyShip } from '../../core/types';
import { mkRawRng } from '../../core/rng';
import { isSail } from '../world/gen';

const vfxRng = mkRawRng(7777);

/** Create explosion particles */
export function createExplosion(wx: number, wy: number, col: string, count: number): Particle[] {
  const parts: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const a = vfxRng() * Math.PI * 2;
    const s = 0.025 + vfxRng() * 0.06;
    parts.push({
      x: wx, y: wy,
      vx: Math.cos(a) * s, vy: Math.sin(a) * s,
      life: 1, maxLife: 1,
      col, sz: 2 + vfxRng() * 4,
    });
  }
  return parts;
}

/** Create splash particles */
export function createSplash(wx: number, wy: number): Particle[] {
  const parts: Particle[] = [];
  for (let i = 0; i < 4; i++) {
    const a = vfxRng() * Math.PI * 2;
    const s = 0.008 + vfxRng() * 0.015;
    parts.push({
      x: wx, y: wy,
      vx: Math.cos(a) * s, vy: Math.sin(a) * s,
      life: 0.5, maxLife: 0.5,
      col: '#88ccff', sz: 2,
    });
  }
  return parts;
}

export interface HitResult {
  type: 'player_hit' | 'enemy_hit' | 'enemy_disabled' | 'miss' | 'splash' | 'friendly_fire';
  target?: EnemyShip;
  dmg: number;
}

/** Update a single cannonball and check for hits */
export function updateCannonball(
  b: Cannonball,
  dt: number,
  player: PlayerShip,
  enemies: EnemyShip[],
  tiles: Uint8Array,
): HitResult {
  b.trail.push({ x: b.x, y: b.y });
  if (b.trail.length > 10) b.trail.shift();
  b.x += b.vx * dt;
  b.y += b.vy * dt;
  b.dist += Math.hypot(b.vx, b.vy) * dt;

  // Hit land
  if (!isSail(tiles, ~~b.x, ~~b.y)) {
    return { type: 'splash', dmg: 0 };
  }
  // Exceeded range
  if (b.dist > b.maxDist) {
    return { type: 'miss', dmg: 0 };
  }

  // Enemy cannonball hits player
  if (!b.isPlayer && Math.hypot(b.x - player.x, b.y - player.y) < 0.65) {
    return { type: 'player_hit', dmg: b.dmg };
  }

  // Player cannonball hits enemy
  if (b.isPlayer) {
    for (const e of enemies) {
      if (e.sunk || e.captured) continue;
      if (Math.hypot(b.x - e.x, b.y - e.y) < 0.7) {
        const disabled = e.hp - b.dmg <= 0 && !e.disabled;
        return {
          type: disabled ? 'enemy_disabled' : 'enemy_hit',
          target: e,
          dmg: b.dmg,
        };
      }
    }
  }

  // Enemy cannonball hits other enemies (friendly fire)
  if (!b.isPlayer) {
    for (const e of enemies) {
      if (e.sunk || e.disabled) continue;
      if (Math.hypot(b.x - e.x, b.y - e.y) < 0.6) {
        return { type: 'friendly_fire', target: e, dmg: b.dmg * 0.5 };
      }
    }
  }

  return { type: 'miss', dmg: 0 };
}

/** Update particles in-place, returns same array with dead particles removed */
export function updateParticles(parts: Particle[], dt: number): Particle[] {
  let write = 0;
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i]!;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.97;
    p.vy *= 0.97;
    p.life -= dt * 0.0015;
    if (p.life > 0) { parts[write++] = p; }
  }
  parts.length = write;
  return parts;
}
