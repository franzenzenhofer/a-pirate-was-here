import type { GameState } from '../sim/state/game-state';
import type { Camera } from '../renderer/camera';
import { followTarget } from '../renderer/camera';
import { buyGoods, sellGoods } from '../sim/economy/trade';
import { getUpgradeOptions } from '../sim/economy/upgrade';
import { resolveBoarding } from '../sim/combat/boarding';
import { portUnderAttack } from '../sim/state/progression';
import { createExplosion } from '../sim/combat/damage';
import { addLog } from '../renderer/canvas/log';
import { nearestPort, findEnemy } from './game-actions-available';
import { addPlunder, sellPlunder } from '../sim/economy/plunder';
import { increaseInfamy } from '../sim/state/reputation';

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
  if (name === 'attack_port') { return attackPort(gs, np); }
  if (name === 'sell_plunder') {
    const msg = sellPlunder(gs, np?.port ?? null);
    addLog(msg, msg.includes('No plunder') ? 'r' : 'g');
    return { ok: !msg.includes('No plunder'), msg };
  }

  if (name === 'loot' || name === 'capture' || name === 'board' || name === 'burn') {
    const en = findEnemy(gs, Number(cmd['enemyIndex'] ?? -1));
    if (!en) return { ok: false, msg: 'No disabled enemy at that index nearby' };
    return handleEnemyAction(gs, en, name);
  }

  return { ok: false, msg: 'Unknown command: ' + name };
}

function attackPort(
  gs: GameState, np: ReturnType<typeof nearestPort>,
): { ok: boolean; msg: string } {
  if (!np) return { ok: false, msg: 'No port nearby' };
  const p = gs.player;
  const result = portUnderAttack(np.port, p.cn, p.hp, p.maxHp, 'PIRATE');
  if (result.success) {
    const instantGold = ~~(np.port.wealth * 0.2);
    p.gold += instantGold; p.fame += 60; p.kills++;
    addPlunder(gs, 'Port Booty', Math.max(120, ~~(np.port.wealth * 0.8)), np.port.name, 1);
    increaseInfamy(gs, 12, np.port.nat);
    gs.particles.push(...createExplosion(np.port.x, np.port.y, '#ff4400', 20));
    addLog(result.msg + ` +${instantGold}g now, plunder stored for sale.`, 'g');
  } else {
    const dmg = 2 + ~~(Math.random() * 6); p.hp = Math.max(1, p.hp - dmg);
    addLog('REPELLED! -' + dmg + ' HP', 'r');
  }
  return { ok: result.success, msg: result.msg };
}

function handleEnemyAction(
  gs: GameState, en: typeof gs.enemies[0], action: string,
): { ok: boolean; msg: string } {
  const p = gs.player;
  if (action === 'loot') {
    p.gold += en.loot; p.kills++; p.fame += en.xp; en.sunk = true;
    gs.particles.push(...createExplosion(en.x, en.y, '#ff6622', 20));
    addLog('Looted ' + en.tk + ': +' + en.loot + 'g', 'g');
    return { ok: true, msg: 'Looted +' + en.loot + 'g +' + en.xp + 'fame' };
  }
  if (action === 'capture') {
    p.fleet.push({ tk: en.tk }); p.fame += en.xp * 4; p.gold += ~~(en.loot * 0.3); en.sunk = true;
    addLog(en.tk + ' joins fleet!', 'g');
    return { ok: true, msg: en.tk + ' captured. Fleet: ' + p.fleet.length };
  }
  if (action === 'board') {
    const r = resolveBoarding(p, en);
    p.crew = Math.max(1, p.crew - r.playerCrewLost);
    if (r.success) { p.gold += r.loot; p.fame += r.fame; p.kills++; en.sunk = true;
      gs.particles.push(...createExplosion(en.x, en.y, '#ff6622', 20)); }
    addLog(r.msg, r.success ? 'g' : 'r');
    return { ok: r.success, msg: r.msg };
  }
  if (action === 'burn') {
    p.fame += en.xp; en.sunk = true;
    gs.particles.push(...createExplosion(en.x, en.y, '#ff6622', 20));
    return { ok: true, msg: en.tk + ' burned. +' + en.xp + ' fame' };
  }
  return { ok: false, msg: 'Unknown action' };
}
