import type { PlayerShip } from '../../core/types';

/** Morale factors that affect crew behavior */
export interface MoraleState {
  value: number; // 0-100, starts at 75
  mutinyRisk: number; // 0.0-1.0
  lastPayDay: number;
}

export function createMorale(): MoraleState {
  return { value: 75, lastPayDay: 0, mutinyRisk: 0 };
}

/** Update morale based on player actions and conditions */
export function updateMorale(
  morale: MoraleState,
  player: PlayerShip,
  dt: number,
): string | null {
  // Gold makes crew happy
  if (player.gold > 1000) morale.value = Math.min(100, morale.value + dt * 0.0001);

  // Low HP lowers morale
  if (player.hp / player.maxHp < 0.3) morale.value = Math.max(0, morale.value - dt * 0.0003);

  // No gold is bad
  if (player.gold <= 0) morale.value = Math.max(0, morale.value - dt * 0.0005);

  // Fame boosts morale over time
  if (player.fame > 50) morale.value = Math.min(100, morale.value + dt * 0.00005);

  // Clamp
  morale.value = Math.max(0, Math.min(100, morale.value));

  // Calculate mutiny risk
  morale.mutinyRisk = morale.value < 20 ? (20 - morale.value) / 20 * 0.3 : 0;

  // Check for mutiny event (very rare)
  if (morale.mutinyRisk > 0.1 && Math.random() < morale.mutinyRisk * dt * 0.000001) {
    const deserters = Math.max(3, ~~(player.crew * 0.1));
    player.crew = Math.max(1, player.crew - deserters);
    const stolenGold = Math.min(player.gold, ~~(player.gold * 0.1));
    player.gold -= stolenGold;
    morale.value = Math.min(50, morale.value + 15); // Mutiny releases pressure
    return `Mutiny! ${deserters} crew desert, steal ${stolenGold}g!`;
  }

  return null;
}

/** Get morale description */
export function moraleLabel(value: number): string {
  if (value >= 80) return 'INSPIRED';
  if (value >= 60) return 'CONTENT';
  if (value >= 40) return 'UNEASY';
  if (value >= 20) return 'RESTLESS';
  return 'MUTINOUS';
}

/** Get morale color */
export function moraleColor(value: number): string {
  if (value >= 80) return '#44ff88';
  if (value >= 60) return '#88ffaa';
  if (value >= 40) return '#ffcc44';
  if (value >= 20) return '#ff8844';
  return '#ff4444';
}
