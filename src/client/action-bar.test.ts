/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it, beforeEach } from 'vitest';
import { renderActionOverlay } from './action-bar';
import { createTestPlayer, createTestState, createTestEnemy } from '../test/fixtures';
import { asShipId } from '../core/types';

function makeEl(): HTMLDivElement {
  const el = document.createElement('div');
  el.id = 'actionOverlay';
  return el;
}

describe('renderActionOverlay', () => {
  let el: HTMLDivElement;
  beforeEach(() => { el = makeEl(); });

  it('hides overlay in SAILING mode', () => {
    renderActionOverlay(el, 'SAILING', createTestState());
    expect(el.style.display).toBe('none');
  });

  it('shows combat info in COMBAT mode', () => {
    const player = createTestPlayer({ id: asShipId(1), x: 10, y: 10 });
    const enemy = createTestEnemy({ id: asShipId(2), x: 13, y: 10 });
    const gs = createTestState({ player, enemies: [enemy] });
    renderActionOverlay(el, 'COMBAT', gs);
    expect(el.style.display).toBe('block');
    expect(el.style.borderColor).toContain('155');
    expect(el.querySelectorAll('.aoBar').length).toBe(3);
  });

  it('shows crew alert in CREW_ALERT mode', () => {
    const player = createTestPlayer({ feverT: 5000, unsharedGold: 150 });
    const gs = createTestState({ player });
    renderActionOverlay(el, 'CREW_ALERT', gs);
    expect(el.style.display).toBe('block');
    expect(el.style.borderColor).toContain('156');
    expect(el.textContent).toContain('GOLD FEVER');
    expect(el.querySelector('#aoShareLoot')).toBeTruthy();
  });

  it('hides overlay in DOCKED mode', () => {
    renderActionOverlay(el, 'DOCKED', createTestState());
    expect(el.style.display).toBe('none');
  });
});
