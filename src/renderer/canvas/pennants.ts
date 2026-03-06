import { nationStyle, normalizeNationKey } from '../../core/nation-style';

export function drawNationPennant(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  nation: string,
  scale = 1,
): void {
  const style = nationStyle(nation);
  const mastHeight = 11 * scale;
  const width = 12 * scale;
  const height = 7 * scale;
  const tail = 4 * scale;

  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));

  ctx.fillStyle = '#cdbda1';
  ctx.fillRect(-1 * scale, -1 * scale, Math.max(1, scale), mastHeight + 2 * scale);

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(width, 0);
  ctx.lineTo(width + tail, height / 2);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fillStyle = style.primary;
  ctx.fill();

  ctx.strokeStyle = style.accent;
  ctx.lineWidth = Math.max(1, scale * 0.8);
  ctx.stroke();

  if (normalizeNationKey(nation) === 'PIRATE') {
    ctx.fillStyle = style.accent;
    ctx.fillRect(3 * scale, 2 * scale, 2 * scale, 2 * scale);
    ctx.fillRect(7 * scale, 2 * scale, 2 * scale, 2 * scale);
    ctx.fillRect(5 * scale, 4 * scale, 2 * scale, 2 * scale);
  } else {
    ctx.fillStyle = style.accent;
    ctx.fillRect(3 * scale, 2 * scale, 5 * scale, Math.max(1, scale));
    ctx.fillRect(3 * scale, 4 * scale, 4 * scale, Math.max(1, scale));
  }

  ctx.restore();
}
