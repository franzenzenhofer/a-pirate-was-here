import { emitEvent } from './events';
import type { GameState } from './game-state';
import { randomChance } from './random';
import { findSeaSpawnNearPlayer } from './encounter-utils';

const SIREN_RADIUS = 7;

export function activeFog(gs: GameState) {
  return gs.fogZones.find(fog => Math.hypot(gs.player.x - fog.x, gs.player.y - fog.y) < fog.radius) ?? null;
}

export function isFogLocked(gs: GameState): boolean {
  return activeFog(gs) !== null && gs.player.deafenedT <= 0;
}

export function tryBreakSirenFog(gs: GameState): boolean {
  const fog = activeFog(gs);
  if (!fog) return false;
  gs.player.deafenedT = 3000;
  emitEvent(gs, { kind: 'sound', msg: 'weather' });
  emitEvent(gs, { kind: 'log', msg: '🔊 Your broadside shatters the siren song for a few breaths.', tone: 'b' });
  return true;
}

export function updateFogZones(gs: GameState, dt: number): void {
  for (let index = gs.fogZones.length - 1; index >= 0; index--) {
    const fog = gs.fogZones[index];
    if (!fog) continue;
    fog.ttl -= dt;
    fog.x += Math.cos((gs.player.day + index) * 0.8) * 0.0006 * dt;
    fog.y += Math.sin((gs.player.day + index) * 0.6) * 0.0005 * dt;
    if (fog.ttl <= 0) gs.fogZones.splice(index, 1);
  }

  const fog = activeFog(gs);
  if (!fog || gs.player.deafenedT > 0) return;
  gs.player.targetX = fog.x;
  gs.player.targetY = fog.y;
  if (!randomChance(gs, Math.min(0.18, dt / 2000))) return;
  gs.player.crew = Math.max(1, gs.player.crew - 3);
  emitEvent(gs, { kind: 'log', msg: '🎶 Siren fog grips the helm. 3 crew leap overboard!', tone: 'r' });
}

export function maybeSpawnSirenFog(gs: GameState, dt: number): void {
  if (gs.era < 2 || gs.fogZones.length > 0) return;
  if (!randomChance(gs, Math.min(0.004, dt / 160000))) return;
  const spawn = findSeaSpawnNearPlayer(gs, 6, 12);
  if (!spawn) return;
  gs.fogZones.push({
    id: `fog-${gs.player.day}-${gs.fogZones.length}`,
    x: spawn.x,
    y: spawn.y,
    radius: SIREN_RADIUS,
    ttl: 90_000,
    strength: 1,
  });
  emitEvent(gs, { kind: 'log', msg: '🌫 Pink siren fog drifts across the sea lanes.', tone: 'o' });
}
