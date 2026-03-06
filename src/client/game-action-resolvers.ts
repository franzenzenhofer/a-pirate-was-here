import { resolveBoarding } from '../sim/combat/boarding';
import { createExplosion } from '../sim/combat/damage';
import { addPlunder } from '../sim/economy/plunder';
import { increaseInfamy } from '../sim/state/reputation';
import { portUnderAttack } from '../sim/state/progression';
import type { GameState } from '../sim/state/game-state';
import { addLog } from '../renderer/canvas/log';
import { resolveLegendaryVictory } from '../sim/state/objectives';
import { nearestPort } from './game-actions-available';

export function resolvePortAttack(
  gs: GameState,
  np: ReturnType<typeof nearestPort>,
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

export function resolveEnemyAction(
  gs: GameState,
  en: typeof gs.enemies[0],
  action: string,
): { ok: boolean; msg: string } {
  const p = gs.player;
  if (action === 'loot') {
    p.gold += en.loot; p.kills++; p.fame += en.xp; en.sunk = true;
    gs.particles.push(...createExplosion(en.x, en.y, '#ff6622', 20));
    resolveLegendaryVictory(gs, en.tk);
    addLog('Looted ' + en.tk + ': +' + en.loot + 'g', 'g');
    return { ok: true, msg: 'Looted +' + en.loot + 'g +' + en.xp + 'fame' };
  }
  if (action === 'capture') {
    p.fleet.push({ tk: en.tk }); p.fame += en.xp * 4; p.gold += ~~(en.loot * 0.3); en.sunk = true;
    resolveLegendaryVictory(gs, en.tk);
    addLog(en.tk + ' joins fleet!', 'g');
    return { ok: true, msg: en.tk + ' captured. Fleet: ' + p.fleet.length };
  }
  if (action === 'board') {
    const r = resolveBoarding(p, en);
    p.crew = Math.max(1, p.crew - r.playerCrewLost);
    if (r.success) {
      p.gold += r.loot; p.fame += r.fame; p.kills++; en.sunk = true;
      gs.particles.push(...createExplosion(en.x, en.y, '#ff6622', 20));
      resolveLegendaryVictory(gs, en.tk);
    }
    addLog(r.msg, r.success ? 'g' : 'r');
    return { ok: r.success, msg: r.msg };
  }
  if (action === 'burn') {
    p.fame += en.xp; en.sunk = true;
    gs.particles.push(...createExplosion(en.x, en.y, '#ff6622', 20));
    resolveLegendaryVictory(gs, en.tk);
    return { ok: true, msg: en.tk + ' burned. +' + en.xp + ' fame' };
  }
  return { ok: false, msg: 'Unknown action' };
}
