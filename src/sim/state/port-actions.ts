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
  const recruitBase = port.nat === 'PIRATE' ? 36 : port.nat === 'FRANCE' ? 42 : 50;
  const recruitCost = player.fame > 300 && (port.nat === 'PIRATE' || port.rel === 'friendly') ? 0 : recruitBase;
  const recruitCount = port.nat === 'PIRATE' ? 14 : port.nat === 'ENGLAND' ? 8 : 10;
  const repairFactor = port.nat === 'FRANCE' ? 0.8 : port.nat === 'SPAIN' ? 0.7 : 0.6;
  const cannonCost = port.nat === 'ENGLAND' ? 110 : port.nat === 'SPAIN' ? 135 : 150;
  const tradeBonusText =
    port.nat === 'DUTCH' ? `DUTCH BROKERS: sell high, hold ${cargoCapacity(player) + fleetSummary(player).cargo} total.` :
    port.nat === 'PIRATE' ? 'PIRATE HARBOR: crew arrives fast, law looks away.' :
    null;

  return {
    recruitCost,
    recruitCount,
    repairFactor,
    cannonCost,
    tradeBonusText,
  };
}
