import type { FloatingPickup } from '../../core/campaign-types';
import type { Treasure } from '../../core/types';
import type { GameState } from './game-state';
import { emitEvent } from './events';

let nextPickupId = 1;

export function spawnPickup(
  gs: GameState,
  pickup: Omit<FloatingPickup, 'id'>,
): FloatingPickup {
  const next: FloatingPickup = { id: `pickup-${nextPickupId++}`, ...pickup };
  gs.pickups.push(next);
  return next;
}

export function spawnCargoPickup(gs: GameState, x: number, y: number, value: number, source: string): FloatingPickup {
  return spawnPickup(gs, {
    kind: 'cargo',
    x,
    y,
    vx: 0,
    vy: 0,
    value,
    ttl: 90_000,
    label: 'CARGO',
    source,
    color: '#ffd86b',
  });
}

export function spawnMapPickup(gs: GameState, x: number, y: number, source: string): FloatingPickup {
  return spawnPickup(gs, {
    kind: 'map',
    x,
    y,
    vx: 0,
    vy: 0,
    value: 1,
    ttl: 120_000,
    label: 'SECRET MAP',
    source,
    color: '#ff6688',
  });
}

export function spawnToothPickup(gs: GameState, x: number, y: number): FloatingPickup {
  return spawnPickup(gs, {
    kind: 'tooth',
    x,
    y,
    vx: 0,
    vy: 0,
    value: 1,
    ttl: 120_000,
    label: 'MEGALODON TOOTH',
    source: 'MEGALODON',
    color: '#bbf8ff',
  });
}

export function updatePickups(gs: GameState, dt: number): void {
  for (let index = gs.pickups.length - 1; index >= 0; index--) {
    const pickup = gs.pickups[index];
    if (!pickup) continue;
    pickup.ttl -= dt;
    pickup.x += pickup.vx * dt * 0.001;
    pickup.y += pickup.vy * dt * 0.001;
    pickup.vx *= 0.985;
    pickup.vy *= 0.985;
    if (pickup.ttl <= 0) gs.pickups.splice(index, 1);
  }
}

export function collectNearbyPickups(gs: GameState): void {
  for (let index = gs.pickups.length - 1; index >= 0; index--) {
    const pickup = gs.pickups[index];
    if (!pickup) continue;
    const distance = Math.hypot(gs.player.x - pickup.x, gs.player.y - pickup.y);
    if (distance > 1.2) continue;

    if (pickup.kind === 'cargo') {
      gs.player.gold += pickup.value;
      gs.player.unsharedGold += Math.round(pickup.value * 0.5);
      emitEvent(gs, { kind: 'log', msg: `💰 Grabbed floating cargo worth ${pickup.value}g`, tone: 'g' });
    } else if (pickup.kind === 'map') {
      assignHiddenTreasureMap(gs, pickup.source);
      emitEvent(gs, { kind: 'log', msg: `🗺 Secret map recovered from ${pickup.source}`, tone: 'o' });
    } else if (pickup.kind === 'tooth') {
      gs.player.ramBonus += 3;
      emitEvent(gs, { kind: 'log', msg: '🦷 Megalodon tooth mounted — ramming power surges!', tone: 'g' });
    }

    gs.pickups.splice(index, 1);
  }
}

export function assignHiddenTreasureMap(gs: GameState, source: string): Treasure | null {
  const hidden = gs.treasures.find(t => t.hidden && !t.looted);
  if (hidden) {
    gs.activeTreasureMapId = hidden.mapId ?? null;
    return hidden;
  }

  const candidate = gs.treasures.find(t => !t.looted && !t.hidden);
  if (!candidate) return null;
  candidate.hidden = true;
  candidate.revealed = false;
  candidate.mapId = `map-${source}-${candidate.x}-${candidate.y}`;
  candidate.fakeIsland = ((source.length + candidate.x * 7 + candidate.y * 11) % 6) === 0;
  gs.activeTreasureMapId = candidate.mapId;
  return candidate;
}

export function revealTreasureByBlast(gs: GameState, x: number, y: number): Treasure | null {
  const hidden = gs.treasures.find(t =>
    t.hidden
    && !t.revealed
    && !t.looted
    && Math.hypot(t.x + 0.5 - x, t.y + 0.5 - y) < 1.5,
  );
  if (!hidden) return null;
  hidden.revealed = true;
  hidden.hidden = false;
  emitEvent(gs, { kind: 'log', msg: '💥 X marks the spot — buried treasure erupts from the beach!', tone: 'g' });
  emitEvent(gs, { kind: 'screen_shake', msg: 'treasure' });
  if (gs.activeTreasureMapId === hidden.mapId) gs.activeTreasureMapId = null;
  return hidden;
}
