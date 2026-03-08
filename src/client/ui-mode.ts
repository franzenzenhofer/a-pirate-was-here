import type { GameState } from '../sim/state/game-state';
import { getCombatHudState } from './combat-hud';

export type UIMode = 'SAILING' | 'COMBAT' | 'CREW_ALERT' | 'DOCKED' | 'CAPTURE' | 'MENU';

/** Priority-ordered state machine: highest match wins */
export function computeUIMode(gs: GameState, activeModal: string | null): UIMode {
  if (activeModal || gs.gameOver) return 'MENU';
  if (gs.activePort !== null) return 'DOCKED';
  if (gs.paused && gs.captureQueue.length > 0) return 'CAPTURE';
  if (getCombatHudState(gs) !== null) return 'COMBAT';
  if (hasCrewAlert(gs)) return 'CREW_ALERT';
  return 'SAILING';
}

export function hasCrewAlert(gs: GameState): boolean {
  if (gs.player.feverT > 0) return true;
  if (gs.player.hypedT > 0) return true;
  if (gs.player.unsharedGold > 0) return true;
  return isFogNearby(gs);
}

function isFogNearby(gs: GameState): boolean {
  if (gs.player.deafenedT > 0) return false;
  return gs.fogZones.some(fog =>
    Math.hypot(gs.player.x - fog.x, gs.player.y - fog.y) < fog.radius,
  );
}
