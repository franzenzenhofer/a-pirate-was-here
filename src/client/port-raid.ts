import { addLog } from '../renderer/canvas/log';
import { createExplosion } from '../sim/combat/damage';
import { addPlunder } from '../sim/economy/plunder';
import type { GameState } from '../sim/state/game-state';
import { increaseInfamy } from '../sim/state/reputation';
import { assessPortRaid, portUnderAttack } from '../sim/state/progression';
import { nextRandom } from '../sim/state/random';

export function attackPort(gs: GameState, port: GameState['ports'][number]): void {
  addLog('ATTACKING ' + port.name + '!', 'r');
  const defendingNation = port.nat;
  const raid = assessPortRaid(port, gs.player.cn, gs.player.hp, gs.player.maxHp);
  const result = portUnderAttack(port, gs.player.cn, gs.player.hp, gs.player.maxHp, 'PIRATE', nextRandom(gs));

  if (result.success) {
    const instantGold = raid.expectedGold;
    gs.player.gold += instantGold;
    gs.player.fame += 60;
    gs.player.kills++;
    addPlunder(gs, 'Port Booty', raid.expectedPlunder, port.name, 1);
    increaseInfamy(gs, 12, defendingNation);
    gs.particles.push(...createExplosion(port.x, port.y, '#ff4400', 20));
    addLog('VICTORY! ' + result.msg + ` +${instantGold}g`, 'g');
    return;
  }
  const damage = raid.counterDamage + ~~(nextRandom(gs) * 3);
  gs.player.hp = Math.max(1, gs.player.hp - damage);
  addLog(`REPELLED! -${damage} HP`, 'r');
}
