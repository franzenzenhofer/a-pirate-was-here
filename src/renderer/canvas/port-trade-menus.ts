import type { PlayerShip, Port } from '../../core/types';
import { getTradeInfo, buyGoods, sellGoods } from '../../sim/economy/trade';
import { cargoCapacity } from '../../sim/state/fleet';
import { getUpgradeOptions } from '../../sim/economy/upgrade';
import type { LogFn } from './log';

function tradeLogType(msg: string): string {
  if (msg.includes('loss')) return 'o';
  if (msg.includes('Sold') || msg.includes('Bought')) return 'g';
  return 'r';
}

function mkBtn(parent: HTMLElement, lbl: string, cls: string, fn: () => void): void {
  const b = document.createElement('button');
  b.className = 'mb ' + cls;
  b.textContent = lbl;
  b.onclick = fn;
  parent.appendChild(b);
}

export function openTradeMenu(port: Port, player: PlayerShip, log: LogFn, onClose: () => void): void {
  const menu = document.getElementById('tmenu')!;
  document.getElementById('ttitle')!.textContent = '📦 TRADE — ' + port.name;
  const body = document.getElementById('tbody')!;
  const render = (): void => {
    body.innerHTML = '';
    const info = getTradeInfo(player, port);
    for (const item of info) {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;padding:2px 0;border-bottom:1px solid #223';
      const label = document.createElement('span');
      label.style.cssText = `color:${item.color};font-size:6px;font-family:inherit`;
      const profit = item.qty > 0 ? ` ${item.profitPerUnit >= 0 ? '+' : ''}${item.profitPerUnit}g` : '';
      label.textContent = `${item.name} ${item.tradePrice}g${profit}${item.qty > 0 ? ' (×' + item.qty + ')' : ''}`;
      row.appendChild(label);
      const btns = document.createElement('span');
      if (item.qty > 0) {
        const sell = document.createElement('button');
        sell.className = 'mb g';
        sell.style.cssText = 'width:auto;display:inline;padding:3px 6px;margin:0 2px;font-size:5px';
        sell.textContent = 'SELL';
        sell.onclick = () => { const msg = sellGoods(player, port, item.name); log(msg, tradeLogType(msg)); render(); };
        btns.appendChild(sell);
      }
      const buy = document.createElement('button');
      buy.className = 'mb y';
      buy.style.cssText = 'width:auto;display:inline;padding:3px 6px;margin:0 2px;font-size:5px';
      buy.textContent = 'BUY';
      buy.onclick = () => { const msg = buyGoods(player, port, item.name, 5); log(msg, tradeLogType(msg)); render(); };
      btns.appendChild(buy);
      row.appendChild(btns); body.appendChild(row);
    }
    const footer = document.createElement('div');
    footer.style.cssText = 'color:#f0c040;font-size:6px;margin-top:8px;text-align:center';
    const used = player.cargo.reduce((sum, item) => sum + item.qty, 0);
    footer.textContent = `💰 ${player.gold} GOLD · HOLD ${used}/${cargoCapacity(player)}`;
    body.appendChild(footer);
  };
  render();
  menu.style.display = 'block';
  document.getElementById('tclose')!.onclick = () => { menu.style.display = 'none'; onClose(); };
}

export function openUpgradeMenu(player: PlayerShip, log: LogFn, onClose: () => void): void {
  const menu = document.getElementById('tmenu')!;
  document.getElementById('ttitle')!.textContent = '🛠️ SHIPYARD UPGRADES';
  const body = document.getElementById('tbody')!;
  body.innerHTML = '';
  for (const opt of getUpgradeOptions(player)) {
    const cls = opt.canAfford ? 'g' : 'gr';
    mkBtn(body, `${opt.name} — ${opt.description}`, cls, () => {
      log(opt.canAfford ? opt.action() : 'Not enough gold!', opt.canAfford ? 'g' : 'r');
      menu.style.display = 'none'; onClose();
    });
  }
  const footer = document.createElement('div');
  footer.style.cssText = 'color:#f0c040;font-size:6px;margin-top:8px;text-align:center';
  footer.textContent = `💰 ${player.gold} GOLD`; body.appendChild(footer);
  menu.style.display = 'block';
  document.getElementById('tclose')!.onclick = () => { menu.style.display = 'none'; onClose(); };
}
