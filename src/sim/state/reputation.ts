import type { GameState } from './game-state';

export function increaseInfamy(gs: GameState, amount: number, nation?: string): void {
  gs.reputation = Math.min(100, gs.reputation + amount);
  if (!nation) return;
  for (const port of gs.ports) {
    if (port.nat === nation && port.nat !== 'PIRATE') port.rel = 'enemy';
  }
}
