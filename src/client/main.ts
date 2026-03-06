import { DEFAULT_SEED } from '../config/world';
import { resize as resizeCam } from '../renderer/camera';
import { updateHUD } from '../renderer/canvas/hud';
import { buildMinimapBase, drawMinimap } from '../renderer/canvas/minimap';
import { drawCompass } from '../renderer/canvas/compass';
import { openPortMenu, openCaptureMenu } from '../renderer/canvas/menus';
import { openTradeMenu, openUpgradeMenu } from '../renderer/canvas/port-trade-menus';
import { addLog } from '../renderer/canvas/log';
import { assessPortRaid, portUnderAttack } from '../sim/state/progression';
import { createExplosion } from '../sim/combat/damage';
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
import { bindSessionUI, syncSessionUI } from './session-ui';
import { addPlunder, sellPlunder } from '../sim/economy/plunder';
import { increaseInfamy } from '../sim/state/reputation';
import { resolveLegendaryVictory } from '../sim/state/objectives';
import { consumeRequestedFreshSeed, loadFromStorage, prepareFreshStart, saveToStorage, shouldLoadFromStorage } from './save-game';
import { createInitialGame } from './create-game';
import { BUILD_VERSION } from '../generated/build-version';
import { consumeSimEvents } from './sim-events';
import { nextRandom } from '../sim/state/random';
import { buyDrinksForTown, demandTribute } from '../sim/state/port-actions';
import { registerSeaLoot, resolvePortCrewChaos, shareLootAndPassRum } from '../sim/state/crew-chaos';
import { nearestRumor, rewardSpecialVictory, tryBreakSirenFog } from '../sim/state/encounters';
import { fireBroadside } from '../sim/combat/naval';
import { primeAudio, syncAmbientAudio } from './audio';
import { applyScreenShake } from './screen-shake';
import { bindInspectPanel, renderInspectPanel, toggleInspect } from './inspect-panel';
import type { GameState } from '../sim/state/game-state';

// Canvas
const canvas = document.getElementById('c') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
ctx.imageSmoothingEnabled = false;
let WP = window.innerWidth, HP = window.innerHeight;
canvas.width = WP; canvas.height = HP;

const requestedSeed = consumeRequestedFreshSeed(DEFAULT_SEED);
const { cam, gs } = createInitialGame(requestedSeed, WP, HP);
const morale = createMorale();
console.info('[pirates] build', BUILD_VERSION);

// Minimap + compass
const minimapCanvas = document.getElementById('minimap') as HTMLCanvasElement | null;
const mmCtx = minimapCanvas?.getContext('2d') ?? null;
const compCtx = (document.getElementById('compass') as HTMLCanvasElement).getContext('2d')!;
if (mmCtx && gs.settings.minimapMode !== 'hidden') buildMinimapBase(mmCtx, gs.world.tiles);
if (shouldLoadFromStorage() && loadFromStorage(gs) && mmCtx && gs.settings.minimapMode !== 'hidden') {
  buildMinimapBase(mmCtx, gs.world.tiles);
}

let autosaveEnabled = true;
let captureModalShipId: string | null = null;

// Resize
window.addEventListener('resize', () => {
  WP = window.innerWidth; HP = window.innerHeight;
  canvas.width = WP; canvas.height = HP; resizeCam(cam, WP, HP);
});
window.addEventListener('pointerdown', () => primeAudio(), { once: true });
window.addEventListener('keydown', () => primeAudio(), { once: true });
bindInspectPanel(() => toggleInspect());

// Touch input
const input = createInputState();
setupInputListeners(canvas, input, cam, (result) => {
  primeAudio();
  if (gs.paused || gs.gameOver || gs.player.hp <= 0) return;
  // Check ports
  for (const p of gs.ports) {
    if (Math.hypot(p.x - result.wx, p.y - result.wy) < 3 && portInRange(gs, p)) {
      const dockResult = resolvePortCrewChaos(gs, p);
      if (dockResult.blockMenu) return;
      gs.paused = true;
      gs.activePort = p;
      openPortMenu(p, gs.player, addLog,
        () => { gs.paused = false; gs.activePort = null; },
        (port) => { attackPort(port); gs.paused = false; },
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
  // Check disabled enemies
  for (const en of gs.enemies) {
    const tappedEnemy = Math.hypot(en.x - result.wx, en.y - result.wy) < 2;
    if (en.disabled && !en.sunk && !en.captured && tappedEnemy && captureInRange(gs, en)) {
      enqueueCapture(en);
      maybeOpenCaptureMenu();
      return;
    }
  }
  gs.player.targetX = result.wx; gs.player.targetY = result.wy;
});

// Keyboard input
const keys = createKeyState();
setupKeyboardListeners(keys);

function attackPort(p: GameState['ports'][number]): void {
  addLog('⚔️ ATTACKING ' + p.name + '!', 'r');
  const defendingNation = p.nat;
  const raid = assessPortRaid(p, gs.player.cn, gs.player.hp, gs.player.maxHp);
  const result = portUnderAttack(p, gs.player.cn, gs.player.hp, gs.player.maxHp, 'PIRATE', nextRandom(gs));
  setTimeout(() => {
    if (result.success) {
      const instantGold = raid.expectedGold;
      gs.player.gold += instantGold; gs.player.fame += 60; gs.player.kills++;
      addPlunder(gs, 'Port Booty', raid.expectedPlunder, p.name, 1);
      increaseInfamy(gs, 12, defendingNation);
      gs.particles.push(...createExplosion(p.x, p.y, '#ff4400', 20));
      addLog('🏆 ' + result.msg + ` +${instantGold}g now, cargo hold packed with booty.`, 'g');
    } else {
      const dmg = raid.counterDamage + ~~(nextRandom(gs) * 3);
      gs.player.hp = Math.max(1, gs.player.hp - dmg);
      addLog(`💀 REPELLED! -${dmg} HP · Raid odds were ${Math.round(raid.winChance * 100)}%`, 'r');
    }
  }, 600);
}

// Debug API + HTTP endpoints
setAITransitionLogger(logAITransition);
setLogHook((msg, type) => {
  logEvent(msg, type);
  pushArchive(gs, msg, type, 'event');
});
mountDebugAPI(gs, cam);
startDebugPush(gs, cam);
bindSessionUI({
  onRestart: () => {
    autosaveEnabled = false;
    prepareFreshStart(gs.settings.preferredSeed || gs.seed);
    window.location.reload();
  },
  onSave: () => addLog(saveToStorage(gs), 'b'),
  onStartFresh: () => {
    autosaveEnabled = false;
    prepareFreshStart();
    window.location.reload();
  },
  onShareLoot: () => addLog(shareLootAndPassRum(gs), 'g'),
  onBreakFog: () => {
    if (gs.player.reloadT > 0) { addLog('Cannons still reloading!', 'r'); return; }
    if (!tryBreakSirenFog(gs)) { addLog('No siren fog nearby.', 'o'); return; }
    gs.cannonballs.push(...fireBroadside(
      gs.player.x, gs.player.y, gs.player.angle,
      gs.player.x + Math.cos(gs.player.angle) * 3,
      gs.player.y + Math.sin(gs.player.angle) * 3,
      true,
      0.5,
      3.5,
      Math.max(2, Math.min(gs.player.cn, 4)),
      () => nextRandom(gs),
    ));
    gs.player.reloadT = Math.max(1200, Math.round(gs.player.rl * 0.35));
  },
  onCopySeed: () => { void navigator.clipboard?.writeText(String(gs.settings.preferredSeed || gs.seed)); addLog('Seed copied to clipboard.', 'b'); },
  onStartSeeded: (seed) => {
    autosaveEnabled = false;
    prepareFreshStart(seed);
    window.location.reload();
  },
  onSettingsChanged: (patch) => {
    gs.settings = { ...gs.settings, ...patch };
  },
});
window.addEventListener('pagehide', () => {
  if (!autosaveEnabled) return;
  saveToStorage(gs);
});
setInterval(() => {
  if (!autosaveEnabled) return;
  saveToStorage(gs);
}, 12000);

// Game loop — throttle secondary renders
let frameN = 0;
startLoop((dt) => {
  frameN++;
  updatePerfStats();
  if (!gs.gameOver) applyKeyboardNav(keys, gs.player, cam);
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
      updateHUD(gs.player, gs.era, gs.wind);
      if (mmCtx && gs.settings.minimapMode !== 'hidden') drawMinimap(mmCtx, gs.ports, gs.enemies, gs.player, cam);
      drawCompass(compCtx, gs.wind);
      syncSessionUI(gs);
    }
  });
});

addLog('⚓ PIRATES! THE CARIBBEAN', 'b');
addLog('TAP or WASD to SET SAIL', 'b');
addLog('BROADSIDE CANNONS AUTO-FIRE 🔫', 'g');
setTimeout(() => addLog('TAP PORTS TO TRADE & UPGRADE', 'b'), 2500);
setTimeout(() => addLog('💰 SEEK TREASURE ON BEACHES!', 'g'), 5000);
setTimeout(() => addLog('🍻 SHARE LOOT AT SEA BEFORE FEVER TURNS TO MUTINY', 'o'), 7500);

function enqueueCapture(enemy: typeof gs.enemies[number]): void {
  const id = String(enemy.id);
  if (!gs.captureQueue.includes(id)) gs.captureQueue.push(id);
}

function maybeOpenCaptureMenu(): void {
  if (gs.paused || captureModalShipId) return;
  pruneCaptureQueue();
  const nextId = gs.captureQueue[0];
  if (!nextId) return;
  const enemy = gs.enemies.find(en => String(en.id) === nextId && en.disabled && !en.sunk && !en.captured && captureInRange(gs, en));
  if (!enemy) {
    gs.captureQueue.shift();
    return;
  }
  captureModalShipId = nextId;
  gs.paused = true;
  openCaptureMenu(enemy, gs.player, addLog, () => nextRandom(gs), (e, outcome, action) => {
    if (outcome === 'sunk') gs.particles.push(...createExplosion(e.x, e.y, '#ff6622', 20));
    if (outcome !== 'released') {
      resolveLegendaryVictory(gs, e.tk);
      if (action === 'loot') registerSeaLoot(gs, e.loot, e.name ?? e.tk);
      if (action === 'capture') registerSeaLoot(gs, ~~(e.loot * 0.3), e.name ?? e.tk);
      if (action === 'board') registerSeaLoot(gs, ~~(e.loot * 1.5), e.name ?? e.tk);
      rewardSpecialVictory(gs, e);
      if (e.name?.includes('MUTINEERS') && gs.player.mutinyGold > 0) {
        gs.player.gold += gs.player.mutinyGold;
        addLog(`Recovered ${gs.player.mutinyGold}g from the mutineers!`, 'g');
        gs.player.mutinyGold = 0;
      }
    }
    gs.captureQueue = gs.captureQueue.filter(id => id !== nextId);
    captureModalShipId = null;
    gs.paused = false;
  });
}

function pruneCaptureQueue(): void {
  gs.captureQueue = gs.captureQueue.filter(id => {
    const enemy = gs.enemies.find(en => String(en.id) === id);
    return Boolean(enemy && enemy.disabled && !enemy.sunk && !enemy.captured && captureInRange(gs, enemy));
  });
}
