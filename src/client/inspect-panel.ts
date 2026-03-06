import { displaySailingFlag, displayShipFlag, displayShipName } from '../core/ship-identity';
import type { GameState } from '../sim/state/game-state';
import { selectCombatTarget } from './combat-hud';

export function bindInspectPanel(onToggle: () => void): void {
  window.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    event.preventDefault();
    onToggle();
  });
  const close = document.getElementById('inspectClose');
  if (close) close.onclick = () => setInspectOpen(false);
}

export function toggleInspect(): void {
  const panel = document.getElementById('inspectPanel');
  if (!panel) return;
  setInspectOpen(panel.style.display !== 'block');
}

export function renderInspectPanel(gs: GameState): void {
  const panel = document.getElementById('inspectPanel');
  const title = document.getElementById('inspectTitle');
  const body = document.getElementById('inspectBody');
  if (!panel || !title || !body || panel.style.display !== 'block') return;

  const target = selectCombatTarget(gs.player, gs.enemies);
  title.textContent = target ? `${displayShipName(gs.player)} VS ${displayShipName(target)}` : `${displayShipName(gs.player)} REPORT`;
  body.innerHTML = [
    metric(`FLAG`, `${displayShipFlag(gs.player)} · ${displaySailingFlag(gs.player)}`),
    metric(`HEALTH`, `${Math.round(gs.player.hp)}/${Math.round(gs.player.maxHp)}`),
    metric(`CREW`, `${gs.player.crew}`),
    metric(`GOLD`, `${gs.player.gold}`),
    metric(`UNSHARED`, `${gs.player.unsharedGold}`),
    metric(`CANNONS`, `${gs.player.cn}`),
    metric(`RELOAD`, `${(gs.player.reloadT / 1000).toFixed(1)}s`),
    metric(`RANGE`, `${gs.player.rng.toFixed(1)}`),
    metric(`SPEED`, `${gs.player.speed.toFixed(2)}`),
    metric(`RAM`, `${gs.player.ramBonus}`),
    metric(`FLEET`, `${1 + gs.player.fleet.length}`),
    metric(`SEED`, `${gs.settings.preferredSeed || gs.seed}`),
  ].join('') + (target ? [
    metric(`TARGET`, `${displayShipName(target)} · ${displayShipFlag(target)}`),
    metric(`TARGET HP`, `${Math.round(target.hp)}/${Math.round(target.maxHp)}`),
    metric(`TARGET CREW`, target.role),
    metric(`TARGET RELOAD`, `${(target.reloadT / 1000).toFixed(1)}s`),
    metric(`TARGET RANGE`, `${target.rng.toFixed(1)}`),
    metric(`TARGET STATE`, `${target.state}`),
  ].join('') : '');
}

function metric(label: string, value: string): string {
  return `<div class="inspectMetric"><strong>${label}</strong><br>${value}</div>`;
}

function setInspectOpen(open: boolean): void {
  const panel = document.getElementById('inspectPanel');
  if (panel) panel.style.display = open ? 'block' : 'none';
}
