import type { WindState } from '../../sim/nav/wind';

/** Draw wind compass indicator */
export function drawCompass(
  ctx: CanvasRenderingContext2D,
  wind: WindState,
): void {
  const cx = 20;
  const cy = 20;
  const r = 16;

  ctx.clearRect(0, 0, 40, 40);

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
  ctx.font = '5px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('N', cx, cy - r + 4);
  ctx.fillText('S', cx, cy + r - 4);
  ctx.fillText('E', cx + r - 4, cy);
  ctx.fillText('W', cx - r + 4, cy);

  // Wind arrow
  const wa = wind.angle - Math.PI / 2; // rotate so 0 = north
  const arrowLen = r * 0.65 * (0.5 + wind.strength * 0.5);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(wa);

  ctx.strokeStyle = '#44aaff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -arrowLen);
  ctx.stroke();

  // Arrowhead
  ctx.fillStyle = '#44aaff';
  ctx.beginPath();
  ctx.moveTo(0, -arrowLen - 3);
  ctx.lineTo(-3, -arrowLen + 2);
  ctx.lineTo(3, -arrowLen + 2);
  ctx.fill();

  ctx.restore();
}
