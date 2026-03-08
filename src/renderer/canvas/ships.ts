import { TILE_PX } from '../../config/world';
import { drawNationPennant } from './pennants';
import { shipHullFor } from './ship-hulls';
import { drawMonsterShip } from './ship-monsters';

export { drawHealthBar, drawWake } from './ship-effects';

const OUTLINE = '#091224';
const SAIL = '#f6f1db';
const SAIL_SHADE = '#d9d0b3';
const MAST = '#4d3522';
const GHOST_GLOW = 'rgba(180,255,255,0.24)';
const FIRE_GLOW = 'rgba(255,180,80,0.34)';

export function drawShip(
  ctx: CanvasRenderingContext2D,
  sx: number, sy: number,
  ang: number, col: string, tk: string,
  scale: number, disabled: boolean,
  nation: string,
  hpRatio: number = 1,
): void {
  const hull = shipHullFor(tk);
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(ang + Math.PI / 2);
  const s = TILE_PX * 0.36 * scale;
  const isGhost = tk === 'DREAD_GHOST';
  const isMonster = tk === 'MEGALODON' || tk === 'CRAB_LEVIATHAN';
  const isBurning = tk === 'FIRESHIP' || hpRatio < 0.35;
  if (drawMonsterShip(ctx, tk, s)) {
    ctx.restore();
    return;
  }
  const halfW = s * hull.w * 0.5;
  const deckTop = -s * hull.l * 0.46;
  const deckBottom = s * hull.l * 0.46;
  const sternTop = s * hull.l * 0.28;

  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.fillRect(-halfW + 1, -s * hull.l * 0.5 + 1, halfW * 2, s * hull.l);
  ctx.globalAlpha = isGhost ? 0.7 : 1;
  drawHullOutline(ctx, halfW, deckTop, deckBottom, sternTop, s, hull.l);
  drawHullBody(ctx, disabled ? '#4a3626' : col, halfW, deckTop, deckBottom, sternTop, s, hull.l);
  drawDeck(ctx, disabled ? '#5b4631' : lightenColor(col, 0.28), halfW, deckTop, deckBottom, s);
  drawKeelStripe(ctx, halfW, deckTop, s);
  drawPlanks(ctx, halfW, deckTop, deckBottom, s);

  ctx.fillStyle = MAST;
  ctx.fillRect(-1.5, -s * hull.l * 0.68, 3, s * hull.l * 0.92);
  if (!disabled) {
    drawSail(ctx, -s * hull.sailW, -s * hull.l * 0.46, s * hull.sailW * 2, s * hull.mainSail);
  } else {
    ctx.fillStyle = 'rgba(100,80,50,0.45)';
    ctx.fillRect(-s * 0.3, -s * 1.1, s * 0.4, s * 0.65);
  }
  if (!['CUTTER', 'SLOOP', 'FIRESHIP'].includes(tk) && !disabled) {
    drawSail(ctx, -s * 0.28, -s * hull.l * 0.75, s * 0.56, s * 0.52);
    ctx.fillStyle = MAST;
    ctx.fillRect(-1, -s * hull.l * 0.84, 2, s * 0.42);
  }
  if (hull.masts > 1 && !disabled) {
    ctx.fillStyle = MAST;
    ctx.fillRect(-1, s * 0.18, 2, s * 1.2);
    drawSail(ctx, -s * 0.38, s * 0.28, s * 0.76, s * 0.7);
  }

  if (hull.masts > 2 && !disabled) {
    ctx.fillStyle = MAST;
    ctx.fillRect(-1, -s * 0.08, 2, s * 0.95);
    drawSail(ctx, -s * 0.3, -s * 0.08, s * 0.6, s * 0.42);
  }
  drawGunports(ctx, hull.guns, s);
  drawCabinLights(ctx, tk, disabled, s, hull);
  drawBowsprit(ctx, disabled, s, hull);
  drawRigging(ctx, disabled, s, hull);

  if (!disabled) {
    drawNationPennant(ctx, -s * 0.05, -s * hull.l * 0.94, nation, Math.max(0.35, s * 0.12));
  }
  if (isGhost && !disabled) {
    ctx.fillStyle = GHOST_GLOW;
    ctx.fillRect(-s * 1.1, -s * 1.8, s * 2.2, s * 3.2);
  }
  if (tk === 'FIRESHIP' && !disabled) {
    ctx.fillStyle = FIRE_GLOW;
    ctx.fillRect(-s * 0.4, -s * 0.7, s * 0.8, s * 0.9);
    ctx.fillStyle = '#ffec9d';
    ctx.fillRect(-s * 0.12, -s * 0.55, s * 0.24, s * 0.18);
  }
  if (disabled) {
    ctx.strokeStyle = '#c18a44';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-s * 0.45, -s * 0.35);
    ctx.lineTo(s * 0.45, s * 0.35);
    ctx.moveTo(s * 0.45, -s * 0.35);
    ctx.lineTo(-s * 0.45, s * 0.35);
    ctx.stroke();
  }
  if (!isMonster && hpRatio < 0.68) {
    ctx.fillStyle = 'rgba(35,35,35,0.42)';
    ctx.fillRect(-s * 0.12, -s * 1.2, s * 0.22, s * 0.38);
    ctx.fillRect(s * 0.14, -s * 1.45, s * 0.3, s * 0.46);
  }
  if (isBurning && !disabled) {
    ctx.fillStyle = 'rgba(255,190,70,0.45)';
    ctx.fillRect(-s * 0.26, -s * 0.7, s * 0.52, s * 0.52);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawHullOutline(
  ctx: CanvasRenderingContext2D,
  halfW: number,
  deckTop: number,
  deckBottom: number,
  sternTop: number,
  s: number,
  hullL: number,
): void {
  ctx.fillStyle = OUTLINE;
  ctx.beginPath();
  ctx.moveTo(0, -s * hullL * 0.78);
  ctx.lineTo(-halfW - 1.5, deckTop - 1.5);
  ctx.lineTo(-halfW - 2, sternTop);
  ctx.lineTo(-halfW * 0.84, deckBottom + 1.5);
  ctx.lineTo(halfW * 0.84, deckBottom + 1.5);
  ctx.lineTo(halfW + 2, sternTop);
  ctx.lineTo(halfW + 1.5, deckTop - 1.5);
  ctx.closePath();
  ctx.fill();
}

function drawHullBody(
  ctx: CanvasRenderingContext2D,
  color: string,
  halfW: number,
  deckTop: number,
  deckBottom: number,
  sternTop: number,
  s: number,
  hullL: number,
): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -s * hullL * 0.72);
  ctx.lineTo(-halfW, deckTop);
  ctx.lineTo(-halfW * 1.12, sternTop);
  ctx.lineTo(-halfW * 0.8, deckBottom);
  ctx.lineTo(halfW * 0.8, deckBottom);
  ctx.lineTo(halfW * 1.12, sternTop);
  ctx.lineTo(halfW, deckTop);
  ctx.closePath();
  ctx.fill();
}

function drawDeck(
  ctx: CanvasRenderingContext2D,
  deckColor: string,
  halfW: number,
  deckTop: number,
  deckBottom: number,
  s: number,
): void {
  ctx.fillStyle = deckColor;
  ctx.fillRect(-halfW * 0.72, deckTop + s * 0.22, halfW * 1.44, deckBottom - deckTop - s * 0.54);
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.fillRect(-halfW * 0.64, deckTop + s * 0.28, halfW * 1.28, s * 0.12);
}

function drawKeelStripe(
  ctx: CanvasRenderingContext2D,
  halfW: number,
  deckTop: number,
  s: number,
): void {
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(-halfW * 0.48, -s * 0.02, halfW * 0.96, s * 0.16);
  ctx.fillStyle = 'rgba(255,230,190,0.2)';
  ctx.fillRect(-halfW * 0.46, -s * 0.16, halfW * 0.92, s * 0.08);
  ctx.fillRect(-halfW * 0.36, deckTop + s * 0.64, halfW * 0.72, s * 0.08);
}

function drawPlanks(
  ctx: CanvasRenderingContext2D,
  halfW: number,
  deckTop: number,
  deckBottom: number,
  s: number,
): void {
  ctx.fillStyle = 'rgba(72,48,30,0.26)';
  for (let y = deckTop + s * 0.38; y < deckBottom - s * 0.22; y += s * 0.26) {
    ctx.fillRect(-halfW * 0.66, y, halfW * 1.32, 1);
  }
}

function drawSail(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(x - 1, y - 1, width + 2, height + 2);
  ctx.fillStyle = SAIL;
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = SAIL_SHADE;
  ctx.fillRect(x + width * 0.55, y, width * 0.18, height);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(x + width * 0.12, y + 1, width * 0.18, height - 2);
}

function drawGunports(ctx: CanvasRenderingContext2D, count: number, s: number): void {
  for (let i = 0; i < count; i++) {
    const cy = -s * 0.82 + i * (s * 0.52);
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(-s * 0.97, cy - 1, s * 0.57, s * 0.22 + 2);
    ctx.fillRect(s * 0.40, cy - 1, s * 0.57, s * 0.22 + 2);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(-s * 0.94, cy, s * 0.5, s * 0.18);
    ctx.fillRect(s * 0.44, cy, s * 0.5, s * 0.18);
    ctx.fillStyle = '#6b7885';
    ctx.fillRect(-s * 0.85, cy + s * 0.04, s * 0.12, s * 0.08);
    ctx.fillRect(s * 0.73, cy + s * 0.04, s * 0.12, s * 0.08);
  }
}

function drawCabinLights(
  ctx: CanvasRenderingContext2D,
  tk: string,
  disabled: boolean,
  s: number,
  hull: ReturnType<typeof shipHullFor>,
): void {
  if (disabled) return;
  ctx.fillStyle = '#5a3317';
  ctx.fillRect(-s * 0.22, s * hull.l * 0.24, s * 0.44, s * 0.24);
  if (tk === 'CUTTER' || tk === 'SLOOP') return;
  ctx.fillStyle = '#ffd78c';
  ctx.fillRect(-s * 0.12, s * hull.l * 0.27, s * 0.09, s * 0.09);
  ctx.fillRect(s * 0.03, s * hull.l * 0.27, s * 0.09, s * 0.09);
}

function drawBowsprit(
  ctx: CanvasRenderingContext2D,
  disabled: boolean,
  s: number,
  hull: ReturnType<typeof shipHullFor>,
): void {
  if (disabled) return;
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(-1, -s * hull.l * 1.02, 2, s * 0.34);
  ctx.fillStyle = MAST;
  ctx.fillRect(-0.5, -s * hull.l * 0.98, 1, s * 0.28);
}

function drawRigging(
  ctx: CanvasRenderingContext2D,
  disabled: boolean,
  s: number,
  hull: ReturnType<typeof shipHullFor>,
): void {
  if (disabled) return;
  ctx.strokeStyle = 'rgba(32,22,14,0.45)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -s * hull.l * 0.54);
  ctx.lineTo(-s * hull.sailW * 0.86, -s * hull.l * 0.28);
  ctx.moveTo(0, -s * hull.l * 0.2);
  ctx.lineTo(s * hull.sailW * 0.86, -s * hull.l * 0.05);
  if (hull.masts > 1) {
    ctx.moveTo(0, s * 0.22);
    ctx.lineTo(-s * 0.34, s * 0.72);
    ctx.moveTo(0, s * 0.22);
    ctx.lineTo(s * 0.34, s * 0.72);
  }
  ctx.stroke();
}

function lightenColor(hex: string, amount: number): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return hex;
  const [r = 0, g = 0, b = 0] = [0, 2, 4].map(offset => parseInt(clean.slice(offset, offset + 2), 16));
  const mix = (value: number) => Math.round(value + (255 - value) * amount);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}
