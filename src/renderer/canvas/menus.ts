import type { PlayerShip, EnemyShip, Port } from '../../core/types';
import { displaySailingFlag, displayShipName } from '../../core/ship-identity';
import { nationStyle } from '../../core/nation-style';
import { resolveBoarding } from '../../sim/combat/boarding';
import { acceptFlagCommission, getFlagCommission } from '../../sim/state/flags';
import { fleetRoleForShip } from '../../sim/state/fleet';
import { diplomacySummary, serviceProfile } from '../../sim/state/port-actions';
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
  onRumor: (p: Port) => void,
  onBuyLegend: (p: Port) => void,
  onDemandTribute: (p: Port) => void,
): void {
  const menu = document.getElementById('pmenu')!;
  document.getElementById('ptitle')!.textContent = `${nationStyle(p.nat).label} PORT · ${p.name} [${p.rel.toUpperCase()}]`;
  const body = document.getElementById('pbody')!;
  body.innerHTML = '';
  const close = () => { menu.style.display = 'none'; onClose(); };
  const raid = assessPortRaid(p, player.cn, player.hp, player.maxHp);
  const commission = getFlagCommission(player, p);
  const services = serviceProfile(p, player);
  const diplomacy = diplomacySummary(player, p);
  const raidLabel =
    `⚔️ RAID & LOOT — ${Math.round(raid.winChance * 100)}% WIN · ${raid.expectedGold}g NOW · ${raid.expectedPlunder}g BOOTY`;
  const info = document.createElement('div');
  info.style.cssText = 'color:#aac4ff;font-size:16px;line-height:1.6;margin-bottom:16px;padding:10px 12px;background:#091224;border-left:3px solid #4458aa';
  info.textContent = `${diplomacy.status}: ${diplomacy.detail}`;
  body.appendChild(info);
  if (services.tradeBonusText) {
    const bonus = document.createElement('div');
    bonus.style.cssText = 'color:#88ccff;font-size:16px;line-height:1.5;margin-bottom:16px';
    bonus.textContent = services.tradeBonusText;
    body.appendChild(bonus);
  }
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
    const rc = ~~(player.maxHp * 18 * services.repairFactor);
    const ra = ~~(player.maxHp * Math.min(0.85, services.repairFactor + 0.1));
    mkBtn(body, `⚓ REPAIR (-${rc}g, +${ra} HP)`, 'g', () => {
      if (player.gold >= rc) { player.gold -= rc; player.hp = Math.min(player.maxHp, player.hp + ra); log('⚓ Repaired at ' + p.name, 'g'); }
      else log('Not enough gold!', 'r'); close();
    });
    mkBtn(body, `👥 RECRUIT (${services.recruitCost}g → +${services.recruitCount} crew)`, 'g', () => {
      if (player.gold >= services.recruitCost) { player.gold -= services.recruitCost; player.crew = Math.min(250, player.crew + services.recruitCount); log(`+${services.recruitCount} crew`, 'g'); }
      else log('Not enough gold!', 'r'); close();
    });
    mkBtn(body, `🔫 BUY CANNON (${services.cannonCost}g)`, 'y', () => {
      if (player.gold >= services.cannonCost) { player.gold -= services.cannonCost; player.cn++; log('Cannon acquired!', 'g'); }
      else log('Not enough gold!', 'r'); close();
    });
    mkBtn(body, '📦 TRADE GOODS', 'b', () => { close(); onTrade(p); });
    mkBtn(body, '🛠️ UPGRADES', 'b', () => { close(); onUpgrade(p); });
    mkBtn(body, '🗺 BUY RUMOR', 'b', () => { onRumor(p); close(); });
    mkBtn(body, '🍻 BUY DRINKS FOR THE TOWN', 'g', () => { onBuyLegend(p); close(); });
    mkBtn(body, '💰 SELL PLUNDER', 'y', () => { onSellPlunder(p); close(); });
    if (commission) {
      mkBtn(body, `⚑ LETTER OF MARQUE — ${displaySailingFlag({ nat: p.nat })} (+${commission.reward}g)`, 'b', () => {
        log(acceptFlagCommission(player, p), 'g'); close();
      });
    }
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
    mkBtn(body, '🗺 BUY RUMOR', 'b', () => { onRumor(p); close(); });
    mkBtn(body, '🍻 BUY DRINKS FOR THE TOWN', 'g', () => { onBuyLegend(p); close(); });
    if (player.fame >= 1000) {
      mkBtn(body, '👑 DEMAND TRIBUTE', 'y', () => { onDemandTribute(p); close(); });
    }
    if (commission) {
      mkBtn(body, `⚑ LETTER OF MARQUE — ${displaySailingFlag({ nat: p.nat })} (+${commission.reward}g)`, 'b', () => {
        log(acceptFlagCommission(player, p), 'g'); close();
      });
    }
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
  randomValue: () => number,
  onDone: (
    en: EnemyShip,
    outcome: 'sunk' | 'captured' | 'released',
    action: 'loot' | 'capture' | 'board' | 'burn' | 'release',
  ) => void,
): void {
  if (en.sunk) return;
  const menu = document.getElementById('cmenu')!;
  document.getElementById('ctitle')!.textContent = '⚔️ ' + displayShipName(en) + ' DISABLED!';
  const body = document.getElementById('cbody')!;
  body.innerHTML = '';
  const close = () => { menu.style.display = 'none'; };

  mkBtn(body, `💰 LOOT & SINK (+${en.loot}g +${en.xp}fame)`, 'y', () => {
    player.gold += en.loot; player.kills++; player.fame += en.xp;
    en.sunk = true; onDone(en, 'sunk', 'loot'); log('💰 Looted ' + displayShipName(en) + ': +' + en.loot + 'g', 'g'); close();
  });
  mkBtn(body, `⚓ CLAIM PRIZE SHIP (+${~~(en.loot * 0.3)}g)`, 'g', () => {
    player.fleet.push({ tk: en.tk, name: en.name, role: fleetRoleForShip(en.tk) }); player.fame += en.xp * 4; player.gold += ~~(en.loot * 0.3);
    en.captured = true; en.disabled = false; log('⚓ ' + displayShipName(en) + ' joins fleet!', 'g');
    onDone(en, 'captured', 'capture'); close();
  });
  mkBtn(body, `⚔️ BOARD! (crew: ${player.crew})`, 'b', () => {
    const result = resolveBoarding(player, en, randomValue);
    player.crew = Math.max(1, player.crew - result.playerCrewLost);
    if (result.success) {
      player.gold += result.loot; player.fame += result.fame; player.kills++;
      en.sunk = true; onDone(en, 'sunk', 'board'); log('⚔️ ' + result.msg, 'g');
    } else { onDone(en, 'released', 'release'); log('⚔️ ' + result.msg, 'r'); }
    close();
  });
  mkBtn(body, `🔥 BURN IT (+${en.xp}fame)`, 'r', () => {
    player.fame += en.xp; en.sunk = true; onDone(en, 'sunk', 'burn'); close();
  });
  menu.style.display = 'block';
  document.getElementById('cclose')!.onclick = () => { onDone(en, 'released', 'release'); close(); };
}
