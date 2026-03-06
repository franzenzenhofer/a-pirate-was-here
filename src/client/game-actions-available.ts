import type { GameState } from '../sim/state/game-state';
import { getTradeInfo } from '../sim/economy/trade';
import { getUpgradeOptions } from '../sim/economy/upgrade';

const PORT_RANGE = 4;
const ENEMY_RANGE = 3;

export function nearestPort(gs: GameState): { port: typeof gs.ports[0]; dist: number } | null {
  let best: typeof gs.ports[0] | null = null;
  let bd = Infinity;
  for (const p of gs.ports) {
    const d = Math.hypot(p.x - gs.player.x, p.y - gs.player.y);
    if (d < bd) { bd = d; best = p; }
  }
  return best && bd < PORT_RANGE ? { port: best, dist: bd } : null;
}

export function findEnemy(gs: GameState, idx: number): typeof gs.enemies[0] | null {
  const en = gs.enemies[idx];
  if (!en || en.sunk || !en.disabled) return null;
  if (Math.hypot(en.x - gs.player.x, en.y - gs.player.y) > ENEMY_RANGE * 3) return null;
  return en;
}

export function getAvailableActions(gs: GameState): Record<string, unknown> {
  const p = gs.player;
  const np = nearestPort(gs);
  const portActions: Record<string, unknown>[] = [];
  if (np) {
    const pt = np.port;
    const base = { port: pt.name, nat: pt.nat, rel: pt.rel, distance: ~~(np.dist * 10) / 10 };
    if (pt.rel === 'friendly') {
      const repCost = ~~(p.maxHp * 18);
      portActions.push({ ...base,
        actions: ['repair', 'recruit', 'buy_cannon', 'trade_buy', 'trade_sell', 'upgrade', 'attack_port'],
        repairCost: repCost, canRepair: p.gold >= repCost && p.hp < p.maxHp,
        tradeGoods: getTradeInfo(p, pt),
        upgrades: getUpgradeOptions(p).map((o, i) => ({
          index: i, name: o.name, cost: o.cost, desc: o.description, canAfford: o.canAfford,
        })),
      });
    } else if (pt.rel === 'neutral') {
      portActions.push({ ...base, actions: ['tribute', 'trade_buy', 'trade_sell', 'attack_port'],
        tributeCost: 200, canTribute: p.gold >= 200 });
    } else {
      portActions.push({ ...base, actions: ['attack_port'] });
    }
  }
  const disabledEnemies: Record<string, unknown>[] = [];
  gs.enemies.forEach((en, i) => {
    if (!en.disabled || en.sunk || en.captured) return;
    const d = Math.hypot(en.x - p.x, en.y - p.y);
    if (d < ENEMY_RANGE * 3) {
      disabledEnemies.push({ enemyIndex: i, type: en.tk, role: en.role,
        loot: en.loot, xp: en.xp, distance: ~~(d * 10) / 10,
        actions: ['loot', 'capture', 'board', 'burn'] });
    }
  });
  return {
    canSail: p.hp > 0, paused: gs.paused,
    player: { hp: p.hp, maxHp: p.maxHp, gold: p.gold, crew: p.crew, ship: p.tk,
      pos: { x: ~~(p.x * 10) / 10, y: ~~(p.y * 10) / 10 } },
    currentTarget: p.targetX !== null ? { x: p.targetX, y: p.targetY } : null,
    nearbyPorts: portActions, disabledEnemies,
    globalActions: ['sail', 'stop', 'pause', 'resume', 'heal', 'gold', 'teleport'],
  };
}
