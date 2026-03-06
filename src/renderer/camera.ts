import { WORLD_W, WORLD_H, TILE_PX } from '../config/world';
import { clamp } from '../core/math';

export interface Camera {
  x: number;
  y: number;
  screenW: number;
  screenH: number;
}

export function createCamera(px: number, py: number, sw: number, sh: number): Camera {
  return { x: px - sw / TILE_PX / 2, y: py - sh / TILE_PX / 2, screenW: sw, screenH: sh };
}

export function clampCamera(cam: Camera): void {
  cam.x = clamp(cam.x, 0, WORLD_W - cam.screenW / TILE_PX);
  cam.y = clamp(cam.y, 0, WORLD_H - cam.screenH / TILE_PX);
}

/** Smooth follow a target position */
export function followTarget(cam: Camera, tx: number, ty: number, smoothing: number): void {
  const targetCamX = tx - cam.screenW / TILE_PX / 2;
  const targetCamY = ty - cam.screenH / TILE_PX / 2;
  cam.x += (targetCamX - cam.x) * smoothing;
  cam.y += (targetCamY - cam.y) * smoothing;
  clampCamera(cam);
}

/** Convert screen coordinates to world coordinates */
export function screenToWorld(cam: Camera, sx: number, sy: number): { wx: number; wy: number } {
  return {
    wx: cam.x + sx / TILE_PX,
    wy: cam.y + sy / TILE_PX,
  };
}

/** Convert world coordinates to screen coordinates */
export function worldToScreen(cam: Camera, wx: number, wy: number): { sx: number; sy: number } {
  return {
    sx: (wx - cam.x) * TILE_PX,
    sy: (wy - cam.y) * TILE_PX,
  };
}

export function resize(cam: Camera, w: number, h: number): void {
  cam.screenW = w;
  cam.screenH = h;
}
