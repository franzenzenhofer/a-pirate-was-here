export function drawMonsterShip(
  ctx: CanvasRenderingContext2D,
  tk: string,
  scale: number,
): boolean {
  if (tk === 'MEGALODON') {
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = '#7a8998';
    ctx.beginPath();
    ctx.moveTo(0, -scale * 2.1);
    ctx.lineTo(-scale * 0.6, scale * 0.8);
    ctx.lineTo(0, scale * 0.2);
    ctx.lineTo(scale * 0.6, scale * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#dbe7ef';
    ctx.fillRect(-1, -scale * 1.4, 2, scale * 0.9);
    return true;
  }
  if (tk !== 'CRAB_LEVIATHAN') return false;
  ctx.fillStyle = '#8b6540';
  ctx.fillRect(-scale * 1.1, -scale * 0.9, scale * 2.2, scale * 1.8);
  ctx.fillStyle = '#d0a76b';
  ctx.fillRect(-scale * 0.5, -scale * 0.55, scale, scale * 0.5);
  for (const lx of [-1, 1]) {
    for (const ly of [-0.9, -0.3, 0.3, 0.9]) {
      ctx.fillRect(lx * scale * 1.1, ly * scale * 0.6, lx * scale * 0.35, scale * 0.1);
    }
  }
  return true;
}
