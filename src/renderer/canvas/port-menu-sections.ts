import type { PlayerShip, Port } from '../../core/types';
import { displaySailingFlag } from '../../core/ship-identity';
import { acceptFlagCommission, getFlagCommission } from '../../sim/state/flags';
import { diplomacySummary, serviceProfile } from '../../sim/state/port-actions';
import { assessPortRaid } from '../../sim/state/progression';
import type { LogFn } from './log';
import { mkBtn } from './menu-button';
import { addFriendlyServices, completeIfAffordable, type FriendlyPortActions } from './port-menu-actions';

type RaidReport = ReturnType<typeof assessPortRaid>;
type ServiceProfile = ReturnType<typeof serviceProfile>;
type Commission = ReturnType<typeof getFlagCommission>;

export function appendPortSummary(
  body: HTMLElement,
  diplomacy: ReturnType<typeof diplomacySummary>,
  tradeBonusText: string | null,
): void {
  const info = document.createElement('div');
  info.style.cssText = 'color:#aac4ff;font-size:16px;line-height:1.6;margin-bottom:16px;padding:10px 12px;background:#091224;border-left:3px solid #4458aa';
  info.textContent = `${diplomacy.status}: ${diplomacy.detail}`;
  body.appendChild(info);
  if (!tradeBonusText) return;
  const bonus = document.createElement('div');
  bonus.style.cssText = 'color:#88ccff;font-size:16px;line-height:1.5;margin-bottom:16px';
  bonus.textContent = tradeBonusText;
  body.appendChild(bonus);
}

export function fillFriendlyPort(
  body: HTMLElement,
  port: Port,
  player: PlayerShip,
  raid: RaidReport,
  services: ServiceProfile,
  commission: Commission,
  log: LogFn,
  close: () => void,
  actions: FriendlyPortActions & { onAttack: (port: Port) => void },
): void {
  addFriendlyServices(body, port, player, services, log, close, actions);
  appendCommission(body, port, commission, player, log, close);
  appendRaidButton(body, port, raid, close, actions.onAttack);
}

export function fillNeutralPort(
  body: HTMLElement,
  port: Port,
  player: PlayerShip,
  raid: RaidReport,
  commission: Commission,
  log: LogFn,
  close: () => void,
  actions: NeutralPortActions,
): void {
  mkBtn(body, '🤝 PAY TRIBUTE (200g → friendly)', 'y', () => completeIfAffordable(player.gold >= 200, () => {
    player.gold -= 200;
    port.rel = 'friendly';
    log(port.name + ' now FRIENDLY!', 'g');
  }, log, close));
  mkBtn(body, '⚓ EMERGENCY REPAIR (350g)', 'gr', () => completeIfAffordable(player.gold >= 350, () => {
    player.gold -= 350;
    player.hp = Math.min(player.maxHp, player.hp + 4);
    log('Emergency repairs', 'g');
  }, log, close));
  mkBtn(body, '📦 TRADE (higher prices)', 'b', () => { close(); actions.onTrade(port); });
  mkBtn(body, '🗺 BUY RUMOR', 'b', () => { actions.onRumor(port); close(); });
  mkBtn(body, '🍻 BUY DRINKS FOR THE TOWN', 'g', () => { actions.onBuyLegend(port); close(); });
  if (player.fame >= 1000) mkBtn(body, '👑 DEMAND TRIBUTE', 'y', () => { actions.onDemandTribute(port); close(); });
  appendCommission(body, port, commission, player, log, close);
  appendRaidButton(body, port, raid, close, actions.onAttack);
}

export function fillHostilePort(
  body: HTMLElement,
  port: Port,
  raid: RaidReport,
  close: () => void,
  onAttack: (port: Port) => void,
): void {
  appendRaidButton(body, port, raid, close, onAttack);
  mkBtn(body, '💨 STAY CLEAR', 'gr', close);
}

interface NeutralPortActions {
  onAttack: (port: Port) => void;
  onTrade: (port: Port) => void;
  onRumor: (port: Port) => void;
  onBuyLegend: (port: Port) => void;
  onDemandTribute: (port: Port) => void;
}

function appendCommission(
  body: HTMLElement,
  port: Port,
  commission: Commission,
  player: PlayerShip,
  log: LogFn,
  close: () => void,
): void {
  if (!commission) return;
  mkBtn(body, `⚑ LETTER OF MARQUE — ${displaySailingFlag({ nat: port.nat })} (+${commission.reward}g)`, 'b', () => {
    log(acceptFlagCommission(player, port), 'g');
    close();
  });
}

function appendRaidButton(
  body: HTMLElement,
  port: Port,
  raid: RaidReport,
  close: () => void,
  onAttack: (port: Port) => void,
): void {
  const label = `⚔️ RAID & LOOT — ${Math.round(raid.winChance * 100)}% WIN · ${raid.expectedGold}g NOW · ${raid.expectedPlunder}g BOOTY`;
  mkBtn(body, label, raid.winChance < 0.35 ? 'r' : 'y', () => {
    if (raid.winChance < 0.35 && !window.confirm(`${port.name} is a ${raid.rating.toLowerCase()} raid.\nOnly ${Math.round(raid.winChance * 100)}% win chance.\nLikely counter-damage: ${raid.counterDamage} HP.\n\nAttack anyway?`)) return;
    close();
    onAttack(port);
  });
}
