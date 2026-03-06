import type { PlayerShip, Port } from '../../core/types';
import { TRADE_GOODS } from '../../config/economy';
import { tradePriceFor } from './pricing';
import { cargoCapacity } from '../state/fleet';

/** Get current cargo count */
export function cargoCount(player: PlayerShip): number {
  return player.cargo.reduce((sum, c) => sum + c.qty, 0);
}

/** Buy goods at a port, returns message string */
export function buyGoods(
  player: PlayerShip,
  port: Port,
  goodName: string,
  qty: number,
): string {
  const price = tradePriceFor(port, goodName);
  if (price === null) return 'Good not available here';

  const space = cargoCapacity(player) - cargoCount(player);
  const affordable = Math.floor(player.gold / price);
  const actual = Math.min(qty, space, affordable);

  if (actual <= 0) {
    if (space <= 0) return 'Cargo hold is full!';
    return 'Not enough gold!';
  }

  const cost = actual * price;
  player.gold -= cost;

  // Add to existing cargo or create new entry
  const existing = player.cargo.find(c => c.good === goodName);
  if (existing) {
    const totalQty = existing.qty + actual;
    const totalSpent = existing.buyPrice * existing.qty + cost;
    existing.qty += actual;
    existing.buyPrice = ~~(totalSpent / totalQty);
  } else {
    player.cargo.push({ good: goodName, qty: actual, buyPrice: price });
  }

  return `Bought ${actual} ${goodName} for ${cost}g`;
}

/** Sell goods at a port, returns message string */
export function sellGoods(
  player: PlayerShip,
  port: Port,
  goodName: string,
): string {
  const price = tradePriceFor(port, goodName);
  if (price === null) return 'Not traded here';

  const item = player.cargo.find(c => c.good === goodName);
  if (!item || item.qty <= 0) return 'None in cargo!';

  const revenue = item.qty * price;
  const profit = revenue - item.qty * item.buyPrice;
  player.gold += revenue;

  const qty = item.qty;
  player.cargo = player.cargo.filter(c => c !== item);

  const profitStr = profit >= 0 ? `+${profit}g profit` : `${profit}g loss`;
  return `Sold ${qty} ${goodName} for ${revenue}g (${profitStr})`;
}

/** Get available goods at a port with profit indicators */
export function getTradeInfo(player: PlayerShip, port: Port): TradeDisplay[] {
  return TRADE_GOODS.map(good => {
    const portPrice = port.prices[good.name] ?? good.basePrice;
    const tradePrice = tradePriceFor(port, good.name) ?? portPrice;
    const held = player.cargo.find(c => c.good === good.name);
    const qty = held?.qty ?? 0;
    const buyPrice = held?.buyPrice ?? 0;
    const profitPerUnit = qty > 0 ? tradePrice - buyPrice : 0;

    return {
      name: good.name,
      color: good.color,
      portPrice,
      tradePrice,
      qty,
      profitPerUnit,
    };
  });
}

export interface TradeDisplay {
  name: string;
  color: string;
  portPrice: number;
  tradePrice: number;
  qty: number;
  profitPerUnit: number;
}
