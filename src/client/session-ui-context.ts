import type { GameState } from '../sim/state/game-state';
import { getContextHint } from './context-hint';

export function renderContextHint(gs: GameState): void {
  const bar = document.getElementById('contextBar');
  const title = document.getElementById('contextTitle');
  const detail = document.getElementById('contextDetail');
  if (!bar || !title || !detail) return;
  const hint = getContextHint(gs);
  if (!hint) {
    bar.style.display = 'none';
    return;
  }
  bar.style.display = 'block';
  bar.setAttribute('data-tone', hint.tone);
  title.textContent = hint.title;
  detail.textContent = hint.detail;
}
