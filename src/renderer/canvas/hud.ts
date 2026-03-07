import { displaySailingFlag, displayShipFlag, displayShipName, shipNationStyle } from '../../core/ship-identity';
import type { PlayerShip } from '../../core/types';
import { windDirStr, windStrBar } from '../../sim/nav/wind';
import type { WindState } from '../../sim/nav/wind';
import { fleetOrderLabel } from '../../sim/state/fleet';
import { moraleLabel } from '../../sim/state/morale';
import { totalSpecialists } from '../../sim/state/specialists';
import type { MoraleState } from '../../sim/state/morale';

/** Update all HUD DOM elements */
export function updateHUD(player: PlayerShip, era: number, wind: WindState, morale: MoraleState): void {
  setText('snEl', displayShipName(player));
  setText('sfBadge', displayShipFlag(player));
  setText('sfEl', displaySailingFlag(player));
  setText('gEl', String(player.gold));
  setText('cEl', String(player.crew));
  setText('dEl', String(player.day));
  setText('fEl', String(player.fame));
  setText('kEl', String(player.kills));
  setText('flEl', String(1 + player.fleet.length));
  setText('cnEl', String(player.cn));
  setText('eraEl', ['I', 'II', 'III', 'IV', 'V'][Math.min(era, 4)] ?? 'I');
  setText('wdEl', windDirStr(wind.angle));
  setText('wsEl', windStrBar(wind.strength));
  setText('moraleEl', moraleLabel(morale.value));
  setText('foEl', fleetOrderLabel(player.fleetOrder));
  setText('specEl', String(totalSpecialists(player.specialists)));
  applyFlagBadge(player);

  updateHealthBar(player.hp, player.maxHp);
}

function setText(id: string, text: string): void {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function applyFlagBadge(player: Pick<PlayerShip, 'flag' | 'nat'>): void {
  const badge = document.getElementById('sfBadge');
  if (!badge) return;
  const style = shipNationStyle(player);
  badge.setAttribute('data-nation', style.code);
  badge.style.backgroundColor = style.primary;
  badge.style.borderColor = style.accent;
  badge.style.color = style.text;
}

let lastHp = -1;
let lastMaxHp = -1;

function updateHealthBar(hp: number, maxHp: number): void {
  if (hp === lastHp && maxHp === lastMaxHp) return;
  lastHp = hp; lastMaxHp = maxHp;
  const bar = document.getElementById('hpbar');
  if (!bar) return;
  while (bar.firstChild) bar.removeChild(bar.firstChild);
  for (let i = 0; i < maxHp; i++) {
    const s = document.createElement('div');
    const isFilled = i < hp;
    const isLow = hp / maxHp < 0.35;
    s.className = 'hs' + (isFilled ? (isLow ? ' lo' : ' f') : '');
    bar.appendChild(s);
  }
}
