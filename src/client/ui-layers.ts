import type { UIMode } from './ui-mode';

export interface LayerVisibility {
  statusBadge: boolean;
  actionOverlay: boolean;
  log: boolean;
  cornerBtns: boolean;
}

export function computeLayerVisibility(mode: UIMode): LayerVisibility {
  const inCombat = mode === 'COMBAT';
  return {
    statusBadge: true,
    actionOverlay: inCombat || mode === 'CREW_ALERT',
    log: !inCombat,
    cornerBtns: true,
  };
}

export function applyLayerVisibility(vis: LayerVisibility): void {
  setVisible('statusBadge', vis.statusBadge);
  setVisible('actionOverlay', vis.actionOverlay);
  setVisible('log', vis.log);
  setVisible('cornerBtns', vis.cornerBtns);
}

function setVisible(id: string, visible: boolean): void {
  const el = document.getElementById(id);
  if (el) el.style.display = visible ? '' : 'none';
}
