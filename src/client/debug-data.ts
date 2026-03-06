import type { GameState } from '../sim/state/game-state';
import type { EnemyShip } from '../core/types';

export interface AILogEntry {
  t: number;
  id: number;
  tk: string;
  role: string;
  from: string;
  to: string;
  reason: string;
  pos: { x: number; y: number };
  hp: number;
  maxHp: number;
}

export interface DebugLog {
  msg: string;
  type: string;
  t: number;
}

const AI_LOG_MAX = 200;
const EVENT_LOG_MAX = 500;

export const aiLog: AILogEntry[] = [];
export const eventLog: DebugLog[] = [];
export const errorLog: DebugLog[] = [];

let fpsFrames = 0;
let fpsLast = performance.now();
export let fpsCurrent = 0;
export let frameTimeAvg = 0;

export function logAITransition(en: EnemyShip, from: string, to: string, reason: string): void {
  aiLog.push({
    t: performance.now(), id: en.id, tk: en.tk, role: en.role,
    from, to, reason, pos: { x: ~~(en.x * 10) / 10, y: ~~(en.y * 10) / 10 },
    hp: en.hp, maxHp: en.maxHp,
  });
  if (aiLog.length > AI_LOG_MAX) aiLog.shift();
}

export function logEvent(msg: string, type: string): void {
  const entry = { msg, type, t: performance.now() };
  eventLog.push(entry);
  if (eventLog.length > EVENT_LOG_MAX) eventLog.shift();
  if (type === 'r' || type === 'error') errorLog.push(entry);
}

export function updatePerfStats(): void {
  fpsFrames++;
  const now = performance.now();
  if (now - fpsLast >= 1000) {
    fpsCurrent = fpsFrames;
    frameTimeAvg = (now - fpsLast) / fpsFrames;
    fpsFrames = 0;
    fpsLast = now;
  }
}

export function inspectEnemy(gs: GameState, idx: number): Record<string, unknown> | null {
  const en = gs.enemies[idx];
  if (!en) return null;
  const dp = Math.hypot(en.x - gs.player.x, en.y - gs.player.y);
  return {
    index: idx, id: en.id, type: en.tk, role: en.role, tier: en.ti,
    state: en.state, hp: en.hp + '/' + en.maxHp, nat: en.nat,
    pos: { x: ~~(en.x * 10) / 10, y: ~~(en.y * 10) / 10 },
    speed: ~~(en.speed * 1000) / 1000, angle: ~~(en.angle * 100) / 100,
    target: en.targetX !== null ? { x: ~~(en.targetX * 10) / 10, y: ~~(en.targetY! * 10) / 10 } : null,
    distToPlayer: ~~(dp * 10) / 10, reloadT: ~~en.reloadT,
    disabled: en.disabled, sunk: en.sunk, captured: en.captured,
    behavior: en.beh, cannons: en.cn, loot: en.loot,
    attackTarget: en.attackTarget?.name ?? null,
  };
}
