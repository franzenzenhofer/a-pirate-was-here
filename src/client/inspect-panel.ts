import { displaySailingFlag, displayShipFlag, displayShipName } from '../core/ship-identity';
import { portPlunderMultiplier, serviceProfile } from '../sim/state/port-actions';
import { assessPortRaid } from '../sim/state/progression';
import type { GameState } from '../sim/state/game-state';
import { selectCombatTarget } from './combat-hud';
import { nearestPort } from './game-actions-available';
import { crewWagesPerDay } from '../config/economy';
import { fleetOrderLabel } from '../sim/state/fleet';
import { moraleLabel } from '../sim/state/morale';
import { specialistWagesPerDay, totalSpecialists } from '../sim/state/specialists';

export function bindInspectPanel(onToggle: () => void): void {
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Tab') {
      event.preventDefault();
      onToggle();
      return;
    }
    if (event.key === 'Escape') setInspectOpen(false);
  });
  const button = document.getElementById('inspectBtn');
  if (button) button.onclick = () => onToggle();
  const crewButton = document.getElementById('crewBtn');
  if (crewButton) crewButton.onclick = () => onToggle();
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
  const nearbyPort = nearestPort(gs)?.port ?? null;
  title.textContent = target
    ? `${displayShipName(gs.player)} VS ${displayShipName(target)}`
    : nearbyPort
      ? `${displayShipName(gs.player)} · ${nearbyPort.name}`
      : `${displayShipName(gs.player)} REPORT`;
  body.innerHTML = buildPlayerMetrics(gs).join('')
    + (target ? buildTargetMetrics(gs, target).join('') : nearbyPort ? buildPortMetrics(gs, nearbyPort).join('') : '');
}

function metric(label: string, value: string): string {
  return `<div class="inspectMetric"><strong>${label}</strong><br>${value}</div>`;
}

function setInspectOpen(open: boolean): void {
  const panel = document.getElementById('inspectPanel');
  if (panel) panel.style.display = open ? 'block' : 'none';
}

function buildPlayerMetrics(gs: GameState): string[] {
  return [
    metric('FLAG', `${displayShipFlag(gs.player)} · ${displaySailingFlag(gs.player)}`),
    metric('HEALTH', `${Math.round(gs.player.hp)}/${Math.round(gs.player.maxHp)}`),
    metric('CREW', `${gs.player.crew}`),
    metric('GOLD', `${gs.player.gold}`),
    metric('UNSHARED', `${gs.player.unsharedGold}`),
    metric('WAGES / DAY', `${crewWagesPerDay(gs.player.crew) + specialistWagesPerDay(gs.player.specialists)}`),
    metric('MORALE', `${moraleLabel(gs.morale.value)} (${Math.round(gs.morale.value)})`),
    metric('FLEET ORDER', fleetOrderLabel(gs.player.fleetOrder)),
    metric('SPECIALISTS', `${totalSpecialists(gs.player.specialists)} (G${gs.player.specialists.gunners} M${gs.player.specialists.marines} S${gs.player.specialists.surgeons} N${gs.player.specialists.navigators})`),
    metric('CANNONS', `${gs.player.cn}`),
    metric('RELOAD', `${(gs.player.reloadT / 1000).toFixed(1)}s`),
    metric('RANGE', `${gs.player.rng.toFixed(1)}`),
    metric('SPEED', `${gs.player.speed.toFixed(2)}`),
    metric('RAM', `${gs.player.ramBonus}`),
    metric('FLEET', `${1 + gs.player.fleet.length}`),
    metric('SEED', `${gs.settings.preferredSeed || gs.seed}`),
  ];
}

function buildTargetMetrics(gs: GameState, target: NonNullable<ReturnType<typeof selectCombatTarget>>): string[] {
  return [
    metric('TARGET', `${displayShipName(target)} · ${displayShipFlag(target)}`),
    metric('TARGET HEALTH', `${Math.round(target.hp)}/${Math.round(target.maxHp)}`),
    metric('TARGET ROLE', `${target.role} · ${target.tier}`),
    metric('TARGET RELOAD', `${(target.reloadT / 1000).toFixed(1)}s`),
    metric('TARGET RANGE', `${target.rng.toFixed(1)}`),
    metric('TARGET SPEED', `${target.speed.toFixed(2)}`),
    metric('TARGET DIST', `${Math.hypot(target.x - gs.player.x, target.y - gs.player.y).toFixed(1)}`),
    metric('TARGET INTENT', describeIntent(target.state)),
  ];
}

function buildPortMetrics(gs: GameState, port: NonNullable<ReturnType<typeof nearestPort>>['port']): string[] {
  const services = serviceProfile(port, gs.player);
  const raid = assessPortRaid(port, gs.player.cn, gs.player.hp, gs.player.maxHp);
  const serviceSummary = port.rel === 'friendly'
    ? `repair, recruit +${services.recruitCount}, cannons, trade`
    : port.rel === 'neutral'
      ? 'trade, tribute, buy legend'
      : 'raid only';
  return [
    metric('PORT', `${port.name} · ${port.nat}`),
    metric('RELATION', `${port.rel.toUpperCase()}`),
    metric('WEALTH', `${Math.round(port.wealth)}g`),
    metric('GARRISON', `${port.garrison} · ${port.cannons} cannons`),
    metric('RAID ODDS', `${Math.round(raid.winChance * 100)}% · ${raid.rating}`),
    metric('PLUNDER SALE', `${Math.round(portPlunderMultiplier(port, gs.player) * 100)}%`),
    metric('SERVICES', serviceSummary),
  ];
}

function describeIntent(state: string): string {
  if (state === 'MEGA_CHARGE') return 'Charging';
  if (state === 'MEGA_STUNNED' || state === 'CRAB_EXPOSED') return 'Stunned';
  if (state === 'FLEE') return 'Fleeing';
  if (state === 'CHASE') return 'Chasing';
  if (state === 'PORT_ATTACK') return 'Raiding port';
  return 'Maneuvering';
}
