import { TILE_PX } from '../config/world';
import type { Camera } from '../renderer/camera';
import { clampCamera } from '../renderer/camera';

export interface InputState {
  panStart: { x: number; y: number } | null;
  panCamStart: { x: number; y: number } | null;
  touchStart: number;
  startX: number;
  startY: number;
  panned: boolean;
}

export function createInputState(): InputState {
  return { panStart: null, panCamStart: null, touchStart: 0, startX: 0, startY: 0, panned: false };
}

export function resetInputState(input: InputState): void {
  input.panStart = null;
  input.panCamStart = null;
  input.panned = false;
}

export function handlePointerDown(
  input: InputState,
  cx: number, cy: number,
  cam: Camera,
): void {
  input.startX = cx;
  input.startY = cy;
  input.touchStart = Date.now();
  input.panned = false;
  input.panStart = { x: cx, y: cy };
  input.panCamStart = { x: cam.x, y: cam.y };
}

export function handlePointerMove(
  input: InputState,
  cx: number, cy: number,
  cam: Camera,
): void {
  if (!input.panStart || !input.panCamStart) return;
  if (Math.abs(cx - input.panStart.x) + Math.abs(cy - input.panStart.y) > 6) {
    input.panned = true;
  }
  cam.x = input.panCamStart.x - (cx - input.panStart.x) / TILE_PX;
  cam.y = input.panCamStart.y - (cy - input.panStart.y) / TILE_PX;
  clampCamera(cam);
}

export interface TapResult {
  type: 'navigate' | 'port';
  wx: number;
  wy: number;
}

/**
 * Handle pointer up — returns tap result if it was a tap (not a pan).
 * IMPROVED: increased tap threshold time for better mobile responsiveness.
 */
export function handlePointerUp(
  input: InputState,
  cx: number, cy: number,
  cam: Camera,
): TapResult | null {
  if (!input.panStart) return null;
  resetInputState(input);

  // Was it a tap? (not a pan, within 550ms for better mobile forgiveness)
  if (!input.panned && Date.now() - input.touchStart < 550) {
    const wx = cam.x + cx / TILE_PX;
    const wy = cam.y + cy / TILE_PX;
    return { type: 'navigate', wx, wy };
  }

  return null;
}

/** Set up all touch and mouse event listeners */
export function setupInputListeners(
  canvas: HTMLCanvasElement,
  input: InputState,
  cam: Camera,
  onTap: (result: TapResult) => void,
): void {
  const clear = (): void => resetInputState(input);
  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    const t = e.touches[0];
    if (t) handlePointerDown(input, t.clientX, t.clientY, cam);
  }, { passive: false });

  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    const t = e.touches[0];
    if (t) handlePointerMove(input, t.clientX, t.clientY, cam);
  }, { passive: false });

  canvas.addEventListener('touchend', e => {
    e.preventDefault();
    const t = e.changedTouches[0];
    if (t) {
      const result = handlePointerUp(input, t.clientX, t.clientY, cam);
      if (result) onTap(result);
    }
  }, { passive: false });
  canvas.addEventListener('touchcancel', clear, { passive: true });

  canvas.addEventListener('mousedown', e => {
    handlePointerDown(input, e.clientX, e.clientY, cam);
  });

  canvas.addEventListener('mousemove', e => {
    if (e.buttons) handlePointerMove(input, e.clientX, e.clientY, cam);
  });

  canvas.addEventListener('mouseup', e => {
    const result = handlePointerUp(input, e.clientX, e.clientY, cam);
    if (result) onTap(result);
  });
  canvas.addEventListener('mouseleave', clear);
  window.addEventListener('mouseup', clear);
  window.addEventListener('blur', clear);
}
