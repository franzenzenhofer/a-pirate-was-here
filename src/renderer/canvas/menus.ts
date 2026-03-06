import type { PlayerShip, EnemyShip, Port } from '../../core/types';
import { NATION_FLAGS } from '../../config/ports';
import { getTradeInfo, buyGoods, sellGoods } from '../../sim/economy/trade';
import { getUpgradeOptions } from '../../sim/economy/upgrade';
import { resolveBoarding } from '../../sim/combat/boarding';
import type { LogFn } from './log';

function mkBtn(parent: HTMLElement, lbl: string, cls: string, fn: () => void): void {
  const b = document.createElement('button');
  b.className = 'mb ' + cls;
  b.textContent = lbl;
  b.onclick = fn;
  parent.appendChild(b);
}

export function openPortMenu(
  p: Port, player: PlayerShip, log: LogFn,
  onClose: () => void, onAttack: (p: Port) => void,
  onTrade: (p: Port) => void, onUpgrade: (p: Port) => void,
): void {
  const menu = document.getElementById('pmenu')!;
  document.getElementById('ptitle')!.textContent = (NATION_FLAGS[p.nat] ?? '') + ' ' + p.name + ' [' + p.rel.toUpperCase() + ']';
  const body = document.getElementById('pbody')!;
  body.innerHTML = '';
  const close = () => { menu.style.display = 'none'; onClose(); };

  if (p.rel === 'friendly') {
    const rc = ~~(player.maxHp * 18), ra = ~~(player.maxHp * 0.6);
    mkBtn(body, `⚓ REPAIR (-${rc}g, +${ra} HP)`, 'g', () => {
      if (player.gold >= rc) { player.gold -= rc; player.hp = Math.min(player.maxHp, player.hp + ra); log('⚓ Repaired at ' + p.name, 'g'); }
      else log('Not enough gold!', 'r'); close();
    });
    mkBtn(body, '👥 RECRUIT (50g → +10 crew)', 'g', () => {
      if (player.gold >= 50) { player.gold -= 50; player.crew = Math.min(250, player.crew + 10); log('+10 crew', 'g'); }
      else log('Not enough gold!', 'r'); close();
    });
    mkBtn(body, '🔫 BUY CANNON (150g)', 'y', () => {
      if (player.gold >= 150) { player.gold -= 150; player.cn++; log('Cannon acquired!', 'g'); }
      else log('Not enough gold!', 'r'); close();
    });
    mkBtn(body, '📦 TRADE GOODS', 'b', () => { close(); onTrade(p); });
    mkBtn(body, '🛠️ UPGRADES', 'b', () => { close(); onUpgrade(p); });
    mkBtn(body, '💰 SELL PLUNDER', 'y', () => { const b = 150 + ~~(Math.random() * 500); player.gold += b; log('Sold: +' + b + 'g', 'g'); close(); });
    mkBtn(body, '⚔️ ATTACK PORT', 'r', () => { close(); onAttack(p); });
  } else if (p.rel === 'neutral') {
    mkBtn(body, '🤝 PAY TRIBUTE (200g → friendly)', 'y', () => {
      if (player.gold >= 200) { player.gold -= 200; p.rel = 'friendly'; log(p.name + ' now FRIENDLY!', 'g'); }
      else log('Not enough gold!', 'r'); close();
    });
    mkBtn(body, '⚓ EMERGENCY REPAIR (350g)', 'gr', () => {
      if (player.gold >= 350) { player.gold -= 350; player.hp = Math.min(player.maxHp, player.hp + 4); log('Emergency repairs', 'g'); }
      else log('Not enough gold!', 'r'); close();
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

export function openCaptureMenu(
  en: EnemyShip, player: PlayerShip, log: LogFn, onSunk: (en: EnemyShip) => void,
): void {
  if (en.sunk) return;
  const menu = document.getElementById('cmenu')!;
  document.getElementById('ctitle')!.textContent = '⚔️ ' + en.tk + ' DISABLED!';
  const body = document.getElementById('cbody')!;
  body.innerHTML = '';
  const close = () => { menu.style.display = 'none'; };

  mkBtn(body, `💰 LOOT & SINK (+${en.loot}g +${en.xp}fame)`, 'y', () => {
    player.gold += en.loot; player.kills++; player.fame += en.xp;
    en.sunk = true; onSunk(en); log('💰 Looted ' + en.tk + ': +' + en.loot + 'g', 'g'); close();
  });
  mkBtn(body, `⚓ CLAIM PRIZE SHIP (+${~~(en.loot * 0.3)}g)`, 'g', () => {
    player.fleet.push({ tk: en.tk }); player.fame += en.xp * 4; player.gold += ~~(en.loot * 0.3);
    en.sunk = true; log('⚓ ' + en.tk + ' joins fleet!', 'g'); close();
  });
  mkBtn(body, `⚔️ BOARD! (crew: ${player.crew})`, 'b', () => {
    const result = resolveBoarding(player, en);
    player.crew = Math.max(1, player.crew - result.playerCrewLost);
    if (result.success) {
      player.gold += result.loot; player.fame += result.fame; player.kills++;
      en.sunk = true; onSunk(en); log('⚔️ ' + result.msg, 'g');
    } else { log('⚔️ ' + result.msg, 'r'); }
    close();
  });
  mkBtn(body, `🔥 BURN IT (+${en.xp}fame)`, 'r', () => {
    player.fame += en.xp; en.sunk = true; onSunk(en); close();
  });
  menu.style.display = 'block';
  document.getElementById('cclose')!.onclick = close;
}

export function openTradeMenu(port: Port, player: PlayerShip, log: LogFn, onClose: () => void): void {
  const menu = document.getElementById('tmenu')!;
  document.getElementById('ttitle')!.textContent = '📦 TRADE — ' + port.name;
  const body = document.getElementById('tbody')!;
  function render(): void {
    body.innerHTML = '';
    const info = getTradeInfo(player, port);
    const mult = port.rel === 'neutral' ? 1.3 : 1.0;
    for (const item of info) {
      const price = ~~(item.portPrice * mult);
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;padding:2px 0;border-bottom:1px solid #223';
      const label = document.createElement('span');
      label.style.cssText = `color:${item.color};font-size:6px;font-family:inherit`;
      label.textContent = `${item.name} ${price}g ${item.qty > 0 ? '(×' + item.qty + ')' : ''}`;
      row.appendChild(label);
      const btns = document.createElement('span');
      if (item.qty > 0) {
        const sb = document.createElement('button'); sb.className = 'mb g';
        sb.style.cssText = 'width:auto;display:inline;padding:3px 6px;margin:0 2px;font-size:5px';
        sb.textContent = 'SELL'; sb.onclick = () => { log(sellGoods(player, port, item.name), 'g'); render(); };
        btns.appendChild(sb);
      }
      const bb = document.createElement('button'); bb.className = 'mb y';
      bb.style.cssText = 'width:auto;display:inline;padding:3px 6px;margin:0 2px;font-size:5px';
      bb.textContent = 'BUY'; bb.onclick = () => { const m = buyGoods(player, port, item.name, 5); log(m, m.includes('Bought') ? 'g' : 'r'); render(); };
      btns.appendChild(bb);
      row.appendChild(btns); body.appendChild(row);
    }
    const g = document.createElement('div');
    g.style.cssText = 'color:#f0c040;font-size:6px;margin-top:8px;text-align:center';
    g.textContent = `💰 ${player.gold} GOLD`; body.appendChild(g);
  }
  render();
  menu.style.display = 'block';
  document.getElementById('tclose')!.onclick = () => { menu.style.display = 'none'; onClose(); };
}

export function openUpgradeMenu(player: PlayerShip, log: LogFn, onClose: () => void): void {
  const menu = document.getElementById('tmenu')!;
  document.getElementById('ttitle')!.textContent = '🛠️ SHIPYARD UPGRADES';
  const body = document.getElementById('tbody')!;
  body.innerHTML = '';
  const opts = getUpgradeOptions(player);
  for (const opt of opts) {
    const cls = opt.canAfford ? 'g' : 'gr';
    mkBtn(body, `${opt.name} — ${opt.description}`, cls, () => {
      if (opt.canAfford) { const msg = opt.action(); log(msg, 'g'); }
      else log('Not enough gold!', 'r');
      menu.style.display = 'none'; onClose();
    });
  }
  const g = document.createElement('div');
  g.style.cssText = 'color:#f0c040;font-size:6px;margin-top:8px;text-align:center';
  g.textContent = `💰 ${player.gold} GOLD`; body.appendChild(g);
  menu.style.display = 'block';
  document.getElementById('tclose')!.onclick = () => { menu.style.display = 'none'; onClose(); };
}
