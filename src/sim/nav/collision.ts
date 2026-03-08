import { isSail } from '../world/gen';

const DRIFT_COOLDOWN_MS = 900;
const DRIFT_SPEED_MIN = 1;
const DRIFT_PUSH_MIN = 0.18;
const DRIFT_SPEED_DAMPING = 0.55;
const BLOCKED_SPEED_DAMPING = 0.35;
const SLIDE_SPEED_DAMPING = 0.88;
const TARGET_RAY_STEP = 0.35;

export interface NavigatingShip {
  x: number;
  y: number;
  angle: number;
  speed: number;
  hp?: number;
  impactT?: number;
}

interface StepCandidate {
  x: number;
  y: number;
  dx: number;
  dy: number;
}

export function isSailablePoint(tiles: Uint8Array, x: number, y: number): boolean {
  return isSail(tiles, Math.floor(x), Math.floor(y));
}

export function clampTargetToSea(
  tiles: Uint8Array,
  originX: number,
  originY: number,
  targetX: number,
  targetY: number,
): { x: number; y: number } {
  if (isSailablePoint(tiles, targetX, targetY)) return { x: targetX, y: targetY };

  const dx = targetX - originX;
  const dy = targetY - originY;
  const distance = Math.hypot(dx, dy);
  let lastSafe = isSailablePoint(tiles, originX, originY) ? { x: originX, y: originY } : null;

  if (distance > 0) {
    const steps = Math.max(1, Math.ceil(distance / TARGET_RAY_STEP));
    for (let step = 1; step <= steps; step++) {
      const t = step / steps;
      const x = originX + dx * t;
      const y = originY + dy * t;
      if (!isSailablePoint(tiles, x, y)) break;
      lastSafe = { x, y };
    }
  }

  return lastSafe ?? findNearestSailablePoint(tiles, targetX, targetY) ?? { x: originX, y: originY };
}

export function findNearestSailablePoint(
  tiles: Uint8Array,
  x: number,
  y: number,
  maxRadius = 4,
): { x: number; y: number } | null {
  const originTileX = Math.floor(x);
  const originTileY = Math.floor(y);
  let best: { x: number; y: number } | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let radius = 1; radius <= maxRadius; radius++) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) continue;
        const tileX = originTileX + dx;
        const tileY = originTileY + dy;
        if (!isSail(tiles, tileX, tileY)) continue;
        const candidate = { x: tileX + 0.5, y: tileY + 0.5 };
        const distance = Math.hypot(candidate.x - x, candidate.y - y);
        if (distance >= bestDistance) continue;
        best = candidate;
        bestDistance = distance;
      }
    }
    if (best) return best;
  }

  return null;
}

export function resolveShipStep(
  ship: NavigatingShip,
  stepX: number,
  stepY: number,
  targetX: number,
  targetY: number,
  tiles: Uint8Array,
): boolean {
  const fullStep = candidateStep(ship.x, ship.y, stepX, stepY);
  if (canOccupy(tiles, fullStep.x, fullStep.y)) {
    ship.x = fullStep.x;
    ship.y = fullStep.y;
    return true;
  }

  const slide = chooseSlide(ship, stepX, stepY, targetX, targetY, tiles);
  if (slide) {
    ship.x = slide.x;
    ship.y = slide.y;
    ship.angle = Math.atan2(slide.dy, slide.dx);
    ship.speed *= SLIDE_SPEED_DAMPING;
    return true;
  }

  if (attemptCoastDrift(ship, stepX, stepY, tiles)) return true;

  ship.speed *= BLOCKED_SPEED_DAMPING;
  return false;
}

function chooseSlide(
  ship: NavigatingShip,
  stepX: number,
  stepY: number,
  targetX: number,
  targetY: number,
  tiles: Uint8Array,
): StepCandidate | null {
  const candidates: StepCandidate[] = [];

  if (Math.abs(stepX) > 1e-6) {
    const xOnly = candidateStep(ship.x, ship.y, stepX, 0);
    if (canOccupy(tiles, xOnly.x, xOnly.y)) candidates.push(xOnly);
  }
  if (Math.abs(stepY) > 1e-6) {
    const yOnly = candidateStep(ship.x, ship.y, 0, stepY);
    if (canOccupy(tiles, yOnly.x, yOnly.y)) candidates.push(yOnly);
  }
  if (candidates.length === 0) return null;

  candidates.sort((left, right) => {
    const leftScore = distanceToTarget(left.x, left.y, targetX, targetY);
    const rightScore = distanceToTarget(right.x, right.y, targetX, targetY);
    if (leftScore !== rightScore) return leftScore - rightScore;
    return Math.hypot(right.dx, right.dy) - Math.hypot(left.dx, left.dy);
  });

  return candidates[0] ?? null;
}

function attemptCoastDrift(
  ship: NavigatingShip,
  stepX: number,
  stepY: number,
  tiles: Uint8Array,
): boolean {
  const stepLength = Math.hypot(stepX, stepY);
  if (stepLength <= 1e-6 || ship.speed < DRIFT_SPEED_MIN || (ship.impactT ?? 0) > 0) return false;

  const normalX = stepX / stepLength;
  const normalY = stepY / stepLength;
  const push = Math.max(DRIFT_PUSH_MIN, stepLength * 5);
  const lateralMoves: Array<{ dx: number; dy: number }> = [
    { dx: -normalY * push, dy: normalX * push },
    { dx: normalY * push, dy: -normalX * push },
  ];

  for (const lateral of lateralMoves) {
    const nextX = ship.x + lateral.dx;
    const nextY = ship.y + lateral.dy;
    if (!canOccupy(tiles, nextX, nextY)) continue;
    ship.x = nextX;
    ship.y = nextY;
    ship.angle = Math.atan2(lateral.dy, lateral.dx);
    ship.speed *= DRIFT_SPEED_DAMPING;
    ship.impactT = DRIFT_COOLDOWN_MS;
    if (typeof ship.hp === 'number') ship.hp = Math.max(0, ship.hp - 1);
    return true;
  }

  return false;
}

function canOccupy(tiles: Uint8Array, x: number, y: number): boolean {
  return isSailablePoint(tiles, x, y);
}

function candidateStep(x: number, y: number, dx: number, dy: number): StepCandidate {
  return { x: x + dx, y: y + dy, dx, dy };
}

function distanceToTarget(x: number, y: number, targetX: number, targetY: number): number {
  return Math.hypot(targetX - x, targetY - y);
}
