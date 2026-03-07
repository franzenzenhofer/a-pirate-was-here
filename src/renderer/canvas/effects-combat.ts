import { TILE_PX } from '../../config/world';
import type { Cannonball, Particle } from '../../core/types';
import type { Camera } from '../camera';

export function drawCannonballs(
  ctx: CanvasRenderingContext2D,
  balls: Cannonball[],
  cam: Camera,
): void {
  for (const ball of balls) {
    drawCannonballTrail(ctx, ball, cam);
    drawCannonballBody(ctx, ball, cam);
  }
}

export function drawParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  cam: Camera,
): void {
  for (const particle of particles) {
    const x = (particle.x - cam.x) * TILE_PX;
    const y = (particle.y - cam.y) * TILE_PX;
    ctx.globalAlpha = particle.life / particle.maxLife;
    ctx.fillStyle = particle.col;
    ctx.fillRect(x - particle.sz / 2, y - particle.sz / 2, particle.sz, particle.sz);
    if (particle.col === '#ff6622' || particle.col === '#ff8822') {
      ctx.globalAlpha *= 0.35;
      ctx.fillStyle = '#111';
      ctx.fillRect(x - particle.sz, y - particle.sz, particle.sz * 1.8, particle.sz * 1.8);
    }
  }
  ctx.globalAlpha = 1;
}

function drawCannonballTrail(
  ctx: CanvasRenderingContext2D,
  ball: Cannonball,
  cam: Camera,
): void {
  if (ball.trail.length <= 1) return;
  ctx.strokeStyle = ball.kind === 'cursed'
    ? 'rgba(120,255,170,0.5)'
    : ball.isPlayer ? 'rgba(255,220,50,0.45)' : 'rgba(255,80,80,0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let index = 0; index < ball.trail.length; index++) {
    const point = ball.trail[index]!;
    const x = (point.x - cam.x) * TILE_PX;
    const y = (point.y - cam.y) * TILE_PX;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function drawCannonballBody(
  ctx: CanvasRenderingContext2D,
  ball: Cannonball,
  cam: Camera,
): void {
  const x = (ball.x - cam.x) * TILE_PX;
  const y = (ball.y - cam.y) * TILE_PX;
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = ball.kind === 'cursed' ? '#88ffbb' : ball.isPlayer ? '#ffee88' : '#ff8866';
  ctx.beginPath();
  ctx.arc(x, y, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = ball.kind === 'cursed' ? '#33dd88' : ball.isPlayer ? '#ffee44' : '#ff5533';
  ctx.beginPath();
  ctx.arc(x, y, 2.5, 0, Math.PI * 2);
  ctx.fill();
}
