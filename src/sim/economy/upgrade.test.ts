import { describe, it, expect } from 'vitest';
import { getUpgradeOptions } from './upgrade';
import { asShipId } from '../../core/types';
import type { PlayerShip } from '../../core/types';
import { createTestPlayer } from '../../test/fixtures';

function mkPlayer(overrides: Partial<PlayerShip> = {}): PlayerShip {
  return createTestPlayer({ id: asShipId(0), gold: 5000, bspd: 1.1, ...overrides });
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
