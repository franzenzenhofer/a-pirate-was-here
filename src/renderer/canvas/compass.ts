import type { WindState } from '../../sim/nav/wind';

/** Draw wind compass indicator */
export function drawCompass(
  ctx: CanvasRenderingContext2D,
  wind: WindState,
): void {
  const size = Math.min(ctx.canvas.width, ctx.canvas.height);
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 8;

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Background
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.beginPath();
  ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
  ctx.fill();

  // Compass ring
  ctx.strokeStyle = '#334477';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  // Cardinal points
  ctx.fillStyle = '#668899';
  ctx.font = '16px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('N', cx, cy - r + 8);
  ctx.fillText('S', cx, cy + r - 8);
  ctx.fillText('E', cx + r - 8, cy);
  ctx.fillText('W', cx - r + 8, cy);

  // Wind arrow
  const wa = wind.angle - Math.PI / 2; // rotate so 0 = north
  const arrowLen = r * 0.62 * (0.5 + wind.strength * 0.5);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(wa);

  ctx.strokeStyle = '#44aaff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -arrowLen);
  ctx.stroke();

  // Arrowhead
  ctx.fillStyle = '#44aaff';
  ctx.beginPath();
  ctx.moveTo(0, -arrowLen - 5);
  ctx.lineTo(-5, -arrowLen + 3);
  ctx.lineTo(5, -arrowLen + 3);
  ctx.fill();

  ctx.restore();
}
