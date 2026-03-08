import { describe, expect, it } from 'vitest';
import { computeUIMode, hasCrewAlert } from './ui-mode';
import { createTestPlayer, createTestState, createTestPort } from '../test/fixtures';
import { asShipId } from '../core/types';
import { createTestEnemy } from '../test/fixtures';

function makeGS(overrides: Parameters<typeof createTestState>[0] = {}) {
  return createTestState(overrides);
}

describe('computeUIMode', () => {
  it('returns SAILING by default', () => {
    expect(computeUIMode(makeGS(), null)).toBe('SAILING');
  });

  it('returns MENU when gameOver', () => {
    expect(computeUIMode(makeGS({ gameOver: true }), null)).toBe('MENU');
  });

  it('returns MENU when a modal is open', () => {
    expect(computeUIMode(makeGS(), 'settingsPanel')).toBe('MENU');
  });

  it('returns DOCKED when activePort is set', () => {
    const port = createTestPort({ x: 10, y: 10 });
    expect(computeUIMode(makeGS({ activePort: port }), null)).toBe('DOCKED');
  });

  it('returns CAPTURE when paused with captureQueue', () => {
    const gs = makeGS({ paused: true, captureQueue: ['1'] });
    expect(computeUIMode(gs, null)).toBe('CAPTURE');
  });

  it('returns COMBAT when enemy in engagement range', () => {
    const player = createTestPlayer({ id: asShipId(1), x: 10, y: 10 });
    const enemy = createTestEnemy({ id: asShipId(2), x: 13, y: 10 });
    const gs = makeGS({ player, enemies: [enemy] });
    expect(computeUIMode(gs, null)).toBe('COMBAT');
  });

  it('returns CREW_ALERT when fever active', () => {
    const player = createTestPlayer({ feverT: 5000 });
    expect(computeUIMode(makeGS({ player }), null)).toBe('CREW_ALERT');
  });

  it('returns CREW_ALERT when unshared gold present', () => {
    const player = createTestPlayer({ unsharedGold: 100 });
    expect(computeUIMode(makeGS({ player }), null)).toBe('CREW_ALERT');
  });

  it('MENU beats DOCKED (priority order)', () => {
    const port = createTestPort({ x: 10, y: 10 });
    expect(computeUIMode(makeGS({ activePort: port, gameOver: true }), null)).toBe('MENU');
  });

  it('DOCKED beats COMBAT (priority order)', () => {
    const player = createTestPlayer({ id: asShipId(1), x: 10, y: 10 });
    const enemy = createTestEnemy({ id: asShipId(2), x: 13, y: 10 });
    const port = createTestPort({ x: 10, y: 10 });
    const gs = makeGS({ player, enemies: [enemy], activePort: port });
    expect(computeUIMode(gs, null)).toBe('DOCKED');
  });
});

describe('hasCrewAlert', () => {
  it('false with calm state', () => {
    expect(hasCrewAlert(makeGS())).toBe(false);
  });

  it('true with hyped crew', () => {
    const player = createTestPlayer({ hypedT: 3000 });
    expect(hasCrewAlert(makeGS({ player }))).toBe(true);
  });

  it('true when fog is nearby and not deafened', () => {
    const player = createTestPlayer({ x: 10, y: 10, deafenedT: 0 });
    const gs = makeGS({ player, fogZones: [{ x: 12, y: 10, radius: 5, id: 'f1', ttl: 60000, strength: 1 }] });
    expect(hasCrewAlert(gs)).toBe(true);
  });

  it('false when fog is nearby but deafened', () => {
    const player = createTestPlayer({ x: 10, y: 10, deafenedT: 5000 });
    const gs = makeGS({ player, fogZones: [{ x: 12, y: 10, radius: 5, id: 'f1', ttl: 60000, strength: 1 }] });
    expect(hasCrewAlert(gs)).toBe(false);
  });
});
