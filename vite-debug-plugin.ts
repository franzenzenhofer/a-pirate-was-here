import type { Plugin, ViteDevServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';

interface DebugState {
  snapshot: Record<string, unknown>;
  updatedAt: number;
  sseClients: ServerResponse[];
  commandQueue: Record<string, unknown>[];
}

function json(res: ServerResponse, data: unknown): void {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache');
  res.end(JSON.stringify(data));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let b = '';
    req.on('data', (c: Buffer) => { b += c.toString(); });
    req.on('end', () => resolve(b));
  });
}

export function piratesDebugPlugin(): Plugin {
  const db: DebugState = { snapshot: {}, updatedAt: 0, sseClients: [], commandQueue: [] };

  function route(server: ViteDevServer): void {
    const mw = server.middlewares;

    mw.use('/api/push', async (req, res) => {
      if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Origin', '*'); res.setHeader('Access-Control-Allow-Headers', '*'); res.writeHead(204); res.end(); return; }
      if (req.method !== 'POST') { res.writeHead(405); res.end(); return; }
      const body = await readBody(req);
      try {
        db.snapshot = JSON.parse(body);
        db.updatedAt = Date.now();
        for (const c of db.sseClients) {
          try { c.write('data: ' + body + '\n\n'); } catch { /* closed */ }
        }
        db.sseClients = db.sseClients.filter(c => !c.destroyed);
      } catch { /* ignore parse errors */ }
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.writeHead(200); res.end('ok');
    });

    mw.use('/api/stream', (_req, res) => {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.writeHead(200);
      res.write('data: {"connected":true}\n\n');
      db.sseClients.push(res);
      res.on('close', () => { db.sseClients = db.sseClients.filter(c => c !== res); });
    });

    mw.use('/api', (req, res, next) => {
      if (req.method !== 'GET') { next(); return; }
      const url = req.url ?? '/';
      const s = db.snapshot as Record<string, unknown>;
      if (url === '/' || url === '/state') { json(res, { ...s, _updatedAt: db.updatedAt }); }
      else if (url === '/player') { json(res, s['player'] ?? {}); }
      else if (url === '/enemies') { json(res, s['enemies'] ?? []); }
      else if (url === '/ports') { json(res, s['ports'] ?? []); }
      else if (url === '/perf') { json(res, s['perf'] ?? {}); }
      else if (url === '/log') { json(res, s['eventLog'] ?? []); }
      else if (url === '/log/errors') { json(res, s['errorLog'] ?? []); }
      else if (url === '/errors') { json(res, s['browserErrors'] ?? []); }
      else if (url === '/ai/log') { json(res, s['aiLog'] ?? []); }
      else if (url === '/ai/states') { json(res, s['aiStates'] ?? {}); }
      else if (url === '/ai/nearby') { json(res, s['aiNearby'] ?? []); }
      else if (url === '/wind') { json(res, s['wind'] ?? {}); }
      else if (url === '/camera') { json(res, s['camera'] ?? {}); }
      else if (url === '/actions') { json(res, s['actions'] ?? {}); }
      else if (url === '/help') {
        json(res, {
          endpoints: {
            'GET /api/state': 'Full snapshot', 'GET /api/player': 'Player state',
            'GET /api/enemies': 'All enemies', 'GET /api/ports': 'All ports',
            'GET /api/perf': 'FPS + entity counts', 'GET /api/log': 'Event log',
            'GET /api/log/errors': 'Game errors', 'GET /api/errors': 'Browser/JS errors',
            'GET /api/ai/log': 'AI transitions', 'GET /api/ai/states': 'AI state counts',
            'GET /api/ai/nearby': 'Enemies near player', 'GET /api/wind': 'Wind state',
            'GET /api/camera': 'Camera position', 'GET /api/actions': 'Available actions',
            'GET /api/stream': 'SSE real-time stream',
            'POST /api/command': 'Execute game command (see commands)',
          },
          commands: {
            sail: '{cmd:"sail",x:80,y:68}', stop: '{cmd:"stop"}',
            pause: '{cmd:"pause"}', resume: '{cmd:"resume"}',
            heal: '{cmd:"heal"}', gold: '{cmd:"gold",amount:10000}',
            teleport: '{cmd:"teleport",x:80,y:68}',
            repair: '{cmd:"repair"}', recruit: '{cmd:"recruit"}',
            buy_cannon: '{cmd:"buy_cannon"}',
            trade_buy: '{cmd:"trade_buy",good:"sugar",qty:5}',
            trade_sell: '{cmd:"trade_sell",good:"sugar"}',
            upgrade: '{cmd:"upgrade",index:0}',
            tribute: '{cmd:"tribute"}', attack_port: '{cmd:"attack_port"}',
            loot: '{cmd:"loot",enemyIndex:3}',
            capture: '{cmd:"capture",enemyIndex:3}',
            board: '{cmd:"board",enemyIndex:3}',
            burn: '{cmd:"burn",enemyIndex:3}',
          },
          workflow: 'GET /api/actions → see options, POST /api/command → act',
        });
      } else { next(); }
    });

    mw.use('/api/commands/poll', (_req, res) => {
      const cmds = [...db.commandQueue];
      db.commandQueue.length = 0;
      json(res, cmds);
    });

    mw.use('/api/command', async (req, res) => {
      if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Origin', '*'); res.setHeader('Access-Control-Allow-Headers', '*'); res.writeHead(204); res.end(); return; }
      if (req.method !== 'POST') { res.writeHead(405); res.end(); return; }
      const body = await readBody(req);
      try {
        const cmd = JSON.parse(body);
        db.commandQueue.push(cmd);
        json(res, { ok: true, cmd, queued: db.commandQueue.length });
      } catch { res.writeHead(400); res.end('invalid json'); }
    });
  }

  return { name: 'pirates-debug', configureServer: route };
}
