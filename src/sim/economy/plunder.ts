import type { PlunderItem } from '../../core/campaign-types';
import type { Port } from '../../core/types';
import type { GameState } from '../state/game-state';
import { portPlunderMultiplier } from '../state/port-actions';

export function addPlunder(gs: GameState, name: string, value: number, source: string, qty: number = 1): void {
  const existing = gs.plunder.find(item => item.name === name && item.source === source);
  if (existing) {
    existing.qty += qty;
    existing.value = ~~((existing.value + value) / 2);
    return;
  }
  gs.plunder.push({ name, value, source, qty });
}

export function plunderValue(items: PlunderItem[], port: Port | null, fame: number = 0): number {
  const base = items.reduce((sum, item) => sum + item.value * item.qty, 0);
  if (!port) return base;
  return ~~(base * portPlunderMultiplier(port, { fame }));
}

export function sellPlunder(gs: GameState, port: Port | null): string {
  if (gs.plunder.length === 0) return 'No plunder in the hold.';
  const value = plunderValue(gs.plunder, port, gs.player.fame);
  const manifest = gs.plunder.reduce((sum, item) => sum + item.qty, 0);
  gs.player.gold += value;
  gs.plunder.length = 0;
  if (!port) return `Sold ${manifest} plunder crates for ${value}g`;
  return `Sold ${manifest} plunder crates for ${value}g at ${port.name}`;
}
