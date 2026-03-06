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
import { clearStorage, loadFromStorage, saveToStorage } from './save-game';
import { createInitialGame } from './create-game';

// Canvas
const canvas = document.getElementById('c') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
ctx.imageSmoothingEnabled = false;
let WP = window.innerWidth, HP = window.innerHeight;
canvas.width = WP; canvas.height = HP;

const { cam, gs } = createInitialGame(DEFAULT_SEED, WP, HP);
const { player, ports, enemies, wind } = gs;
const morale = createMorale();

// Minimap + compass
const minimapCanvas = document.getElementById('minimap') as HTMLCanvasElement | null;
const mmCtx = minimapCanvas?.getContext('2d') ?? null;
const compCtx = (document.getElementById('compass') as HTMLCanvasElement).getContext('2d')!;
if (mmCtx && gs.settings.minimapMode !== 'hidden') buildMinimapBase(mmCtx, gs.world.tiles);
if (loadFromStorage(gs) && mmCtx && gs.settings.minimapMode !== 'hidden') buildMinimapBase(mmCtx, gs.world.tiles);

// Resize
window.addEventListener('resize', () => {
  WP = window.innerWidth; HP = window.innerHeight;
  canvas.width = WP; canvas.height = HP; resizeCam(cam, WP, HP);
});

// Touch input
const input = createInputState();
setupInputListeners(canvas, input, cam, (result) => {
  if (gs.paused || gs.gameOver || player.hp <= 0) return;
  // Check ports
  for (const p of ports) {
    if (Math.hypot(p.x - result.wx, p.y - result.wy) < 3 && portInRange(gs, p)) {
      gs.paused = true;
      openPortMenu(p, player, addLog,
        () => { gs.paused = false; },
        (port) => { attackPort(port); gs.paused = false; },
        (port) => { gs.paused = true; openTradeMenu(port, player, addLog, () => { gs.paused = false; }); },
        () => { gs.paused = true; openUpgradeMenu(player, addLog, () => { gs.paused = false; }); },
        (port) => { addLog(sellPlunder(gs, port), 'g'); gs.paused = false; });
      return;
    }
  }
  // Check disabled enemies
  for (const en of enemies) {
    const tappedEnemy = Math.hypot(en.x - result.wx, en.y - result.wy) < 2;
    if (en.disabled && !en.sunk && !en.captured && tappedEnemy && captureInRange(gs, en)) {
      gs.paused = true;
      openCaptureMenu(en, player, addLog, (e, outcome) => {
        if (outcome === 'sunk') gs.particles.push(...createExplosion(e.x, e.y, '#ff6622', 20));
        if (outcome !== 'released') resolveLegendaryVictory(gs, e.tk);
        gs.paused = false;
      });
      return;
    }
  }
  player.targetX = result.wx; player.targetY = result.wy;
});

// Keyboard input
const keys = createKeyState();
setupKeyboardListeners(keys);

function attackPort(p: typeof ports[number]): void {
  addLog('⚔️ ATTACKING ' + p.name + '!', 'r');
  const defendingNation = p.nat;
  const raid = assessPortRaid(p, player.cn, player.hp, player.maxHp);
  const result = portUnderAttack(p, player.cn, player.hp, player.maxHp, 'PIRATE');
  setTimeout(() => {
    if (result.success) {
      const instantGold = raid.expectedGold;
      player.gold += instantGold; player.fame += 60; player.kills++;
      addPlunder(gs, 'Port Booty', raid.expectedPlunder, p.name, 1);
      increaseInfamy(gs, 12, defendingNation);
      gs.particles.push(...createExplosion(p.x, p.y, '#ff4400', 20));
      addLog('🏆 ' + result.msg + ` +${instantGold}g now, cargo hold packed with booty.`, 'g');
    } else {
      const dmg = raid.counterDamage + ~~(Math.random() * 3);
      player.hp = Math.max(1, player.hp - dmg);
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
bindSessionUI(
  () => window.location.reload(),
  () => addLog(saveToStorage(gs), 'b'),
  () => { clearStorage(); window.location.reload(); },
);
window.addEventListener('pagehide', () => { saveToStorage(gs); });
setInterval(() => { saveToStorage(gs); }, 12000);

// Game loop — throttle secondary renders
let frameN = 0;
startLoop((dt) => {
  frameN++;
  updatePerfStats();
  if (!gs.gameOver) applyKeyboardNav(keys, player, cam);
  const moraleMsg = updateMorale(morale, player, dt);
  if (moraleMsg) addLog(moraleMsg, 'r');
  updateGame(gs, cam, dt, () => {
    renderGame(ctx, gs, cam, WP, HP);
    if (frameN % 4 === 0) {
      updateHUD(player, gs.era, wind);
      if (mmCtx && gs.settings.minimapMode !== 'hidden') drawMinimap(mmCtx, ports, enemies, player, cam);
      drawCompass(compCtx, wind);
      syncSessionUI(gs);
    }
  });
});

addLog('⚓ PIRATES! THE CARIBBEAN', 'b');
addLog('TAP or WASD to SET SAIL', 'b');
addLog('BROADSIDE CANNONS AUTO-FIRE 🔫', 'g');
setTimeout(() => addLog('TAP PORTS TO TRADE & UPGRADE', 'b'), 2500);
setTimeout(() => addLog('💰 SEEK TREASURE ON BEACHES!', 'g'), 5000);
