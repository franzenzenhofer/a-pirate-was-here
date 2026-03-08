export function drawMonsterShip(
  ctx: CanvasRenderingContext2D,
  tk: string,
  scale: number,
): boolean {
  if (tk === 'MEGALODON') {
    drawMegalodon(ctx, scale);
    return true;
  }
  if (tk !== 'CRAB_LEVIATHAN') return false;
  drawCrabLeviathan(ctx, scale);
  return true;
}

function drawMegalodon(ctx: CanvasRenderingContext2D, scale: number): void {
  ctx.globalAlpha = 0.96;
  ctx.fillStyle = '#091224';
  ctx.beginPath();
  ctx.moveTo(0, -scale * 2.3);
  ctx.lineTo(-scale * 0.92, -scale * 0.2);
  ctx.lineTo(-scale * 0.58, scale * 1.55);
  ctx.lineTo(0, scale * 0.88);
  ctx.lineTo(scale * 0.58, scale * 1.55);
  ctx.lineTo(scale * 0.92, -scale * 0.2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#73859a';
  ctx.beginPath();
  ctx.moveTo(0, -scale * 2.02);
  ctx.lineTo(-scale * 0.7, -scale * 0.1);
  ctx.lineTo(-scale * 0.42, scale * 1.28);
  ctx.lineTo(0, scale * 0.72);
  ctx.lineTo(scale * 0.42, scale * 1.28);
  ctx.lineTo(scale * 0.7, -scale * 0.1);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#dbe7ef';
  ctx.fillRect(-1.3, -scale * 1.48, 2.6, scale * 1.04);
  ctx.fillStyle = '#9fb4c4';
  ctx.fillRect(-scale * 0.11, -scale * 1.25, scale * 0.22, scale * 0.76);
  ctx.fillStyle = '#091224';
  ctx.fillRect(-scale * 0.15, -scale * 0.98, scale * 0.3, scale * 0.08);
  ctx.fillRect(-scale * 0.14, -scale * 0.67, scale * 0.28, scale * 0.08);

  ctx.fillStyle = '#5b6d80';
  ctx.beginPath();
  ctx.moveTo(0, -scale * 0.4);
  ctx.lineTo(-scale * 0.46, scale * 0.18);
  ctx.lineTo(scale * 0.46, scale * 0.18);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#fffbf0';
  for (const side of [-1, 1]) {
    ctx.fillRect(side * scale * 0.18, -scale * 1.2, side * scale * 0.16, scale * 0.08);
  }
}

function drawCrabLeviathan(ctx: CanvasRenderingContext2D, scale: number): void {
  ctx.fillStyle = '#091224';
  ctx.fillRect(-scale * 1.55, -scale * 1.02, scale * 3.1, scale * 2.04);

  ctx.fillStyle = '#8b6540';
  ctx.fillRect(-scale * 1.3, -scale * 0.88, scale * 2.6, scale * 1.76);
  ctx.fillStyle = '#d2a06a';
  ctx.fillRect(-scale * 0.62, -scale * 0.5, scale * 1.24, scale * 0.56);
  ctx.fillStyle = '#f4c788';
  ctx.fillRect(-scale * 0.25, -scale * 0.18, scale * 0.5, scale * 0.18);

  ctx.fillStyle = '#ffefca';
  ctx.fillRect(-scale * 0.46, -scale * 0.18, scale * 0.16, scale * 0.16);
  ctx.fillRect(scale * 0.3, -scale * 0.18, scale * 0.16, scale * 0.16);
  ctx.fillStyle = '#3b0d12';
  ctx.fillRect(-scale * 0.4, -scale * 0.12, scale * 0.08, scale * 0.08);
  ctx.fillRect(scale * 0.32, -scale * 0.12, scale * 0.08, scale * 0.08);

  ctx.fillStyle = '#6e4930';
  for (const side of [-1, 1]) {
    for (const row of [-0.74, -0.26, 0.26, 0.74]) {
      const width = scale * 0.4;
      const x = side < 0 ? -scale * 1.56 : scale * 1.16;
      ctx.fillRect(x, row * scale, side * width, scale * 0.12);
      ctx.fillRect(x + side * width * 0.72, row * scale + scale * 0.08, side * width * 0.54, scale * 0.1);
    }
  }

  ctx.fillRect(-scale * 1.74, -scale * 0.18, scale * 0.54, scale * 0.16);
  ctx.fillRect(scale * 1.2, -scale * 0.18, scale * 0.54, scale * 0.16);
}
