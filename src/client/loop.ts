/** Game loop with delta time clamping */
export function startLoop(updateFn: (dt: number) => void): void {
  let lastTs = 0;

  function frame(ts: number): void {
    const dt = Math.min(ts - lastTs, 50); // Cap at 50ms to prevent spiral
    lastTs = ts;
    updateFn(dt);
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(ts => {
    lastTs = ts;
    frame(ts);
  });
}
