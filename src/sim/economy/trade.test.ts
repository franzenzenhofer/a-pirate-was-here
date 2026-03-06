import { describe, it, expect } from 'vitest';
import { buyGoods, sellGoods, cargoCount } from './trade';
import { asShipId } from '../../core/types';
import type { PlayerShip, Port } from '../../core/types';
import { createTestPlayer, createTestPort } from '../../test/fixtures';

function mkPlayer(overrides: Partial<PlayerShip> = {}): PlayerShip {
  return createTestPlayer({ id: asShipId(0), gold: 1000, bspd: 1.1, ...overrides });
}

function mkPort(): Port {
  return createTestPort();
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

  it('uses weighted average buy price when stacking cargo', () => {
    const p = mkPlayer({ cargo: [{ good: 'RUM', qty: 10, buyPrice: 10 }] });
    const port = mkPort();
    buyGoods(p, port, 'RUM', 5);
    expect(p.cargo[0]?.buyPrice).toBe(20);
  });

  it('applies neutral relation pricing to purchases', () => {
    const p = mkPlayer();
    const port = { ...mkPort(), rel: 'neutral' };
    buyGoods(p, port, 'RUM', 5);
    expect(p.gold).toBe(740);
  });

  it('increases cargo capacity when the fleet grows', () => {
    const p = mkPlayer({ fleet: [{ tk: 'SLOOP' }, { tk: 'SLOOP' }] });
    const port = mkPort();
    const msg = buyGoods(p, port, 'SUGAR', 25);
    expect(msg).toContain('Bought 25');
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

  it('applies neutral relation pricing to sales', () => {
    const p = mkPlayer({ cargo: [{ good: 'RUM', qty: 5, buyPrice: 30 }] });
    const port = { ...mkPort(), rel: 'neutral' };
    sellGoods(p, port, 'RUM');
    expect(p.gold).toBe(1260);
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
