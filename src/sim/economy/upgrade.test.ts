import { describe, it, expect } from 'vitest';
import { getUpgradeOptions } from './upgrade';
import { asShipId } from '../../core/types';
import type { PlayerShip } from '../../core/types';

function mkPlayer(overrides: Partial<PlayerShip> = {}): PlayerShip {
  return {
    id: asShipId(0), x: 0, y: 0, angle: 0, speed: 0,
    targetX: null, targetY: null,
    hp: 14, maxHp: 14, cn: 8, rl: 5500, rng: 5.5, acc: 0.6,
    bspd: 1.1, col: '#44aaff', tk: 'BRIGANTINE',
    reloadT: 0, disabled: false, sunk: false, captured: false,
    wakePoints: [], turnRate: 1.0, nat: 'PIRATE',
    gold: 5000, crew: 80, fame: 0, kills: 0, day: 1, dayT: 0, fleet: [], cargo: [],
    upgrades: { hull: 0, sails: 0, range: 0 },
    ...overrides,
  };
}

describe('getUpgradeOptions', () => {
  it('returns upgrade options', () => {
    const p = mkPlayer();
    const opts = getUpgradeOptions(p);
    expect(opts.length).toBeGreaterThan(0);
    expect(opts.some(o => o.name.includes('HULL'))).toBe(true);
    expect(opts.some(o => o.name.includes('SAILS'))).toBe(true);
    expect(opts.some(o => o.name.includes('FRIGATE'))).toBe(true);
  });

  it('hull upgrade increases maxHp', () => {
    const p = mkPlayer();
    const hullOpt = getUpgradeOptions(p).find(o => o.name.includes('HULL'));
    expect(hullOpt).toBeDefined();
    const oldMax = p.maxHp;
    hullOpt!.action();
    expect(p.maxHp).toBe(oldMax + 4);
  });

  it('offers sail upgrades to the starting brigantine', () => {
    const p = mkPlayer({ bspd: 2.6 });
    const sailOpt = getUpgradeOptions(p).find(o => o.name.includes('SAILS'));
    expect(sailOpt?.canAfford).toBe(true);
  });

  it('ship upgrade changes ship type', () => {
    const p = mkPlayer({ gold: 10000 });
    const shipOpt = getUpgradeOptions(p).find(o => o.name.includes('FRIGATE'));
    expect(shipOpt).toBeDefined();
    shipOpt!.action();
    expect(p.tk).toBe('FRIGATE');
  });

  it('preserves persistent hull and range upgrades across class changes', () => {
    const p = mkPlayer({ gold: 12000 });
    getUpgradeOptions(p).find(o => o.name.includes('HULL'))!.action();
    getUpgradeOptions(p).find(o => o.name.includes('RANGE'))!.action();
    getUpgradeOptions(p).find(o => o.name.includes('FRIGATE'))!.action();
    expect(p.maxHp).toBeGreaterThan(22);
    expect(p.rng).toBeGreaterThan(6.5);
  });

  it('cannot afford with low gold', () => {
    const p = mkPlayer({ gold: 10 });
    const opts = getUpgradeOptions(p);
    expect(opts.every(o => !o.canAfford)).toBe(true);
  });
});
