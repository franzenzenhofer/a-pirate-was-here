let shakeT = 0;
let shakeStrength = 0;

export function triggerScreenShake(kind: string = 'hit'): void {
  shakeT = kind === 'brawl' ? 420 : kind === 'treasure' ? 220 : 300;
  shakeStrength = kind === 'brawl' ? 8 : kind === 'treasure' ? 4 : 6;
}

export function applyScreenShake(canvas: HTMLCanvasElement, dt: number, reducedMotion: boolean): void {
  if (reducedMotion || shakeT <= 0) {
    if (canvas.style.transform) canvas.style.transform = '';
    shakeT = 0;
    return;
  }
  shakeT = Math.max(0, shakeT - dt);
  const dx = (Math.random() - 0.5) * shakeStrength;
  const dy = (Math.random() - 0.5) * shakeStrength;
  canvas.style.transform = `translate(${dx}px, ${dy}px)`;
  if (shakeT <= 0) canvas.style.transform = '';
}
