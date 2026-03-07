import type { GameSettings } from '../core/campaign-types';
import { asPortId, asShipId } from '../core/types';
import type { EnemyShip, PlayerShip, Port } from '../core/types';

export function createTestSettings(overrides: Partial<GameSettings> = {}): GameSettings {
  return {
    audio: true,
    reducedMotion: false,
    textScale: 1,
    minimapMode: 'full',
    colorSafeHud: false,
    seaAudio: 0.7,
    musicAudio: 0.6,
    preferredSeed: 42,
    ...overrides,
  };
}

export function createTestPlayer(overrides: Partial<PlayerShip> = {}): PlayerShip {
  return {
    id: asShipId(0),
    x: 0,
    y: 0,
    angle: 0,
    speed: 0,
    targetX: null,
    targetY: null,
    hp: 14,
    maxHp: 14,
    cn: 8,
    rl: 5500,
    rng: 5.5,
    acc: 0.6,
    bspd: 2.6,
    col: '#44aaff',
    tk: 'BRIGANTINE',
    reloadT: 0,
    disabled: false,
    sunk: false,
    captured: false,
    wakePoints: [],
    turnRate: 1,
    nat: 'PIRATE',
    gold: 500,
    unsharedGold: 0,
    crew: 80,
    fame: 0,
    kills: 0,
    day: 1,
    dayT: 0,
    feverT: 0,
    hypedT: 0,
    deafenedT: 0,
    mutinyGold: 0,
    ramBonus: 0,
    fleet: [],
    cargo: [],
    upgrades: { hull: 0, sails: 0, range: 0 },
    ...overrides,
  };
}

export function createTestEnemy(overrides: Partial<EnemyShip> = {}): EnemyShip {
  return {
    id: asShipId(1),
    x: 1,
    y: 1,
    angle: 0,
    speed: 0,
    targetX: null,
    targetY: null,
    hp: 8,
    maxHp: 8,
    cn: 4,
    rl: 4500,
    rng: 4.5,
    acc: 0.55,
    bspd: 3,
    col: '#88ffaa',
    tk: 'SLOOP',
    reloadT: 0,
    disabled: false,
    sunk: false,
    captured: false,
    wakePoints: [],
    turnRate: 1.2,
    nat: 'SPAIN',
    role: 'MERCHANT',
    tier: 'I',
    ti: 0,
    beh: { aggro: 0, flee: 0.3, wander: true, portAttack: false },
    state: 'WANDER',
    stTimer: 0,
    changeT: 0,
    loot: 100,
    xp: 1,
    homePort: null,
    attackTarget: null,
    ...overrides,
  };
}

export function createTestPort(overrides: Partial<Port> = {}): Port {
  return {
    id: asPortId(0),
    x: 10,
    y: 10,
    name: 'TEST PORT',
    nat: 'SPAIN',
    rel: 'friendly',
    garrison: 10,
    wealth: 500,
    cannons: 6,
    attackTimer: 0,
    defFleet: [],
    prices: { RUM: 40, SUGAR: 25, SPICES: 80 },
    ...overrides,
  };
}
