import type { PlayerShip } from '../core/types';
import type { Camera } from '../renderer/camera';
import { clampCamera } from '../renderer/camera';
import { TILE_PX } from '../config/world';

export interface KeyState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  space: boolean;
}

export function createKeyState(): KeyState {
  return { up: false, down: false, left: false, right: false, space: false };
}

export function setupKeyboardListeners(keys: KeyState): void {
  const handle = (e: KeyboardEvent, pressed: boolean) => {
    switch (e.key) {
      case 'w': case 'ArrowUp': keys.up = pressed; break;
      case 's': case 'ArrowDown': keys.down = pressed; break;
      case 'a': case 'ArrowLeft': keys.left = pressed; break;
      case 'd': case 'ArrowRight': keys.right = pressed; break;
      case ' ': keys.space = pressed; break;
    }
  };
  window.addEventListener('keydown', e => handle(e, true));
  window.addEventListener('keyup', e => handle(e, false));
}

/** Apply keyboard input to set navigation target ahead of ship */
export function applyKeyboardNav(
  keys: KeyState,
  player: PlayerShip,
  cam: Camera,
): void {
  if (!keys.up && !keys.down && !keys.left && !keys.right) return;

  let dx = 0, dy = 0;
  if (keys.up) dy = -1;
  if (keys.down) dy = 1;
  if (keys.left) dx = -1;
  if (keys.right) dx = 1;

  if (dx === 0 && dy === 0) return;

  // Set target 8 tiles ahead in pressed direction
  const dist = 8;
  const angle = Math.atan2(dy, dx);
  player.targetX = player.x + Math.cos(angle) * dist;
  player.targetY = player.y + Math.sin(angle) * dist;

  // Camera follows
  const targetCamX = player.x - cam.screenW / TILE_PX / 2;
  const targetCamY = player.y - cam.screenH / TILE_PX / 2;
  cam.x += (targetCamX - cam.x) * 0.1;
  cam.y += (targetCamY - cam.y) * 0.1;
  clampCamera(cam);
}
