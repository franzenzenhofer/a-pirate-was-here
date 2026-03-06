import { describe, it, expect } from 'vitest';
import { buyGoods, sellGoods, cargoCount } from './trade';
import { asShipId } from '../../core/types';
import type { PlayerShip, Port } from '../../core/types';
import { asPortId } from '../../core/types';

function mkPlayer(overrides: Partial<PlayerShip> = {}): PlayerShip {
  return {
    id: asShipId(0), x: 0, y: 0, angle: 0, speed: 0,
    targetX: null, targetY: null,
    hp: 14, maxHp: 14, cn: 8, rl: 5500, rng: 5.5, acc: 0.6,
    bspd: 1.1, col: '#44aaff', tk: 'BRIGANTINE',
    reloadT: 0, disabled: false, sunk: false, captured: false,
    wakePoints: [], turnRate: 1.0, nat: 'PIRATE',
    gold: 1000, crew: 80, fame: 0, kills: 0,
    day: 1, dayT: 0, fleet: [],
    cargo: [],
    ...overrides,
  };
}

function mkPort(): Port {
  return {
    id: asPortId(0), x: 10, y: 10,
    name: 'TEST PORT', nat: 'SPAIN', rel: 'friendly',
    garrison: 10, wealth: 500, cannons: 6,
    attackTimer: 0, defFleet: [],
    prices: { RUM: 40, SUGAR: 25, SPICES: 80 },
  };
}

describe('buyGoods', () => {
  it('buys goods and deducts gold', () => {
    const p = mkPlayer();
    const port = mkPort();
    const msg = buyGoods(p, port, 'RUM', 5);
    expect(msg).toContain('Bought');
    expect(p.gold).toBe(800); // 1000 - 5*40
    expect(p.cargo.length).toBe(1);
    expect(p.cargo[0]!.qty).toBe(5);
  });

  it('refuses when not enough gold', () => {
    const p = mkPlayer({ gold: 10 });
    const port = mkPort();
    const msg = buyGoods(p, port, 'SPICES', 5);
    expect(msg).toContain('Not enough gold');
  });
});

describe('sellGoods', () => {
  it('sells goods and adds gold', () => {
    const p = mkPlayer({ cargo: [{ good: 'RUM', qty: 5, buyPrice: 30 }] });
    const port = mkPort();
    const msg = sellGoods(p, port, 'RUM');
    expect(msg).toContain('Sold');
    expect(p.gold).toBe(1200); // 1000 + 5*40
    expect(p.cargo.length).toBe(0);
  });
});

describe('cargoCount', () => {
  it('sums all cargo quantities', () => {
    const p = mkPlayer({
      cargo: [
        { good: 'RUM', qty: 3, buyPrice: 30 },
        { good: 'SUGAR', qty: 7, buyPrice: 20 },
      ],
    });
    expect(cargoCount(p)).toBe(10);
  });
});
