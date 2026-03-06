import { SHIP_TYPES } from '../config/ships';
import { DEFAULT_SEED, WORLD_W, WORLD_H } from '../config/world';
import { asShipId } from '../core/types';
import type { GameState } from '../sim/state/game-state';
import { generateWorld } from '../sim/world/gen';
import { placePorts } from '../sim/world/ports';
import { createWind } from '../sim/nav/wind';
import { spawnInitialEnemies, spawnTreasures } from '../sim/state/spawn';
import { createCamera, resize as resizeCam } from '../renderer/camera';
import { updateHUD } from '../renderer/canvas/hud';
import { buildMinimapBase, drawMinimap } from '../renderer/canvas/minimap';
import { drawCompass } from '../renderer/canvas/compass';
import { openPortMenu, openCaptureMenu, openTradeMenu, openUpgradeMenu } from '../renderer/canvas/menus';
import { addLog } from '../renderer/canvas/log';
import { portUnderAttack } from '../sim/state/progression';
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

// Canvas
const canvas = document.getElementById('c') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
ctx.imageSmoothingEnabled = false;
let WP = window.innerWidth, HP = window.innerHeight;
canvas.width = WP; canvas.height = HP;

// World
const world = generateWorld(DEFAULT_SEED);
const ports = placePorts(world.tiles, DEFAULT_SEED);
const enemies = spawnInitialEnemies(world.tiles, 55);
const treasures = spawnTreasures(world.tiles, 35, []);

// Player spawn — find open ocean near center
const pST = SHIP_TYPES['BRIGANTINE']!;
let spawnX = WORLD_W / 2, spawnY = WORLD_H / 2, bestDist = 99999;
for (let y = 2; y < WORLD_H - 2; y++) {
  for (let x = 2; x < WORLD_W - 2; x++) {
    const t = world.tiles[y * WORLD_W + x];
    if (t === 0 || t === 1) {
      const d = Math.hypot(x - WORLD_W / 2, y - WORLD_H / 2);
      if (d < bestDist) { bestDist = d; spawnX = x; spawnY = y; }
    }
  }
}

const player = {
  id: asShipId(0), x: spawnX + 0.5, y: spawnY + 0.5,
  angle: 0, speed: 0, targetX: null as number | null, targetY: null as number | null,
  hp: pST.hp, maxHp: pST.hp, cn: pST.cn, rl: pST.rl, rng: pST.rng, acc: pST.acc,
  bspd: pST.spd, col: pST.col, tk: 'BRIGANTINE',
  reloadT: 0, disabled: false, sunk: false, captured: false,
  wakePoints: [] as { x: number; y: number }[], turnRate: pST.turn, nat: 'PIRATE',
  gold: 500, crew: 80, fame: 0, kills: 0, day: 1, dayT: 0,
  fleet: [] as { tk: string }[],
  cargo: [] as { good: string; qty: number; buyPrice: number }[],
  upgrades: { hull: 0, sails: 0, range: 0 },
};

// State
const wind = createWind();
const cam = createCamera(player.x, player.y, WP, HP);
const morale = createMorale();

const gs: GameState = {
  seed: DEFAULT_SEED,
  world, player, enemies, ports,
  cannonballs: [], particles: [], treasures, wind,
  era: 0, spawnTimer: 0, treasureTimer: 0, portWarTimer: 0,
  activePort: null, capturedEnemy: null, tradePort: null, paused: false,
  gameOver: false,
  archive: [],
  nextArchiveId: 1,
  plunder: [],
  reputation: 0,
  settings: { audio: true, reducedMotion: false, textScale: 1, minimapMode: 'full' },
  activeQuest: null,
  activeEvent: null,
};

// Minimap + compass
const mmCtx = (document.getElementById('minimap') as HTMLCanvasElement).getContext('2d')!;
buildMinimapBase(mmCtx, world.tiles);
const compCtx = (document.getElementById('compass') as HTMLCanvasElement).getContext('2d')!;

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
        () => { gs.paused = true; openUpgradeMenu(player, addLog, () => { gs.paused = false; }); });
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
  const result = portUnderAttack(p, player.cn, player.hp, player.maxHp, 'PIRATE');
  setTimeout(() => {
    if (result.success) {
      player.gold += p.wealth; player.fame += 60; player.kills++;
      gs.particles.push(...createExplosion(p.x, p.y, '#ff4400', 20));
      addLog('🏆 ' + result.msg, 'g');
    } else {
      const dmg = 2 + ~~(Math.random() * 6);
      player.hp = Math.max(1, player.hp - dmg);
      addLog('💀 REPELLED! -' + dmg + ' HP', 'r');
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
bindSessionUI(() => window.location.reload());

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
      drawMinimap(mmCtx, ports, enemies, player, cam);
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
