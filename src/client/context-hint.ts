import { displayShipName } from '../core/ship-identity';
import { hasGoodBroadside } from '../sim/combat/shot-selection';
import { serviceProfile } from '../sim/state/port-actions';
import { fleetOrderLabel } from '../sim/state/fleet';
import { moraleLabel } from '../sim/state/morale';
import { assessPortRaid } from '../sim/state/progression';
import type { GameState } from '../sim/state/game-state';
import { createReloadMeter, selectCombatTarget } from './combat-hud';
import { captureInRange, nearestPort } from './game-actions-available';

export interface ContextHint {
  title: string;
  detail: string;
  tone: 'g' | 'r' | 'b' | 'o';
}

export function getContextHint(gs: GameState): ContextHint | null {
  if (gs.gameOver) return null;
  const combatHint = getCombatHint(gs);
  if (combatHint) return combatHint;
  const disabledHint = getDisabledShipHint(gs);
  if (disabledHint) return disabledHint;
  const portHint = getPortHint(gs);
  if (portHint) return portHint;
  const treasureHint = getTreasureHint(gs);
  if (treasureHint) return treasureHint;
  const crewHint = getCrewHint(gs);
  if (crewHint) return crewHint;
  return getVoyageHint(gs);
}

function getCombatHint(gs: GameState): ContextHint | null {
  const target = selectCombatTarget(gs.player, gs.enemies);
  if (!target) return null;
  const playerReload = createReloadMeter(gs.player.reloadT, gs.player.rl);
  const enemyReload = createReloadMeter(target.reloadT, target.rl);
  const broadsideReady = gs.player.reloadT <= 0 && hasGoodBroadside(gs.player, target);
  const detail = broadsideReady
    ? `Broadside lined up · enemy ${enemyReload.label.toLowerCase()} · ${describeEnemyIntent(target.state)}`
    : gs.player.reloadT <= 0
      ? `Turning for a better broadside · enemy ${enemyReload.label.toLowerCase()}`
      : `Reload ${playerReload.label.toLowerCase()} · enemy ${enemyReload.label.toLowerCase()} · ${describeEnemyIntent(target.state)}`;
  return {
    title: `ENGAGING ${displayShipName(target)}`,
    detail,
    tone: enemyReload.remainingMs <= 0 ? 'r' : 'o',
  };
}

function getDisabledShipHint(gs: GameState): ContextHint | null {
  const disabled = gs.enemies.find(enemy =>
    enemy.disabled && !enemy.sunk && !enemy.captured && captureInRange(gs, enemy),
  );
  if (!disabled) return null;
  return {
    title: `BOARD ${displayShipName(disabled)}`,
    detail: 'Tap the crippled ship to loot, claim, board, or burn it.',
    tone: 'g',
  };
}

function getPortHint(gs: GameState): ContextHint | null {
  const nearest = nearestPort(gs);
  if (!nearest) return null;
  const port = nearest.port;
  const services = serviceProfile(port, gs.player);
  if (port.rel === 'friendly') {
    const repairAmount = ~~(gs.player.maxHp * Math.min(0.85, services.repairFactor + 0.1));
    return {
      title: `${port.name} · FRIENDLY PORT`,
      detail: `Tap to dock · repair +${repairAmount} HP · recruit +${services.recruitCount} · plunder ${Math.round(services.plunderMultiplier * 100)}%`,
      tone: 'g',
    };
  }
  if (port.rel === 'neutral') {
    return {
      title: `${port.name} · NEUTRAL PORT`,
      detail: `Tap to dock · trade at sharper prices · plunder ${Math.round(services.plunderMultiplier * 100)}% · pay tribute or build your legend`,
      tone: 'b',
    };
  }
  const raid = assessPortRaid(port, gs.player.cn, gs.player.hp, gs.player.maxHp);
  return {
    title: `${port.name} · HOSTILE PORT`,
    detail: `Tap to raid · ${Math.round(raid.winChance * 100)}% win chance · expect ${raid.counterDamage} hull damage`,
    tone: 'r',
  };
}

function getTreasureHint(gs: GameState): ContextHint | null {
  if (!gs.activeTreasureMapId) return null;
  const target = gs.treasures.find(treasure => treasure.mapId === gs.activeTreasureMapId && !treasure.looted);
  if (!target) return null;
  const distance = Math.hypot(target.x + 0.5 - gs.player.x, target.y + 0.5 - gs.player.y);
  if (distance > 12) return null;
  return {
    title: 'TREASURE SHORE',
    detail: distance < 4
      ? 'Turn broadside and blast the marked beach to reveal the stash.'
      : `Marked beach ahead · ${distance.toFixed(1)} tiles away`,
    tone: 'o',
  };
}

function getCrewHint(gs: GameState): ContextHint | null {
  if (gs.player.feverT > 0 && gs.player.unsharedGold > 0) {
    return {
      title: 'GOLD FEVER',
      detail: `Share loot in ${Math.ceil(gs.player.feverT / 1000)}s or risk mutiny.`,
      tone: 'r',
    };
  }
  if (gs.player.hypedT > 0) {
    return {
      title: 'HYPED CREW',
      detail: 'Faster speed and reload, but wilder accuracy. Use the momentum now.',
      tone: 'g',
    };
  }
  if (gs.player.hp / Math.max(1, gs.player.maxHp) < 0.35) {
    return {
      title: 'CRIPPLED HULL',
      detail: 'Your ship is fragile. Dock for repairs or keep enemies off your beam.',
      tone: 'r',
    };
  }
  return null;
}

function getVoyageHint(gs: GameState): ContextHint {
  if (gs.activeQuest && !gs.activeQuest.completed) {
    return { title: gs.activeQuest.title.toUpperCase(), detail: `${gs.activeQuest.detail} · ${gs.activeQuest.progress}/${gs.activeQuest.goal}`, tone: 'b' };
  }
  if (gs.activeEvent?.active) {
    return { title: gs.activeEvent.title.toUpperCase(), detail: gs.activeEvent.detail, tone: 'o' };
  }
  const order = fleetOrderLabel(gs.player.fleetOrder);
  const mood = moraleLabel(gs.morale.value);
  return { title: 'OPEN SEA', detail: `Fleet: ${order} · Crew: ${mood} · Chase rumors, raid trade lanes.`, tone: 'b' };
}

function describeEnemyIntent(state: string): string {
  if (state === 'MEGA_CHARGE') return 'charge incoming';
  if (state === 'MEGA_STUNNED' || state === 'CRAB_EXPOSED') return 'stunned';
  if (state === 'FLEE') return 'trying to flee';
  if (state === 'CHASE') return 'closing hard';
  if (state === 'PORT_ATTACK') return 'raiding a port';
  return 'holding position';
}
