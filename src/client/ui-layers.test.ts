import { describe, expect, it } from 'vitest';
import { computeLayerVisibility } from './ui-layers';
import type { UIMode } from './ui-mode';

function vis(mode: UIMode) {
  return computeLayerVisibility(mode);
}

describe('computeLayerVisibility', () => {
  it('statusBadge always visible', () => {
    const modes: UIMode[] = ['SAILING', 'COMBAT', 'CREW_ALERT', 'DOCKED', 'CAPTURE', 'MENU'];
    for (const mode of modes) {
      expect(vis(mode).statusBadge).toBe(true);
    }
  });

  it('cornerBtns always visible', () => {
    const modes: UIMode[] = ['SAILING', 'COMBAT', 'CREW_ALERT', 'DOCKED', 'CAPTURE', 'MENU'];
    for (const mode of modes) {
      expect(vis(mode).cornerBtns).toBe(true);
    }
  });

  it('COMBAT shows actionOverlay and hides log', () => {
    const v = vis('COMBAT');
    expect(v.actionOverlay).toBe(true);
    expect(v.log).toBe(false);
  });

  it('CREW_ALERT shows actionOverlay and keeps log', () => {
    const v = vis('CREW_ALERT');
    expect(v.actionOverlay).toBe(true);
    expect(v.log).toBe(true);
  });

  it('SAILING hides actionOverlay', () => {
    const v = vis('SAILING');
    expect(v.actionOverlay).toBe(false);
    expect(v.log).toBe(true);
  });

  it('DOCKED hides actionOverlay', () => {
    expect(vis('DOCKED').actionOverlay).toBe(false);
  });

  it('MENU hides actionOverlay', () => {
    expect(vis('MENU').actionOverlay).toBe(false);
  });
});
