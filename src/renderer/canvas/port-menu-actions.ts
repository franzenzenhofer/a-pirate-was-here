import type { PlayerShip, Port } from '../../core/types';
import { crewWagesPerDay } from '../../config/economy';
import type { LogFn } from './log';
import { mkBtn } from './menu-button';

export interface FriendlyPortActions {
  onTrade: (port: Port) => void;
  onUpgrade: (port: Port) => void;
  onSellPlunder: (port: Port) => void;
  onRumor: (port: Port) => void;
  onBuyLegend: (port: Port) => void;
}

export function addFriendlyServices(
  body: HTMLElement,
  port: Port,
  player: PlayerShip,
  services: {
    repairFactor: number;
    recruitCost: number;
    recruitCount: number;
    cannonCost: number;
  },
  log: LogFn,
  close: () => void,
  actions: FriendlyPortActions,
): void {
  const repairCost = ~~(player.maxHp * 18 * services.repairFactor);
  const repairAmount = ~~(player.maxHp * Math.min(0.85, services.repairFactor + 0.1));
  mkBtn(body, `⚓ REPAIR (-${repairCost}g, +${repairAmount} HP)`, 'g', () => completeIfAffordable(player.gold >= repairCost, () => {
    player.gold -= repairCost;
    player.hp = Math.min(player.maxHp, player.hp + repairAmount);
    log('⚓ Repaired at ' + port.name, 'g');
  }, log, close));
  mkBtn(body, `👥 RECRUIT (${services.recruitCost}g → +${services.recruitCount} crew)`, 'g', () => completeIfAffordable(player.gold >= services.recruitCost, () => {
    player.gold -= services.recruitCost;
    player.crew = Math.min(250, player.crew + services.recruitCount);
    log(`+${services.recruitCount} crew`, 'g');
  }, log, close));
  mkBtn(body, `🔫 BUY CANNON (${services.cannonCost}g)`, 'y', () => completeIfAffordable(player.gold >= services.cannonCost, () => {
    player.gold -= services.cannonCost;
    player.cn++;
    log('Cannon acquired!', 'g');
  }, log, close));
  mkBtn(body, '📦 TRADE GOODS', 'b', () => { close(); actions.onTrade(port); });
  mkBtn(body, '🛠️ UPGRADES', 'b', () => { close(); actions.onUpgrade(port); });
  mkBtn(body, `👋 RELEASE 10 CREW (save ${crewWagesPerDay(10)}/day)`, player.crew > 10 ? 'b' : 'gr', () => completeAction(player.crew > 10, 'You need at least 10 crew to keep the ship working.', () => {
    player.crew = Math.max(10, player.crew - 10);
    log('10 crew took shore leave. Wages ease for now.', 'o');
  }, log, close));
  mkBtn(body, '🗺 BUY RUMOR', 'b', () => { actions.onRumor(port); close(); });
  mkBtn(body, '🍻 BUY DRINKS FOR THE TOWN', 'g', () => { actions.onBuyLegend(port); close(); });
  mkBtn(body, '💰 SELL PLUNDER', 'y', () => { actions.onSellPlunder(port); close(); });
}

export function completeIfAffordable(canAfford: boolean, action: () => void, log: LogFn, close: () => void): void {
  completeAction(canAfford, 'Not enough gold!', action, log, close);
}

function completeAction(
  canProceed: boolean,
  failMessage: string,
  action: () => void,
  log: LogFn,
  close: () => void,
): void {
  if (canProceed) action();
  else log(failMessage, 'r');
  close();
}
