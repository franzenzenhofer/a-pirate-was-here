import type { GameState } from './game-state';
import { maybeSpawnGhostFleet, maybeSpawnHunters, maybeSpawnMegalodon, maybeSpawnRival } from './encounter-spawns';
import { activeFog, isFogLocked, maybeSpawnSirenFog, tryBreakSirenFog, updateFogZones } from './encounter-fog';
import { nearestRumor, tagFalseIslands } from './encounter-utils';
import { rewardSpecialVictory, spawnCrabLeviathan, updateSpecialEnemy } from './encounter-special';

export { activeFog, isFogLocked, nearestRumor, rewardSpecialVictory, spawnCrabLeviathan, tryBreakSirenFog, updateSpecialEnemy };

export function updateWorldEncounters(gs: GameState, dt: number): void {
  updateFogZones(gs, dt);
  maybeSpawnHunters(gs, dt);
  maybeSpawnRival(gs, dt);
  maybeSpawnMegalodon(gs, dt);
  maybeSpawnGhostFleet(gs, dt);
  maybeSpawnSirenFog(gs, dt);
  tagFalseIslands(gs);
}
