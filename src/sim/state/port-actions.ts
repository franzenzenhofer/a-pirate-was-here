import { cargoCapacity, fleetSummary } from './fleet';
import { emitEvent } from './events';
import type { GameState } from './game-state';
import type { Port, PlayerShip } from '../../core/types';

export interface PortDiplomacySummary {
  status: string;
  detail: string;
}

export interface PortServiceProfile {
  recruitCost: number;
  recruitCount: number;
  repairFactor: number;
  cannonCost: number;
  plunderMultiplier: number;
  tradeBonusText: string | null;
}

export function buyDrinksForTown(gs: GameState, port: Port): string {
  const player = gs.player;
  if (player.gold < 120) return 'Not enough gold to buy drinks for the town.';
  const cost = Math.max(120, Math.round(player.gold * 0.3));
  const fameGain = Math.max(40, Math.round(cost / 16));
  player.gold = Math.max(0, player.gold - cost);
  player.fame += fameGain;
  port.rel = 'friendly';
  gs.reputation = Math.max(0, gs.reputation - 8);
  emitEvent(gs, { kind: 'milestone', msg: `🍻 ${port.name} sings your name. +${fameGain} fame`, tone: 'g' });
  return `Bought drinks for ${port.name}. -${cost}g, +${fameGain} fame.`;
}

export function demandTribute(gs: GameState, port: Port): string {
  if (port.rel !== 'neutral') return `${port.name} is not willing to pay tribute.`;
  if (gs.player.fame < 1000) return 'Your legend is not yet feared enough to demand tribute.';
  const payout = Math.min(1500, Math.max(500, Math.round(port.wealth * 0.35)));
  gs.player.gold += payout;
  gs.player.unsharedGold += Math.round(payout * 0.25);
  port.wealth = Math.max(120, port.wealth - payout);
  emitEvent(gs, { kind: 'milestone', msg: `💰 ${port.name} pays ${payout}g in tribute.`, tone: 'o' });
  return `${port.name} pays ${payout}g and begs you to move on.`;
}

export function diplomacySummary(_player: PlayerShip, port: Port): PortDiplomacySummary {
  if (port.rel === 'enemy') {
    return {
      status: 'HOSTILE',
      detail: `${port.name} blames your raids and current flag for rising infamy.`,
    };
  }
  if (port.rel === 'friendly') {
    return {
      status: 'FRIENDLY',
      detail: `${port.name} trusts captains sailing ${port.nat} colors or feeding local taverns.`,
    };
  }
  return {
    status: 'NEUTRAL',
    detail: `${port.name} will trade, but prices stay sharp until you earn trust or pay tribute.`,
  };
}

export function serviceProfile(port: Port, player: PlayerShip): PortServiceProfile {
  const plunderMultiplier = portPlunderMultiplier(port, player);
  const recruitBase = port.nat === 'PIRATE' ? 36 : port.nat === 'FRANCE' ? 42 : 50;
  const recruitCost = player.fame > 300 && (port.nat === 'PIRATE' || port.rel === 'friendly') ? 0 : recruitBase;
  const recruitCount = port.nat === 'PIRATE' ? 14 : port.nat === 'ENGLAND' ? 8 : 10;
  const repairFactor = port.nat === 'FRANCE' ? 0.8 : port.nat === 'SPAIN' ? 0.7 : 0.6;
  const cannonCost = port.nat === 'ENGLAND' ? 110 : port.nat === 'SPAIN' ? 135 : 150;
  const tradeBonusText =
    port.nat === 'DUTCH' ? `DUTCH BROKERS: best fence in the sea. Plunder sells at ${Math.round(plunderMultiplier * 100)}%. Hold ${cargoCapacity(player) + fleetSummary(player).cargo}.` :
    port.nat === 'PIRATE' ? `PIRATE HARBOR: crew arrives fast, law looks away. Plunder sells at ${Math.round(plunderMultiplier * 100)}%.` :
    port.nat === 'FRANCE' ? `FRENCH YARDS: finer repairs and cultured brokers. Plunder sells at ${Math.round(plunderMultiplier * 100)}%.` :
    `HARBOR MARKET: plunder sells at ${Math.round(plunderMultiplier * 100)}%.`;

  return {
    recruitCost,
    recruitCount,
    repairFactor,
    cannonCost,
    plunderMultiplier,
    tradeBonusText,
  };
}

export function portPlunderMultiplier(port: Port | null, player: Pick<PlayerShip, 'fame'>): number {
  if (!port) return 1;
  const relationBoost = port.rel === 'friendly' ? 0.08 : port.rel === 'enemy' ? -0.18 : 0;
  const fameBoost = player.fame >= 800 ? 0.05 : player.fame >= 300 ? 0.02 : 0;
  const nationBias =
    port.nat === 'DUTCH' ? 0.16 :
    port.nat === 'PIRATE' ? 0.1 :
    port.nat === 'FRANCE' ? 0.06 :
    port.nat === 'ENGLAND' ? 0.03 :
    port.nat === 'SPAIN' ? -0.02 :
    0;
  return Math.max(0.72, Math.min(1.34, 1 + relationBoost + fameBoost + nationBias));
}
