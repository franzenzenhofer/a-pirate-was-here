import { WIND_CHANGE_MIN, WIND_CHANGE_VAR } from '../../config/world';

export interface WindState {
  angle: number;
  strength: number;
  timer: number;
}

export function createWind(): WindState {
  return {
    angle: Math.random() * Math.PI * 2,
    strength: 0.6 + Math.random() * 0.4,
    timer: 0,
  };
}

export function updateWind(wind: WindState, dt: number): void {
  wind.timer += dt;
  if (wind.timer > WIND_CHANGE_MIN + Math.random() * WIND_CHANGE_VAR) {
    wind.timer = 0;
    wind.angle += (Math.random() - 0.5) * Math.PI * 0.8;
    wind.strength = 0.35 + Math.random() * 0.75;
  }
}

/** Wind direction as compass string */
export function windDirStr(angle: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[~~(angle / (Math.PI / 4)) & 7] ?? 'N';
}

/** Wind strength as visual bar */
export function windStrBar(strength: number): string {
  return '░▒▓'[~~(strength * 2.9)] ?? '░';
}

/** Calculate wind speed modifier for a given ship angle (min 35% speed) */
export function windModifier(shipAngle: number, windAngle: number, bonus: number): number {
  return Math.max(0.35, 0.55 + 0.45 * Math.cos(shipAngle - windAngle) * bonus);
}
