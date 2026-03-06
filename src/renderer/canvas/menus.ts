import type { PlayerShip, EnemyShip, Port } from '../../core/types';
import { NATION_FLAGS } from '../../config/ports';
import { getTradeInfo, buyGoods, sellGoods } from '../../sim/economy/trade';
import type { LogFn } from './log';

/** Create a menu button */
function mkBtn(parent: HTMLElement, lbl: string, cls: string, fn: () => void): void {
  const b = document.createElement('button');
  b.className = 'mb ' + cls;
  b.textContent = lbl;
  b.onclick = fn;
  parent.appendChild(b);
}

/** Open port interaction menu */
export function openPortMenu(
  p: Port,
  player: PlayerShip,
  log: LogFn,
  onClose: () => void,
  onAttack: (p: Port) => void,
  onTrade: (p: Port) => void,
): void {
  const menu = document.getElementById('pmenu')!;
  document.getElementById('ptitle')!.textContent = (NATION_FLAGS[p.nat] ?? '') + ' ' + p.name + ' [' + p.rel.toUpperCase() + ']';
  const body = document.getElementById('pbody')!;
  body.innerHTML = '';

  const close = () => { menu.style.display = 'none'; onClose(); };

  if (p.rel === 'friendly') {
    const repCost = ~~(player.maxHp * 18);
    const repAmt = ~~(player.maxHp * 0.6);
    mkBtn(body, `⚓ REPAIR (-${repCost}g, +${repAmt} HP)`, 'g', () => {
      if (player.gold >= repCost) { player.gold -= repCost; player.hp = Math.min(player.maxHp, player.hp + repAmt); log('⚓ Repaired at ' + p.name, 'g'); }
      else log('Not enough gold!', 'r');
      close();
    });
    mkBtn(body, '👥 RECRUIT (50g → +10 crew)', 'g', () => {
      if (player.gold >= 50) { player.gold -= 50; player.crew = Math.min(250, player.crew + 10); log('+10 crew', 'g'); }
      else log('Not enough gold!', 'r');
      close();
    });
    mkBtn(body, '🔫 BUY CANNON (150g each)', 'y', () => {
      if (player.gold >= 150) { player.gold -= 150; player.cn++; log('Cannon acquired!', 'g'); }
      else log('Not enough gold!', 'r');
      close();
    });
    mkBtn(body, '📦 TRADE GOODS', 'b', () => { close(); onTrade(p); });
    mkBtn(body, '💰 SELL PLUNDER (+gold)', 'y', () => {
      const b = 150 + ~~(Math.random() * 500);
      player.gold += b; log('Sold: +' + b + 'g', 'g'); close();
    });
    mkBtn(body, '⚔️ ATTACK THIS PORT', 'r', () => { close(); onAttack(p); });
  } else if (p.rel === 'neutral') {
    mkBtn(body, '🤝 PAY TRIBUTE (200g → friendly)', 'y', () => {
      if (player.gold >= 200) { player.gold -= 200; p.rel = 'friendly'; log(p.name + ' now FRIENDLY!', 'g'); }
      else log('Not enough gold!', 'r');
      close();
    });
    mkBtn(body, '⚓ EMERGENCY REPAIR (350g)', 'gr', () => {
      if (player.gold >= 350) { player.gold -= 350; player.hp = Math.min(player.maxHp, player.hp + 4); log('Emergency repairs', 'g'); }
      else log('Not enough gold!', 'r');
      close();
    });
    mkBtn(body, '📦 TRADE (higher prices)', 'b', () => { close(); onTrade(p); });
    mkBtn(body, '⚔️ RAID & LOOT', 'r', () => { close(); onAttack(p); });
  } else {
    mkBtn(body, `⚔️ ASSAULT! (${p.garrison} garrison)`, 'r', () => { close(); onAttack(p); });
    mkBtn(body, '💨 STAY CLEAR', 'gr', () => close());
  }

  menu.style.display = 'block';
  document.getElementById('pclose')!.onclick = close;
}

/** Open capture menu for disabled enemy */
export function openCaptureMenu(
  en: EnemyShip,
  player: PlayerShip,
  log: LogFn,
  onSunk: (en: EnemyShip) => void,
): void {
  if (en.sunk) return;
  const menu = document.getElementById('cmenu')!;
  document.getElementById('ctitle')!.textContent = '⚔️ ' + en.tk + ' DISABLED!';
  const body = document.getElementById('cbody')!;
  body.innerHTML = '';

  const close = () => { menu.style.display = 'none'; };

  mkBtn(body, `💰 LOOT & SINK (+${en.loot}g +${en.xp} fame)`, 'y', () => {
    player.gold += en.loot; player.kills++; player.fame += en.xp;
    en.sunk = true; onSunk(en);
    log('💰 Looted ' + en.tk + ': +' + en.loot + 'g', 'g');
    close();
  });

  mkBtn(body, `⚓ CLAIM PRIZE SHIP (fleet +${~~(en.loot * 0.3)}g)`, 'g', () => {
    player.fleet.push({ tk: en.tk }); player.fame += en.xp * 4; player.gold += ~~(en.loot * 0.3);
    en.sunk = true; log('⚓ ' + en.tk + ' joins fleet!', 'g');
    close();
  });

  mkBtn(body, `🔥 BURN IT (+${en.xp} fame)`, 'r', () => {
    player.fame += en.xp; en.sunk = true; onSunk(en);
    close();
  });

  menu.style.display = 'block';
  document.getElementById('cclose')!.onclick = close;
}

/** Open trade menu */
export function openTradeMenu(
  port: Port,
  player: PlayerShip,
  log: LogFn,
  onClose: () => void,
): void {
  const menu = document.getElementById('tmenu')!;
  document.getElementById('ttitle')!.textContent = '📦 TRADE — ' + port.name;
  const body = document.getElementById('tbody')!;

  function render(): void {
    body.innerHTML = '';
    const info = getTradeInfo(player, port);
    const priceMult = port.rel === 'neutral' ? 1.3 : 1.0;

    for (const item of info) {
      const price = ~~(item.portPrice * priceMult);
      const profitCol = item.profitPerUnit > 0 ? '#44ff88' : item.profitPerUnit < 0 ? '#ff5544' : '#888';
      const profitStr = item.qty > 0 ? ` [${item.profitPerUnit > 0 ? '+' : ''}${~~(item.profitPerUnit * priceMult)}/ea]` : '';

      const row = document.createElement('div');
      row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;padding:2px 0;border-bottom:1px solid #223';

      const label = document.createElement('span');
      label.style.cssText = `color:${item.color};font-size:6px;font-family:inherit`;
      label.textContent = `${item.name} ${price}g ${item.qty > 0 ? '(have ' + item.qty + ')' : ''}`;
      row.appendChild(label);

      const btns = document.createElement('span');
      if (item.qty > 0) {
        const sellBtn = document.createElement('button');
        sellBtn.className = 'mb g';
        sellBtn.style.cssText = 'width:auto;display:inline;padding:3px 6px;margin:0 2px;font-size:5px';
        sellBtn.textContent = 'SELL';
        sellBtn.onclick = () => { const msg = sellGoods(player, port, item.name); log(msg, msg.includes('profit') ? 'g' : 'o'); render(); };
        btns.appendChild(sellBtn);
      }

      const buyBtn = document.createElement('button');
      buyBtn.className = 'mb y';
      buyBtn.style.cssText = 'width:auto;display:inline;padding:3px 6px;margin:0 2px;font-size:5px';
      buyBtn.textContent = 'BUY 5';
      buyBtn.onclick = () => { const msg = buyGoods(player, port, item.name, 5); log(msg, msg.includes('Bought') ? 'g' : 'r'); render(); };
      btns.appendChild(buyBtn);

      row.appendChild(btns);
      body.appendChild(row);

      if (item.qty > 0) {
        const profEl = document.createElement('div');
        profEl.style.cssText = `color:${profitCol};font-size:5px;text-align:right;margin-bottom:2px`;
        profEl.textContent = profitStr;
        body.appendChild(profEl);
      }
    }

    const goldEl = document.createElement('div');
    goldEl.style.cssText = 'color:#f0c040;font-size:6px;margin-top:8px;text-align:center';
    goldEl.textContent = `💰 ${player.gold} GOLD`;
    body.appendChild(goldEl);
  }

  render();
  menu.style.display = 'block';
  document.getElementById('tclose')!.onclick = () => { menu.style.display = 'none'; onClose(); };
}
