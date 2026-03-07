import type { PlayerShip } from '../../core/types';
import { SHIP_TYPES, SHIP_KEYS } from '../../config/ships';

export interface UpgradeOption {
  name: string;
  cost: number;
  description: string;
  canAfford: boolean;
  action: () => string;
}

const HULL_STEP = 4;
const SAIL_STEP = 0.15;
const RANGE_STEP = 1;
const SPECIAL_SHIP_OFFERS = [
  { key: 'FIRESHIP', fame: 40, blurb: 'volatile raider with brutal close pressure' },
  { key: 'CORVETTE', fame: 90, blurb: 'agile warship with sharper broadsides' },
] as const;

function sailLimit(tk: string): number {
  if (tk === 'GALLEON' || tk === 'MAN_O_WAR') return 2;
  if (tk === 'FRIGATE') return 3;
  return 4;
}

function applyShipBonuses(player: PlayerShip, preserveHp: boolean): void {
  const base = SHIP_TYPES[player.tk];
  if (!base) return;
  const hpRatio = player.maxHp > 0 ? player.hp / player.maxHp : 1;
  player.maxHp = base.hp + player.upgrades.hull * HULL_STEP;
  player.hp = preserveHp ? Math.max(1, Math.round(player.maxHp * hpRatio)) : player.maxHp;
  player.rng = base.rng + player.upgrades.range * RANGE_STEP;
  player.bspd = base.spd + player.upgrades.sails * SAIL_STEP;
  player.rl = base.rl;
  player.acc = base.acc;
  player.turnRate = base.turn;
  player.col = base.col;
}

/** Get available ship upgrades at a friendly port */
export function getUpgradeOptions(player: PlayerShip): UpgradeOption[] {
  const options: UpgradeOption[] = [];

  // Hull reinforcement
  const hullCost = player.maxHp * 25;
  options.push({
    name: '🛡️ REINFORCE HULL',
    cost: hullCost,
    description: `+4 max HP (${hullCost}g)`,
    canAfford: player.gold >= hullCost,
    action: () => {
      player.gold -= hullCost;
      player.upgrades.hull++;
      player.maxHp += HULL_STEP;
      player.hp += HULL_STEP;
      return `Hull reinforced! Max HP: ${player.maxHp}`;
    },
  });

  // Sail upgrade — speed boost
  const sailCost = 400 + player.bspd * 200;
  options.push({
    name: '⛵ UPGRADE SAILS',
    cost: ~~sailCost,
    description: `+${SAIL_STEP.toFixed(2)} speed (${~~sailCost}g)`,
    canAfford: player.gold >= ~~sailCost && player.upgrades.sails < sailLimit(player.tk),
    action: () => {
      player.gold -= ~~sailCost;
      player.upgrades.sails++;
      player.bspd += SAIL_STEP;
      return `Sails upgraded! Speed: ${player.bspd.toFixed(1)}`;
    },
  });

  // Cannon range upgrade
  const rangeCost = 500;
  options.push({
    name: '🔭 EXTEND RANGE',
    cost: rangeCost,
    description: `+${RANGE_STEP.toFixed(1)} cannon range (${rangeCost}g)`,
    canAfford: player.gold >= rangeCost && player.upgrades.range < 5,
    action: () => {
      player.gold -= rangeCost;
      player.upgrades.range++;
      player.rng += RANGE_STEP;
      return `Range extended! Range: ${player.rng.toFixed(1)}`;
    },
  });

  // Ship class upgrade
  const currentIdx = SHIP_KEYS.indexOf(player.tk);
  if (currentIdx < SHIP_KEYS.length - 1) {
    const nextKey = SHIP_KEYS[currentIdx + 1]!;
    const nextStats = SHIP_TYPES[nextKey]!;
    const upgradeCost = nextStats.loot * 3;
    options.push({
      name: `🚢 COMMISSION ${nextKey}`,
      cost: upgradeCost,
      description: `${nextStats.hp}HP ${nextStats.cn}cn ${nextStats.spd.toFixed(1)}spd (${upgradeCost}g)`,
      canAfford: player.gold >= upgradeCost,
      action: () => refitShip(player, nextKey, upgradeCost),
    });
  }
  appendSpecialShipOffers(options, player);

  return options;
}

function appendSpecialShipOffers(options: UpgradeOption[], player: PlayerShip): void {
  const seen = new Set(options.map(option => option.name));
  for (const offer of SPECIAL_SHIP_OFFERS) {
    if (player.fame < offer.fame || player.tk === offer.key) continue;
    const target = SHIP_TYPES[offer.key];
    const current = SHIP_TYPES[player.tk];
    if (!target || !current) continue;
    const cost = Math.max(280, (target.loot - current.loot) * 2 + 320);
    const name = `⚓ BUY ${offer.key}`;
    if (seen.has(name)) continue;
    options.push({
      name,
      cost,
      description: `${target.hp}HP ${target.cn}cn ${target.spd.toFixed(1)}spd · ${offer.blurb} (${cost}g)`,
      canAfford: player.gold >= cost,
      action: () => refitShip(player, offer.key, cost),
    });
  }
}

function refitShip(player: PlayerShip, nextKey: string, cost: number): string {
  const current = SHIP_TYPES[player.tk];
  const target = SHIP_TYPES[nextKey];
  if (!current || !target) return `Unknown ship class ${nextKey}.`;
  const cannonBonus = Math.max(0, player.cn - current.cn);
  player.gold -= cost;
  player.tk = nextKey;
  player.cn = target.cn + cannonBonus;
  applyShipBonuses(player, false);
  return `Commissioned a ${nextKey}! Fresh hull, same legend.`;
}
