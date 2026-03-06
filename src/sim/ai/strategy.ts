import type { EnemyShip, PlayerShip } from '../../core/types';
import { angleTo } from '../../core/math';
import { isSail } from '../world/gen';

/**
 * AI Strategy — decides what the enemy should do each frame.
 * AI uses the SAME movement and combat as the player.
 * The only difference: AI sets targetX/targetY programmatically.
 */
export function updateAIState(
  en: EnemyShip,
  player: PlayerShip,
  dt: number,
  tiles: Uint8Array,
): void {
  if (en.sunk || en.captured || en.disabled) return;

  const dpP = Math.hypot(en.x - player.x, en.y - player.y);
  const shouldFlee = en.hp / en.maxHp < en.beh.flee;

  en.stTimer += dt;

  // State transitions
  if (shouldFlee) {
    en.state = 'FLEE';
  } else if (dpP < 12 && en.beh.aggro > 0 && Math.random() < en.beh.aggro * 0.002 * dt) {
    en.state = 'CHASE';
    en.stTimer = 0;
  } else if (en.attackTarget) {
    en.state = 'PORT_ATTACK';
  } else if (en.state === 'CHASE' && en.stTimer > 8000) {
    en.state = 'WANDER';
  }

  // Wander: pick new random sea target periodically
  if (en.state === 'WANDER') {
    en.changeT -= dt;
    if (en.changeT < 0) {
      en.changeT = 3000 + Math.random() * 4000;
      for (let a = 0; a < 20; a++) {
        const wx = en.x + (Math.random() - 0.5) * 30;
        const wy = en.y + (Math.random() - 0.5) * 30;
        if (isSail(tiles, ~~wx, ~~wy)) {
          en.targetX = wx;
          en.targetY = wy;
          break;
        }
      }
    }
  }
}

/** Get the navigation target based on AI state */
export function getAINavTarget(
  en: EnemyShip,
  player: PlayerShip,
): { navX: number; navY: number } {
  let navX = en.targetX ?? en.x + Math.cos(en.angle) * 5;
  let navY = en.targetY ?? en.y + Math.sin(en.angle) * 5;

  if (en.state === 'FLEE') {
    navX = en.x + (en.x - player.x) * 3;
    navY = en.y + (en.y - player.y) * 3;
  } else if (en.state === 'CHASE') {
    const dpP = Math.hypot(en.x - player.x, en.y - player.y);
    if (dpP > en.rng * 0.7) {
      navX = player.x;
      navY = player.y;
    } else {
      // Circle strafe — position broadside to target
      const perpAngle = angleTo(en.x, en.y, player.x, player.y) + Math.PI * 0.5;
      navX = player.x + Math.cos(perpAngle) * en.rng * 0.6;
      navY = player.y + Math.sin(perpAngle) * en.rng * 0.6;
    }
  } else if (en.state === 'PORT_ATTACK' && en.attackTarget) {
    navX = en.attackTarget.x;
    navY = en.attackTarget.y;
  }

  return { navX, navY };
}

/** Check if enemy should fire at player */
export function shouldFireAtPlayer(en: EnemyShip, player: PlayerShip): boolean {
  if (en.state !== 'CHASE' || en.reloadT > 0) return false;
  const dpP = Math.hypot(en.x - player.x, en.y - player.y);
  return dpP < en.rng;
}

/** Check if enemy should fire at another enemy */
export function shouldFireAtEnemy(en: EnemyShip, other: EnemyShip): boolean {
  if (en.reloadT > 0 || other.sunk || other.disabled) return false;

  const hostile =
    (en.role === 'PIRATE' && other.role === 'MERCHANT') ||
    (en.role === 'WARSHIP' && other.role === 'PIRATE') ||
    (en.role === 'PIRATE' && other.role === 'WARSHIP' && Math.random() < 0.3);

  if (!hostile) return false;

  const d2 = Math.hypot(en.x - other.x, en.y - other.y);
  return d2 < en.rng * 0.8;
}

/** Check if enemy has reached port attack target */
export function hasReachedPortTarget(en: EnemyShip): boolean {
  if (!en.attackTarget) return false;
  return Math.hypot(en.x - en.attackTarget.x, en.y - en.attackTarget.y) < 4;
}
