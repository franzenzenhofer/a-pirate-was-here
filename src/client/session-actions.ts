import type { SessionUIActions } from './session-ui';
import { addLog } from '../renderer/canvas/log';
import { saveToStorage, prepareFreshStart } from './save-game';
import { shareLootAndPassRum } from '../sim/state/crew-chaos';
import { tryBreakSirenFog } from '../sim/state/encounters';
import { fireBroadside } from '../sim/combat/naval';
import { nextRandom } from '../sim/state/random';
import type { GameState } from '../sim/state/game-state';

export function createSessionUIActions(
  gs: GameState,
  setAutosaveEnabled: (enabled: boolean) => void,
): SessionUIActions {
  return {
    onRestart: () => restartWithSeed(gs.settings.preferredSeed || gs.seed, setAutosaveEnabled),
    onSave: () => addLog(saveToStorage(gs), 'b'),
    onStartFresh: () => restartWithSeed(undefined, setAutosaveEnabled),
    onShareLoot: () => addLog(shareLootAndPassRum(gs), 'g'),
    onBreakFog: () => breakFog(gs),
    onCopySeed: () => {
      void navigator.clipboard?.writeText(String(gs.settings.preferredSeed || gs.seed));
      addLog('Seed copied to clipboard.', 'b');
    },
    onStartSeeded: (seed) => restartWithSeed(seed, setAutosaveEnabled),
    onSettingsChanged: (patch) => {
      gs.settings = { ...gs.settings, ...patch };
    },
  };
}

function restartWithSeed(seed: number | undefined, setAutosaveEnabled: (enabled: boolean) => void): void {
  setAutosaveEnabled(false);
  prepareFreshStart(seed);
  window.location.reload();
}

function breakFog(gs: GameState): void {
  if (gs.player.reloadT > 0) {
    addLog('Cannons still reloading!', 'r');
    return;
  }
  if (!tryBreakSirenFog(gs)) {
    addLog('No siren fog nearby.', 'o');
    return;
  }
  gs.cannonballs.push(...fireBroadside(
    gs.player.x,
    gs.player.y,
    gs.player.angle,
    gs.player.x + Math.cos(gs.player.angle) * 3,
    gs.player.y + Math.sin(gs.player.angle) * 3,
    true,
    0.5,
    3.5,
    Math.max(2, Math.min(gs.player.cn, 4)),
    () => nextRandom(gs),
  ));
  gs.player.reloadT = Math.max(1200, Math.round(gs.player.rl * 0.35));
}
