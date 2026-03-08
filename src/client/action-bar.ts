import type { UIMode } from './ui-mode';
import type { GameState } from '../sim/state/game-state';
import { getCombatHudState } from './combat-hud';
import { updateStatusBadge } from '../renderer/canvas/hud';

export function updateMobileUI(mode: UIMode, gs: GameState): void {
  updateStatusBadge(gs.player);
  const overlay = document.getElementById('actionOverlay');
  if (overlay) renderActionOverlay(overlay, mode, gs);
}

export function renderActionOverlay(el: HTMLElement, mode: UIMode, gs: GameState): void {
  if (mode === 'COMBAT') { renderCombatOverlay(el, gs); return; }
  if (mode === 'CREW_ALERT') { renderCrewOverlay(el, gs); return; }
  el.style.display = 'none';
}

function clearChildren(el: HTMLElement): void {
  while (el.firstChild) el.removeChild(el.firstChild);
}

function makeRow(text: string): HTMLDivElement {
  const row = document.createElement('div');
  row.className = 'aoRow';
  row.textContent = text;
  return row;
}

function makeBar(cls: string, widthPct: number): HTMLDivElement {
  const bar = document.createElement('div');
  bar.className = 'aoBar';
  const fill = document.createElement('div');
  fill.className = `aoFill ${cls}`;
  fill.style.width = `${widthPct}%`;
  bar.appendChild(fill);
  return bar;
}

function renderCombatOverlay(el: HTMLElement, gs: GameState): void {
  const combat = getCombatHudState(gs);
  if (!combat) { el.style.display = 'none'; return; }
  el.style.display = 'block';
  el.style.borderColor = 'rgba(155,63,63,0.5)';
  clearChildren(el);
  const info = `⚔ ${combat.targetName} ${combat.enemyHull.label}`
    + ` YOU:${combat.player.label} EN:${combat.enemy.label}`;
  el.appendChild(makeRow(info));
  const barRow = document.createElement('div');
  barRow.className = 'aoRow';
  barRow.appendChild(makeBar('hull', combat.playerHull.progress * 100));
  barRow.appendChild(makeBar('reload', combat.player.progress * 100));
  barRow.appendChild(makeBar('enemy', combat.enemyHull.progress * 100));
  el.appendChild(barRow);
}

function renderCrewOverlay(el: HTMLElement, gs: GameState): void {
  el.style.display = 'block';
  el.style.borderColor = 'rgba(156,116,64,0.5)';
  clearChildren(el);
  const label = gs.player.hypedT > 0
    ? `HYPED ${Math.ceil(gs.player.hypedT / 1000)}s · ${gs.player.unsharedGold}g`
    : gs.player.feverT > 0
      ? `⚠ GOLD FEVER ${Math.ceil(gs.player.feverT / 1000)}s · ${gs.player.unsharedGold}g`
      : `FRESH BOOTY ${gs.player.unsharedGold}g`;
  el.appendChild(makeRow(label));
  const btnRow = document.createElement('div');
  btnRow.className = 'aoRow';
  btnRow.appendChild(makeButton('aoShareLoot', 'SHARE LOOT'));
  btnRow.appendChild(makeButton('aoBlastFog', 'BLAST FOG'));
  el.appendChild(btnRow);
}

function makeButton(id: string, text: string): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.className = 'tb';
  btn.id = id;
  btn.type = 'button';
  btn.textContent = text;
  return btn;
}
