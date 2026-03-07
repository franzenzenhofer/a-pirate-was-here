import type { PlayerShip, Port } from '../../core/types';
import { nationStyle } from '../../core/nation-style';
import { getFlagCommission } from '../../sim/state/flags';
import { diplomacySummary, serviceProfile } from '../../sim/state/port-actions';
import { assessPortRaid } from '../../sim/state/progression';
import type { LogFn } from './log';
import { appendPortSummary, fillFriendlyPort, fillHostilePort, fillNeutralPort } from './port-menu-sections';

export function openPortMenu(
  port: Port,
  player: PlayerShip,
  log: LogFn,
  onClose: () => void,
  onAttack: (port: Port) => void,
  onTrade: (port: Port) => void,
  onUpgrade: (port: Port) => void,
  onSellPlunder: (port: Port) => void,
  onRumor: (port: Port) => void,
  onBuyLegend: (port: Port) => void,
  onDemandTribute: (port: Port) => void,
): void {
  const menu = document.getElementById('pmenu')!;
  document.getElementById('ptitle')!.textContent = `${nationStyle(port.nat).label} PORT · ${port.name} [${port.rel.toUpperCase()}]`;
  const body = document.getElementById('pbody')!;
  body.innerHTML = '';
  const close = (): void => { menu.style.display = 'none'; onClose(); };
  const raid = assessPortRaid(port, player.cn, player.hp, player.maxHp);
  const commission = getFlagCommission(player, port);
  const services = serviceProfile(port, player);
  const diplomacy = diplomacySummary(player, port);
  appendPortSummary(body, diplomacy, services.tradeBonusText);

  if (port.rel === 'friendly') {
    fillFriendlyPort(body, port, player, raid, services, commission, log, close, {
      onAttack,
      onTrade,
      onUpgrade,
      onSellPlunder,
      onRumor,
      onBuyLegend,
    });
  } else if (port.rel === 'neutral') {
    fillNeutralPort(body, port, player, raid, commission, log, close, {
      onAttack,
      onTrade,
      onRumor,
      onBuyLegend,
      onDemandTribute,
    });
  }
  else fillHostilePort(body, port, raid, close, onAttack);

  menu.style.display = 'block';
  document.getElementById('pclose')!.onclick = close;
}
