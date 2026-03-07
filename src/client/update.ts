import type { GameState } from '../sim/state/game-state';
import { updateParticles } from '../sim/combat/damage';
import { updateCballs } from './cballs';
import { updateProgression } from '../sim/state/progression';
import type { Camera } from '../renderer/camera';
import { updateWind } from '../sim/nav/wind';
import { updatePickups } from '../sim/state/pickups';
import { updateCrewChaos } from '../sim/state/crew-chaos';
import { nextRandom } from '../sim/state/random';
import { resolveRamming, updateImpactTimers } from '../sim/combat/ramming';
import { updateWorldEncounters } from '../sim/state/encounters';
import { updatePlayer } from './update-player';
import { updateEnemies } from './update-enemies';

export function updateGame(gs: GameState, cam: Camera, dt: number, renderFn: () => void): void {
  if (gs.paused || gs.gameOver) { renderFn(); return; }
  updateWind(gs.wind, dt, () => nextRandom(gs));
  updateCrewChaos(gs, dt);
  updateWorldEncounters(gs, dt);
  updatePlayer(gs, cam, dt);
  updateEnemies(gs, dt);
  updateCballs(gs, dt);
  updateImpactTimers(gs, dt);
  resolveRamming(gs);
  updatePickups(gs, dt);
  gs.particles = updateParticles(gs.particles, dt);
  updateProgression(gs, dt);
  renderFn();
}
