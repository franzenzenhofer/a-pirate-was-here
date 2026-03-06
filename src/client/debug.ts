import type { GameState } from '../sim/state/game-state';
import type { Camera } from '../renderer/camera';
import { aiLog, eventLog, errorLog, fpsCurrent, frameTimeAvg, inspectEnemy } from './debug-data';

export { logAITransition, logEvent, updatePerfStats } from './debug-data';

export function mountDebugAPI(gs: GameState, cam: Camera): void {
  const api = {
    get state() { return gs; },
    get player() {
      const p = gs.player;
      return {
        pos: { x: ~~(p.x * 10) / 10, y: ~~(p.y * 10) / 10 },
        hp: p.hp + '/' + p.maxHp, speed: ~~(p.speed * 1000) / 1000,
        gold: p.gold, crew: p.crew, fame: p.fame, kills: p.kills,
        day: p.day, ship: p.tk, cannons: p.cn, cargo: p.cargo,
        fleet: p.fleet, target: p.targetX !== null ? { x: p.targetX, y: p.targetY } : null,
      };
    },
    get enemies() { return gs.enemies.map((_e, i) => inspectEnemy(gs, i)); },
    get alive() { return gs.enemies.filter(e => !e.sunk && !e.captured).length; },
    get ports() { return gs.ports.map(p => ({ name: p.name, nat: p.nat, rel: p.rel, pos: { x: p.x, y: p.y }, wealth: p.wealth })); },
    get camera() { return { x: ~~(cam.x * 10) / 10, y: ~~(cam.y * 10) / 10, w: cam.screenW, h: cam.screenH }; },

    ai: {
      get log() { return [...aiLog]; },
      get recent() { return aiLog.slice(-20); },
      inspect: (idx: number) => inspectEnemy(gs, idx),
      nearby: (range = 15) => {
        const out: Record<string, unknown>[] = [];
        gs.enemies.forEach((e, i) => {
          if (e.sunk || e.captured) return;
          if (Math.hypot(e.x - gs.player.x, e.y - gs.player.y) < range) out.push(inspectEnemy(gs, i)!);
        });
        return out;
      },
      states: () => {
        const c: Record<string, number> = {};
        for (const e of gs.enemies) { if (!e.sunk && !e.captured) c[e.state] = (c[e.state] ?? 0) + 1; }
        return c;
      },
      chasing: () => gs.enemies.filter(e => e.state === 'CHASE').map((_e, i) => inspectEnemy(gs, i)),
      fleeing: () => gs.enemies.filter(e => e.state === 'FLEE').map((_e, i) => inspectEnemy(gs, i)),
    },

    log: {
      get all() { return [...eventLog]; },
      get errors() { return [...errorLog]; },
      get recent() { return eventLog.slice(-30); },
      clear: () => { eventLog.length = 0; errorLog.length = 0; },
    },

    perf: {
      get fps() { return fpsCurrent; },
      get frameTime() { return ~~(frameTimeAvg * 100) / 100; },
      get entities() {
        return {
          enemies: gs.enemies.filter(e => !e.sunk).length,
          cannonballs: gs.cannonballs.length, particles: gs.particles.length,
          ports: gs.ports.length, treasures: gs.treasures.filter(t => !t.looted).length,
        };
      },
    },

    pause: () => { gs.paused = true; },
    resume: () => { gs.paused = false; },
    teleport: (x: number, y: number) => { gs.player.x = x; gs.player.y = y; },
    heal: () => { gs.player.hp = gs.player.maxHp; },
    gold: (n = 10000) => { gs.player.gold += n; },
    era: () => gs.era,
    wind: () => gs.wind,
    help: () => console.table({
      'pirates.player': 'Player state', 'pirates.enemies': 'All enemies',
      'pirates.ai.log': 'AI transitions', 'pirates.ai.recent': 'Last 20 AI events',
      'pirates.ai.inspect(i)': 'Enemy by index', 'pirates.ai.nearby(r)': 'Enemies in range',
      'pirates.ai.states()': 'State counts', 'pirates.ai.chasing()': 'Chasing enemies',
      'pirates.log.all': 'Event log', 'pirates.log.errors': 'Errors only',
      'pirates.perf.fps': 'FPS', 'pirates.perf.entities': 'Entity counts',
      'pirates.pause()': 'Pause', 'pirates.resume()': 'Resume',
      'pirates.teleport(x,y)': 'Teleport', 'pirates.heal()': 'Full heal',
      'pirates.gold(n)': 'Add gold', 'pirates.state': 'Raw GameState',
    }),
  };

  (window as unknown as Record<string, unknown>)['pirates'] = api;
  console.log('%c PIRATES DEBUG API ', 'background:#1a3a6a;color:#44aaff;font-size:14px;padding:4px 8px;border-radius:4px');
  console.log('Type pirates.help() for commands');
}
