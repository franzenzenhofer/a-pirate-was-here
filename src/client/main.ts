import { DEFAULT_SEED } from '../config/world';
import { resize as resizeCam } from '../renderer/camera';
import { updateHUD } from '../renderer/canvas/hud';
import { openPortMenu } from '../renderer/canvas/menus';
import { openTradeMenu, openUpgradeMenu } from '../renderer/canvas/port-trade-menus';
import { addLog } from '../renderer/canvas/log';
import { createMorale, updateMorale } from '../sim/state/morale';
import { createInputState, setupInputListeners } from '../input/touch';
import { createKeyState, setupKeyboardListeners, applyKeyboardNav } from '../input/keyboard';
import { captureInRange, portInRange } from './game-actions-available';
import { startLoop } from './loop';
import { updateGame } from './update';
import { renderGame } from './render';
import { mountDebugAPI, logAITransition, logEvent, updatePerfStats } from './debug';
import { startDebugPush } from './debug-push';
import { setAITransitionLogger } from '../sim/ai/strategy';
import { setLogHook } from '../renderer/canvas/log';
import { pushArchive } from '../sim/state/archive';
import { bindSessionUI, getActiveModal, syncSessionUI } from './session-ui';
import { computeUIMode } from './ui-mode';
import { applyLayerVisibility, computeLayerVisibility } from './ui-layers';
import { sellPlunder } from '../sim/economy/plunder';
import { consumeRequestedFreshSeed, loadFromStorage, saveToStorage, shouldLoadFromStorage } from './save-game';
import { createInitialGame } from './create-game';
import { BUILD_VERSION } from '../generated/build-version';
import { consumeSimEvents } from './sim-events';
import { updateMobileUI } from './action-bar';
import { buyDrinksForTown, demandTribute } from '../sim/state/port-actions';
import { resolvePortCrewChaos } from '../sim/state/crew-chaos';
import { nearestRumor } from '../sim/state/encounters';
import { primeAudio, syncAmbientAudio } from './audio';
import { applyScreenShake } from './screen-shake';
import { bindInspectPanel, renderInspectPanel, toggleInspect } from './inspect-panel';
import { attackPort } from './port-raid';
import { createSessionUIActions } from './session-actions';
import { createCaptureFlow } from './capture-flow';
import { nextRandom } from '../sim/state/random';
import { clampTargetToSea } from '../sim/nav/collision';
const canvas = document.getElementById('c') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
ctx.imageSmoothingEnabled = false;
let WP = window.innerWidth, HP = window.innerHeight;
canvas.width = WP; canvas.height = HP;

const requestedSeed = consumeRequestedFreshSeed(DEFAULT_SEED);
const { cam, gs } = createInitialGame(requestedSeed, WP, HP);
const morale = createMorale();
console.info('[pirates] build', BUILD_VERSION);
if (shouldLoadFromStorage()) loadFromStorage(gs);

let autosaveEnabled = true;
const setAutosaveEnabled = (enabled: boolean): void => { autosaveEnabled = enabled; };
const { enqueueCapture, maybeOpenCaptureMenu } = createCaptureFlow(gs);
window.addEventListener('resize', () => {
  WP = window.innerWidth; HP = window.innerHeight;
  canvas.width = WP; canvas.height = HP; resizeCam(cam, WP, HP);
});
window.addEventListener('pointerdown', () => primeAudio(), { once: true });
window.addEventListener('keydown', () => primeAudio(), { once: true });
bindInspectPanel(() => toggleInspect());
const input = createInputState();
setupInputListeners(canvas, input, cam, (result) => {
  primeAudio();
  if (gs.paused || gs.gameOver || gs.player.hp <= 0) return;
  for (const p of gs.ports) {
    if (Math.hypot(p.x - result.wx, p.y - result.wy) < 3 && portInRange(gs, p)) {
      const dockResult = resolvePortCrewChaos(gs, p);
      if (dockResult.blockMenu) return;
      gs.paused = true;
      gs.activePort = p;
      openPortMenu(p, gs.player, addLog,
        () => { gs.paused = false; gs.activePort = null; },
        (port) => { attackPort(gs, port); gs.paused = false; },
        (port) => { gs.paused = true; openTradeMenu(port, gs.player, addLog, () => { gs.paused = false; gs.activePort = null; }); },
        () => { gs.paused = true; openUpgradeMenu(gs.player, addLog, () => { gs.paused = false; gs.activePort = null; }); },
        (port) => { addLog(sellPlunder(gs, port), 'g'); gs.paused = false; gs.activePort = null; },
        (port) => { addLog(nearestRumor(gs, port), 'b'); gs.paused = false; gs.activePort = null; },
        (port) => { addLog(buyDrinksForTown(gs, port), 'g'); gs.paused = false; gs.activePort = null; },
        (port) => { addLog(demandTribute(gs, port), 'o'); gs.paused = false; gs.activePort = null; },
      );
      return;
    }
  }
  for (const en of gs.enemies) {
    const tappedEnemy = Math.hypot(en.x - result.wx, en.y - result.wy) < 2;
    if (en.disabled && !en.sunk && !en.captured && tappedEnemy && captureInRange(gs, en)) {
      enqueueCapture(en);
      maybeOpenCaptureMenu();
      return;
    }
  }
  const target = clampTargetToSea(gs.world.tiles, gs.player.x, gs.player.y, result.wx, result.wy);
  gs.player.targetX = target.x;
  gs.player.targetY = target.y;
});
const keys = createKeyState();
setupKeyboardListeners(keys);
setAITransitionLogger(logAITransition);
setLogHook((msg, type) => {
  logEvent(msg, type);
  pushArchive(gs, msg, type, 'event');
});
mountDebugAPI(gs, cam);
startDebugPush(gs, cam);
bindSessionUI(createSessionUIActions(gs, setAutosaveEnabled));
window.addEventListener('pagehide', () => {
  if (!autosaveEnabled) return;
  saveToStorage(gs);
});
setInterval(() => {
  if (!autosaveEnabled) return;
  saveToStorage(gs);
}, 12000);
let frameN = 0;
startLoop((dt) => {
  frameN++;
  updatePerfStats();
  if (!gs.gameOver) applyKeyboardNav(keys, gs.player, cam, gs.world.tiles);
  const moraleMsg = updateMorale(morale, gs.player, dt, () => nextRandom(gs));
  if (moraleMsg) addLog(moraleMsg, 'r');
  maybeOpenCaptureMenu();
  updateGame(gs, cam, dt, () => {
    renderGame(ctx, gs, cam, WP, HP);
    consumeSimEvents(gs);
    renderInspectPanel(gs);
    syncAmbientAudio(gs, dt);
    applyScreenShake(canvas, dt, gs.settings.reducedMotion);
    if (frameN % 4 === 0) {
      const mode = computeUIMode(gs, getActiveModal());
      updateHUD(gs.player, gs.era, gs.wind, gs.morale);
      syncSessionUI(gs);
      updateMobileUI(mode, gs);
      applyLayerVisibility(computeLayerVisibility(mode));
    }
  });
});

addLog('⚓ TAP to SAIL · PORTS to TRADE', 'b');
addLog('CANNONS AUTO-FIRE · SHARE LOOT', 'g');
