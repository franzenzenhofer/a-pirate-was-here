import type { PlayerShip } from '../../core/types';
import { SHIP_TYPES, SHIP_KEYS } from '../../config/ships';

export interface UpgradeOption {
  name: string;
  cost: number;
  description: string;
  canAfford: boolean;
  action: () => string;
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
      player.maxHp += 4;
      player.hp += 4;
      return `Hull reinforced! Max HP: ${player.maxHp}`;
    },
  });

  // Sail upgrade — speed boost
  const sailCost = 400 + player.bspd * 200;
  options.push({
    name: '⛵ UPGRADE SAILS',
    cost: ~~sailCost,
    description: `+0.1 speed (${~~sailCost}g)`,
    canAfford: player.gold >= ~~sailCost && player.bspd < 2.0,
    action: () => {
      player.gold -= ~~sailCost;
      player.bspd += 0.1;
      return `Sails upgraded! Speed: ${player.bspd.toFixed(1)}`;
    },
  });

  // Cannon range upgrade
  const rangeCost = 500;
  options.push({
    name: '🔭 EXTEND RANGE',
    cost: rangeCost,
    description: `+1.0 cannon range (${rangeCost}g)`,
    canAfford: player.gold >= rangeCost && player.rng < 12,
    action: () => {
      player.gold -= rangeCost;
      player.rng += 1.0;
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
      name: `🚢 UPGRADE TO ${nextKey}`,
      cost: upgradeCost,
      description: `${nextStats.hp}HP ${nextStats.cn}cn ${nextStats.spd.toFixed(1)}spd (${upgradeCost}g)`,
      canAfford: player.gold >= upgradeCost,
      action: () => {
        player.gold -= upgradeCost;
        player.tk = nextKey;
        player.maxHp = nextStats.hp;
        player.hp = nextStats.hp;
        player.cn = nextStats.cn;
        player.rl = nextStats.rl;
        player.rng = nextStats.rng;
        player.acc = nextStats.acc;
        player.bspd = nextStats.spd;
        player.turnRate = nextStats.turn;
        player.col = nextStats.col;
        return `Upgraded to ${nextKey}!`;
      },
    });
  }

  return options;
}
