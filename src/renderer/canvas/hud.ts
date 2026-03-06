import type { PlayerShip } from '../../core/types';
import { windDirStr, windStrBar } from '../../sim/nav/wind';
import type { WindState } from '../../sim/nav/wind';

/** Update all HUD DOM elements */
export function updateHUD(player: PlayerShip, era: number, wind: WindState): void {
  setText('snEl', player.tk);
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

  updateHealthBar(player.hp, player.maxHp);
}

function setText(id: string, text: string): void {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function updateHealthBar(hp: number, maxHp: number): void {
  const bar = document.getElementById('hpbar');
  if (!bar) return;
  bar.innerHTML = '';
  for (let i = 0; i < maxHp; i++) {
    const s = document.createElement('div');
    const isFilled = i < hp;
    const isLow = hp / maxHp < 0.35;
    s.className = 'hs' + (isFilled ? (isLow ? ' lo' : ' f') : '');
    bar.appendChild(s);
  }
}
