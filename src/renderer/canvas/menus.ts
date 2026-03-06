import type { PlayerShip, EnemyShip, Port } from '../../core/types';
import { NATION_FLAGS } from '../../config/ports';
import { resolveBoarding } from '../../sim/combat/boarding';
import { assessPortRaid } from '../../sim/state/progression';
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
  onSellPlunder: (p: Port) => void,
): void {
  const menu = document.getElementById('pmenu')!;
  document.getElementById('ptitle')!.textContent = (NATION_FLAGS[p.nat] ?? '') + ' ' + p.name + ' [' + p.rel.toUpperCase() + ']';
  const body = document.getElementById('pbody')!;
  body.innerHTML = '';
  const close = () => { menu.style.display = 'none'; onClose(); };
  const raid = assessPortRaid(p, player.cn, player.hp, player.maxHp);
  const raidLabel =
    `⚔️ RAID & LOOT — ${Math.round(raid.winChance * 100)}% WIN · ${raid.expectedGold}g NOW · ${raid.expectedPlunder}g BOOTY`;
  const tryRaid = (): void => {
    if (raid.winChance < 0.35) {
      const proceed = window.confirm(
        `${p.name} is a ${raid.rating.toLowerCase()} raid.\n` +
        `Only ${Math.round(raid.winChance * 100)}% win chance.\n` +
        `Likely counter-damage: ${raid.counterDamage} HP.\n\nAttack anyway?`,
      );
      if (!proceed) return;
    }
    close();
    onAttack(p);
  };

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
    mkBtn(body, '💰 SELL PLUNDER', 'y', () => { onSellPlunder(p); close(); });
    mkBtn(body, raidLabel, raid.winChance < 0.35 ? 'r' : 'y', tryRaid);
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
    mkBtn(body, raidLabel, raid.winChance < 0.35 ? 'r' : 'y', tryRaid);
  } else {
    mkBtn(body, raidLabel, raid.winChance < 0.35 ? 'r' : 'y', tryRaid);
    mkBtn(body, '💨 STAY CLEAR', 'gr', () => close());
  }
  menu.style.display = 'block';
  document.getElementById('pclose')!.onclick = close;
}

export function openCaptureMenu(
  en: EnemyShip,
  player: PlayerShip,
  log: LogFn,
  onDone: (en: EnemyShip, outcome: 'sunk' | 'captured' | 'released') => void,
): void {
  if (en.sunk) return;
  const menu = document.getElementById('cmenu')!;
  document.getElementById('ctitle')!.textContent = '⚔️ ' + en.tk + ' DISABLED!';
  const body = document.getElementById('cbody')!;
  body.innerHTML = '';
  const close = () => { menu.style.display = 'none'; };

  mkBtn(body, `💰 LOOT & SINK (+${en.loot}g +${en.xp}fame)`, 'y', () => {
    player.gold += en.loot; player.kills++; player.fame += en.xp;
    en.sunk = true; onDone(en, 'sunk'); log('💰 Looted ' + en.tk + ': +' + en.loot + 'g', 'g'); close();
  });
  mkBtn(body, `⚓ CLAIM PRIZE SHIP (+${~~(en.loot * 0.3)}g)`, 'g', () => {
    player.fleet.push({ tk: en.tk }); player.fame += en.xp * 4; player.gold += ~~(en.loot * 0.3);
    en.captured = true; en.disabled = false; log('⚓ ' + en.tk + ' joins fleet!', 'g');
    onDone(en, 'captured'); close();
  });
  mkBtn(body, `⚔️ BOARD! (crew: ${player.crew})`, 'b', () => {
    const result = resolveBoarding(player, en);
    player.crew = Math.max(1, player.crew - result.playerCrewLost);
    if (result.success) {
      player.gold += result.loot; player.fame += result.fame; player.kills++;
      en.sunk = true; onDone(en, 'sunk'); log('⚔️ ' + result.msg, 'g');
    } else { onDone(en, 'released'); log('⚔️ ' + result.msg, 'r'); }
    close();
  });
  mkBtn(body, `🔥 BURN IT (+${en.xp}fame)`, 'r', () => {
    player.fame += en.xp; en.sunk = true; onDone(en, 'sunk'); close();
  });
  menu.style.display = 'block';
  document.getElementById('cclose')!.onclick = () => { onDone(en, 'released'); close(); };
}
