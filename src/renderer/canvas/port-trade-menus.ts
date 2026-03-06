import type { PlayerShip, Port } from '../../core/types';
import { getTradeInfo, buyGoods, sellGoods } from '../../sim/economy/trade';
import { cargoCapacity } from '../../sim/state/fleet';
import { getUpgradeOptions } from '../../sim/economy/upgrade';
import type { LogFn } from './log';

const MENU_FONT = 16;
const MENU_BUTTON_FONT = 16;

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
    const used = player.cargo.reduce((sum, item) => sum + item.qty, 0);
    const free = Math.max(0, cargoCapacity(player) - used);
    for (const item of info) {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:10px;padding:8px 0;border-bottom:1px solid #223';
      const label = document.createElement('span');
      label.style.cssText = `color:${item.color};font-size:${MENU_FONT}px;font-family:inherit;line-height:1.5`;
      const buyDelta = `BUY 5: -${item.tradePrice * 5}g`;
      const sellDelta = item.qty > 0
        ? `SELL: +${item.tradePrice * item.qty}g (${item.profitPerUnit >= 0 ? '+' : ''}${item.profitPerUnit}g/unit)`
        : `SELL: none aboard`;
      label.textContent =
        `${item.name} ${item.tradePrice}g${item.qty > 0 ? ' · HOLD ×' + item.qty : ''}\n${buyDelta}\n${sellDelta}`;
      label.style.whiteSpace = 'pre-line';
      if (item.qty > 0 && item.profitPerUnit < 0) label.style.color = '#ff8888';
      row.appendChild(label);
      const btns = document.createElement('span');
      if (item.qty > 0) {
        const sell = document.createElement('button');
        sell.className = 'mb ' + (item.profitPerUnit >= 0 ? 'g' : 'r');
        sell.style.cssText = `width:auto;display:inline;padding:8px 12px;margin:0 2px;font-size:${MENU_BUTTON_FONT}px`;
        sell.textContent = item.profitPerUnit >= 0 ? 'SELL +' : 'SELL LOSS';
        sell.onclick = () => { const msg = sellGoods(player, port, item.name); log(msg, tradeLogType(msg)); render(); };
        btns.appendChild(sell);
      }
      const buy = document.createElement('button');
      buy.className = 'mb ' + (free >= 5 ? 'y' : 'gr');
      buy.style.cssText = `width:auto;display:inline;padding:8px 12px;margin:0 2px;font-size:${MENU_BUTTON_FONT}px`;
      buy.textContent = free >= 5 ? 'BUY 5' : 'HOLD FULL';
      buy.onclick = () => { const msg = buyGoods(player, port, item.name, 5); log(msg, tradeLogType(msg)); render(); };
      btns.appendChild(buy);
      row.appendChild(btns); body.appendChild(row);
    }
    const footer = document.createElement('div');
    footer.style.cssText = `color:#f0c040;font-size:${MENU_FONT}px;margin-top:14px;text-align:center`;
    footer.textContent = `💰 ${player.gold} GOLD · HOLD ${used}/${cargoCapacity(player)} · FREE ${free}`;
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
  footer.style.cssText = `color:#f0c040;font-size:${MENU_FONT}px;margin-top:14px;text-align:center`;
  footer.textContent = `💰 ${player.gold} GOLD`; body.appendChild(footer);
  menu.style.display = 'block';
  document.getElementById('tclose')!.onclick = () => { menu.style.display = 'none'; onClose(); };
}
