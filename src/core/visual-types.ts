import type { Vec2 } from './types';

export interface Cannonball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isPlayer: boolean;
  dmg: number;
  dist: number;
  maxDist: number;
  trail: Vec2[];
  fromX: number;
  fromY: number;
  kind?: 'normal' | 'cursed';
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  col: string;
  sz: number;
}

export interface Treasure {
  x: number;
  y: number;
  gold: number;
  looted: boolean;
  hidden?: boolean;
  revealed?: boolean;
  mapId?: string;
  fakeIsland?: boolean;
}
