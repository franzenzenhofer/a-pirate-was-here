import type { SimEvent } from '../../core/campaign-types';
import type { GameState } from './game-state';

let nextEventId = 1;

export function emitEvent(
  gs: Pick<GameState, 'events'>,
  event: Omit<SimEvent, 'id'>,
): SimEvent {
  const next: SimEvent = { id: `evt-${nextEventId++}`, ...event };
  gs.events.push(next);
  return next;
}

export function drainEvents(gs: Pick<GameState, 'events'>): SimEvent[] {
  if (gs.events.length === 0) return [];
  return gs.events.splice(0, gs.events.length);
}
