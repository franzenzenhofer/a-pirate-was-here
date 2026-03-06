import type { GameState } from '../sim/state/game-state';
import type { Camera } from '../renderer/camera';
import { aiLog, eventLog, errorLog, fpsCurrent, frameTimeAvg, inspectEnemy } from './debug-data';
import { executeCommand, getAvailableActions } from './game-actions';

interface BrowserError {
  t: number;
  type: string;
  msg: string;
  source?: string;
  line?: number;
  stack?: string;
}

const browserErrors: BrowserError[] = [];
const BROWSER_ERROR_MAX = 100;

function captureError(type: string, msg: string, source?: string, line?: number, stack?: string): void {
  browserErrors.push({ t: Date.now(), type, msg, source, line, stack });
  if (browserErrors.length > BROWSER_ERROR_MAX) browserErrors.shift();
}

function setupErrorCapture(): void {
  window.onerror = (msg, source, line, _col, err) => {
    captureError('error', String(msg), source ?? undefined, line ?? undefined, err?.stack);
    return false;
  };
  window.addEventListener('unhandledrejection', (ev) => {
    const reason = ev.reason;
    captureError('rejection', String(reason?.message ?? reason), undefined, undefined, reason?.stack);
  });
  const origError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    captureError('console.error', args.map(String).join(' '));
    origError(...args);
  };
  const origWarn = console.warn.bind(console);
  console.warn = (...args: unknown[]) => {
    captureError('console.warn', args.map(String).join(' '));
    origWarn(...args);
  };
}

function buildSnapshot(gs: GameState, cam: Camera): Record<string, unknown> {
  const p = gs.player;
  const aiStates: Record<string, number> = {};
  const aiNearby: Record<string, unknown>[] = [];
  for (let i = 0; i < gs.enemies.length; i++) {
    const e = gs.enemies[i]!;
    if (e.sunk || e.captured) continue;
    aiStates[e.state] = (aiStates[e.state] ?? 0) + 1;
    if (Math.hypot(e.x - p.x, e.y - p.y) < 15) aiNearby.push(inspectEnemy(gs, i)!);
  }
  return {
    player: {
      pos: { x: ~~(p.x * 10) / 10, y: ~~(p.y * 10) / 10 },
      hp: p.hp, maxHp: p.maxHp, speed: ~~(p.speed * 1000) / 1000,
      gold: p.gold, crew: p.crew, fame: p.fame, kills: p.kills,
      day: p.day, ship: p.tk, cannons: p.cn, cargo: p.cargo, fleet: p.fleet,
      target: p.targetX !== null ? { x: p.targetX, y: p.targetY } : null,
    },
    enemies: gs.enemies.map((_e, i) => inspectEnemy(gs, i)),
    ports: gs.ports.map(pt => ({ name: pt.name, nat: pt.nat, rel: pt.rel, x: pt.x, y: pt.y, wealth: pt.wealth })),
    perf: {
      fps: fpsCurrent, frameTime: ~~(frameTimeAvg * 100) / 100,
      enemies: gs.enemies.filter(e => !e.sunk).length,
      cannonballs: gs.cannonballs.length, particles: gs.particles.length,
    },
    actions: getAvailableActions(gs),
    aiLog: aiLog.slice(-50), aiStates, aiNearby,
    eventLog: eventLog.slice(-100), errorLog: [...errorLog],
    browserErrors: [...browserErrors],
    wind: gs.wind,
    camera: { x: ~~(cam.x * 10) / 10, y: ~~(cam.y * 10) / 10, w: cam.screenW, h: cam.screenH },
    era: gs.era, paused: gs.paused,
  };
}

export function startDebugPush(gs: GameState, cam: Camera): void {
  setupErrorCapture();
  setInterval(() => {
    fetch('/api/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildSnapshot(gs, cam)),
    }).catch(() => {});
    fetch('/api/commands/poll')
      .then(r => r.json())
      .then((cmds: Record<string, unknown>[]) => {
        for (const cmd of cmds) {
          const result = executeCommand(gs, cam, cmd);
          console.log('[API CMD]', cmd['cmd'], result.ok ? 'OK' : 'FAIL', result.msg);
        }
      }).catch(() => {});
  }, 500);
}
