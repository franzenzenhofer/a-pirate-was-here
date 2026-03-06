import type { GameState } from '../sim/state/game-state';
import type { Camera } from '../renderer/camera';
import { followTarget } from '../renderer/camera';
import { buyGoods, sellGoods } from '../sim/economy/trade';
import { getUpgradeOptions } from '../sim/economy/upgrade';
import { addLog } from '../renderer/canvas/log';
import { nearestPort, findEnemy } from './game-actions-available';
import { sellPlunder } from '../sim/economy/plunder';
import { resolveEnemyAction, resolvePortAttack } from './game-action-resolvers';

export { getAvailableActions } from './game-actions-available';

export function executeCommand(
  gs: GameState, cam: Camera, cmd: Record<string, unknown>,
): { ok: boolean; msg: string } {
  const name = cmd['cmd'] as string;
  const p = gs.player;

  if (name === 'sail') {
    p.targetX = Number(cmd['x']); p.targetY = Number(cmd['y']);
    return { ok: true, msg: 'Sailing to ' + p.targetX + ',' + p.targetY };
  }
  if (name === 'stop') {
    p.targetX = null; p.targetY = null; p.speed = 0;
    return { ok: true, msg: 'Stopped' };
  }
  if (name === 'pause') { gs.paused = true; return { ok: true, msg: 'Paused' }; }
  if (name === 'resume') { gs.paused = false; return { ok: true, msg: 'Resumed' }; }
  if (name === 'heal') { p.hp = p.maxHp; return { ok: true, msg: 'Healed' }; }
  if (name === 'gold') { p.gold += Number(cmd['amount'] ?? 10000); return { ok: true, msg: 'Gold added' }; }
  if (name === 'teleport') {
    p.x = Number(cmd['x']); p.y = Number(cmd['y']);
    followTarget(cam, p.x, p.y, 1.0);
    return { ok: true, msg: 'Teleported' };
  }

  const np = nearestPort(gs);

  if (name === 'repair') {
    if (!np || np.port.rel !== 'friendly') return { ok: false, msg: 'No friendly port nearby' };
    const cost = ~~(p.maxHp * 18), amt = ~~(p.maxHp * 0.6);
    if (p.gold < cost) return { ok: false, msg: 'Need ' + cost + 'g' };
    p.gold -= cost; p.hp = Math.min(p.maxHp, p.hp + amt);
    addLog('Repaired at ' + np.port.name, 'g');
    return { ok: true, msg: 'Repaired +' + amt + 'HP for ' + cost + 'g' };
  }
  if (name === 'recruit') {
    if (!np || np.port.rel !== 'friendly') return { ok: false, msg: 'No friendly port nearby' };
    if (p.gold < 50) return { ok: false, msg: 'Need 50g' };
    p.gold -= 50; p.crew = Math.min(250, p.crew + 10);
    addLog('+10 crew', 'g');
    return { ok: true, msg: '+10 crew for 50g' };
  }
  if (name === 'buy_cannon') {
    if (!np || np.port.rel !== 'friendly') return { ok: false, msg: 'No friendly port nearby' };
    if (p.gold < 150) return { ok: false, msg: 'Need 150g' };
    p.gold -= 150; p.cn++;
    addLog('Cannon acquired!', 'g');
    return { ok: true, msg: 'Cannon purchased for 150g. Now ' + p.cn + ' cannons' };
  }
  if (name === 'trade_buy') {
    if (!np) return { ok: false, msg: 'No port nearby' };
    const msg = buyGoods(p, np.port, String(cmd['good']), Number(cmd['qty'] ?? 5));
    addLog(msg, msg.includes('Bought') ? 'g' : 'r');
    return { ok: msg.includes('Bought'), msg };
  }
  if (name === 'trade_sell') {
    if (!np) return { ok: false, msg: 'No port nearby' };
    const msg = sellGoods(p, np.port, String(cmd['good']));
    addLog(msg, msg.includes('Sold') ? 'g' : 'r');
    return { ok: msg.includes('Sold'), msg };
  }
  if (name === 'upgrade') {
    if (!np || np.port.rel !== 'friendly') return { ok: false, msg: 'No friendly port nearby' };
    const opts = getUpgradeOptions(p);
    const idx = Number(cmd['index'] ?? 0);
    const opt = opts[idx];
    if (!opt) return { ok: false, msg: 'Invalid upgrade index' };
    if (!opt.canAfford) return { ok: false, msg: 'Cannot afford ' + opt.name };
    const msg = opt.action(); addLog(msg, 'g');
    return { ok: true, msg };
  }
  if (name === 'tribute') {
    if (!np || np.port.rel !== 'neutral') return { ok: false, msg: 'No neutral port nearby' };
    if (p.gold < 200) return { ok: false, msg: 'Need 200g' };
    p.gold -= 200; np.port.rel = 'friendly';
    addLog(np.port.name + ' now FRIENDLY!', 'g');
    return { ok: true, msg: np.port.name + ' is now friendly' };
  }
  if (name === 'attack_port') { return resolvePortAttack(gs, np); }
  if (name === 'sell_plunder') {
    const msg = sellPlunder(gs, np?.port ?? null);
    addLog(msg, msg.includes('No plunder') ? 'r' : 'g');
    return { ok: !msg.includes('No plunder'), msg };
  }

  if (name === 'loot' || name === 'capture' || name === 'board' || name === 'burn') {
    const en = findEnemy(gs, Number(cmd['enemyIndex'] ?? -1));
    if (!en) return { ok: false, msg: 'No disabled enemy at that index nearby' };
    return resolveEnemyAction(gs, en, name);
  }

  return { ok: false, msg: 'Unknown command: ' + name };
}
