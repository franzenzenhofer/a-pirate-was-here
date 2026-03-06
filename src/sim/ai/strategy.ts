import type { GameState } from '../state/game-state';
import type { EnemyShip, PlayerShip } from '../../core/types';
import { angleTo } from '../../core/math';
import { isSail } from '../world/gen';
import { emitEvent } from '../state/events';
import { randomChance, randomFloat } from '../state/random';
import { spawnCargoPickup } from '../state/pickups';

/** Vision range — AI only reacts to what it can "see" (fog of war) */
const VISION_RANGE = 18;

/** Optional AI transition logger — set by debug module */
export let onAITransition: ((en: EnemyShip, from: string, to: string, reason: string) => void) | null = null;

export function setAITransitionLogger(fn: typeof onAITransition): void {
  onAITransition = fn;
}

function transition(en: EnemyShip, to: string, reason: string): void {
  const from = en.state;
  if (from === to) return;
  en.state = to;
  if (onAITransition) onAITransition(en, from, to, reason);
}

/**
 * AI Strategy — decides what the enemy should do each frame.
 * AI uses the SAME movement and combat as the player.
 * FOG OF WAR: AI only acts on player within VISION_RANGE — no cheating.
 */
export function updateAIState(
  gs: GameState,
  en: EnemyShip,
  dt: number,
  tiles: Uint8Array,
): void {
  const player = gs.player;
  if (en.sunk || en.captured || en.disabled) return;

  const dpP = Math.hypot(en.x - player.x, en.y - player.y);
  const canSeePlayer = dpP < VISION_RANGE;
  const shouldFlee = en.hp / en.maxHp < en.beh.flee;

  en.stTimer += dt;

  // State transitions — only chase if AI can SEE the player
  if (shouldFlee && canSeePlayer) {
    transition(en, 'FLEE', 'hp=' + ~~(en.hp / en.maxHp * 100) + '% < flee=' + ~~(en.beh.flee * 100) + '%');
  } else if (shouldFlee && en.state === 'FLEE' && !canSeePlayer) {
    transition(en, 'WANDER', 'lost sight while fleeing');
  } else if (canSeePlayer && dpP < 12 && en.beh.aggro > 0 && randomChance(gs, en.beh.aggro * 0.002 * dt)) {
    transition(en, 'CHASE', 'spotted player d=' + ~~dpP + ' aggro=' + ~~(en.beh.aggro * 100) + '%');
    en.stTimer = 0;
  } else if (en.attackTarget) {
    transition(en, 'PORT_ATTACK', 'target=' + en.attackTarget.name);
  } else if (en.state === 'CHASE' && (en.stTimer > 8000 || !canSeePlayer)) {
    transition(en, 'WANDER', en.stTimer > 8000 ? 'chase timeout' : 'lost sight');
  }

  // Wander: pick new random sea target periodically
  if (en.state === 'WANDER') {
    en.changeT -= dt;
    if (en.changeT < 0) {
      en.changeT = 3000 + randomFloat(gs, 0, 4000);
      for (let a = 0; a < 20; a++) {
        const wx = en.x + (randomFloat(gs, 0, 1) - 0.5) * 30;
        const wy = en.y + (randomFloat(gs, 0, 1) - 0.5) * 30;
        if (isSail(tiles, ~~wx, ~~wy)) {
          en.targetX = wx;
          en.targetY = wy;
          break;
        }
      }
    }
  }

  if (canSeePlayer && en.role === 'MERCHANT' && !en.intimidated && player.fame > 500 && dpP < 8) {
    en.intimidated = true;
    en.cargoDropDone = true;
    en.state = 'FLEE';
    spawnCargoPickup(gs, en.x + 0.5, en.y, Math.max(60, Math.round(en.loot * 0.35)), en.name ?? en.tk);
    emitEvent(gs, { kind: 'log', msg: `${en.name ?? en.tk} panics and dumps cargo overboard!`, tone: 'o' });
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

/** Check if enemy should fire at player — requires vision */
export function shouldFireAtPlayer(en: EnemyShip, player: PlayerShip): boolean {
  if (en.state !== 'CHASE' || en.reloadT > 0) return false;
  const dpP = Math.hypot(en.x - player.x, en.y - player.y);
  return dpP < en.rng && dpP < VISION_RANGE;
}

/** Check if enemy should fire at another enemy */
export function shouldFireAtEnemy(en: EnemyShip, other: EnemyShip): boolean {
  if (en.reloadT > 0 || other.sunk || other.disabled) return false;

  const hostile =
    (en.role === 'PIRATE' && other.role === 'MERCHANT') ||
    (en.role === 'WARSHIP' && other.role === 'PIRATE') ||
    (en.role === 'PIRATE' && other.role === 'WARSHIP');

  if (!hostile) return false;

  const d2 = Math.hypot(en.x - other.x, en.y - other.y);
  return d2 < en.rng * 0.8 && d2 < VISION_RANGE;
}

/** Check if enemy has reached port attack target */
export function hasReachedPortTarget(en: EnemyShip): boolean {
  if (!en.attackTarget) return false;
  return Math.hypot(en.x - en.attackTarget.x, en.y - en.attackTarget.y) < 4;
}
