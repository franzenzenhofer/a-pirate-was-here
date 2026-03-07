import { DAY_DURATION } from '../../config/world';
import type { Port } from '../../core/types';
import type { GameState } from './game-state';
import { emitEvent } from './events';
import { createEnemy } from './spawn';
import { nextRandom, randomChance, randomFloat, randomInt } from './random';
import { spawnCargoPickup } from './pickups';
import { loseSpecialistsOnMutiny } from './specialists';

export const FEVER_TRIGGER_GOLD = 180;
export const FEVER_DURATION = 120_000;
export const HYPED_DURATION = 60_000;
export const TAVERN_HYPED_DURATION = DAY_DURATION * 3;

export function registerSeaLoot(gs: GameState, gold: number, source: string): void {
  if (gold <= 0) return;
  gs.player.unsharedGold += gold;
  if (gold >= FEVER_TRIGGER_GOLD) gs.player.feverT = FEVER_DURATION;
  emitEvent(gs, { kind: 'log', msg: `🍻 Gold fever rises after looting ${source}!`, tone: 'o' });
}

export function shareLootAndPassRum(gs: GameState): string {
  const player = gs.player;
  if (player.unsharedGold <= 0) return 'No fresh loot to celebrate.';
  const tribute = Math.max(40, Math.round(player.gold * 0.2));
  player.gold = Math.max(0, player.gold - tribute);
  player.unsharedGold = 0;
  player.feverT = 0;
  player.hypedT = Math.max(player.hypedT, HYPED_DURATION);
  emitEvent(gs, { kind: 'log', msg: `🍾 Deck party! ${tribute}g shared with the crew.`, tone: 'g' });
  emitEvent(gs, { kind: 'sound', msg: 'party' });
  return `Shared ${tribute}g and the crew is HYPED.`;
}

export function updateCrewChaos(gs: GameState, dt: number): void {
  const player = gs.player;
  player.hypedT = Math.max(0, player.hypedT - dt);
  player.deafenedT = Math.max(0, player.deafenedT - dt);

  if (player.unsharedGold > 0 && player.feverT > 0) {
    player.feverT = Math.max(0, player.feverT - dt);
    if (player.feverT === 0) triggerMutiny(gs);
  }
}

export function applyCombatBuff(baseSpeed: number, reloadMs: number, accuracy: number, player: GameState['player']): {
  speed: number;
  reload: number;
  accuracy: number;
} {
  if (player.hypedT <= 0) return { speed: baseSpeed, reload: reloadMs, accuracy };
  return {
    speed: baseSpeed * 1.3,
    reload: Math.max(1200, Math.round(reloadMs * 0.5)),
    accuracy: Math.max(0.1, accuracy * 0.6),
  };
}

export function resolvePortCrewChaos(gs: GameState, port: Port): {
  blockMenu: boolean;
} {
  const player = gs.player;

  if (player.fame > 300 && (port.nat === 'PIRATE' || port.rel === 'friendly')) {
    const volunteers = randomInt(gs, 12, 34);
    player.crew = Math.min(300, player.crew + volunteers);
    emitEvent(gs, { kind: 'log', msg: `🤟 Your legend precedes you! +${volunteers} volunteers joined for free.`, tone: 'g' });
  }

  if (player.gold <= 0 && player.hp / Math.max(player.maxHp, 1) < 0.3) {
    const deserters = Math.min(player.crew - 1, randomInt(gs, 8, 22));
    if (deserters > 0) {
      player.crew -= deserters;
      emitEvent(gs, { kind: 'log', msg: `⚰️ This ship is a coffin! -${deserters} crew fled into the night.`, tone: 'r' });
    }
  }

  if (player.unsharedGold < 450) return { blockMenu: false };

  const tavernSpend = Math.max(60, Math.round(player.unsharedGold * randomFloat(gs, 0.18, 0.32)));
  player.gold = Math.max(0, player.gold - tavernSpend);
  player.unsharedGold = Math.max(0, player.unsharedGold - tavernSpend);
  emitEvent(gs, { kind: 'log', msg: `🍺 The crew tears through ${tavernSpend}g in taverns at ${port.name}.`, tone: 'o' });

  if (!randomChance(gs, 0.5)) {
    player.hypedT = Math.max(player.hypedT, TAVERN_HYPED_DURATION);
    return { blockMenu: false };
  }

  port.rel = 'enemy';
  player.hypedT = Math.max(player.hypedT, TAVERN_HYPED_DURATION);
  player.speed = Math.max(player.speed, player.bspd * 1.5);
  player.targetX = player.x + (player.x - port.x) * 2;
  player.targetY = player.y + (player.y - port.y) * 2;
  emitEvent(gs, { kind: 'log', msg: `🍻 Tavern brawl! ${port.name} turns hostile and the forts open fire!`, tone: 'r' });
  emitEvent(gs, { kind: 'screen_shake', msg: 'brawl' });
  return { blockMenu: true };
}

export function forceFogEscape(gs: GameState): void {
  gs.player.deafenedT = 3000;
  emitEvent(gs, { kind: 'log', msg: '🔊 The cannon blast snaps the crew out of the siren trance!', tone: 'b' });
}

function triggerMutiny(gs: GameState): void {
  const player = gs.player;
  const deserters = Math.max(8, Math.floor(player.crew * 0.5));
  const stolenGold = Math.max(120, Math.floor(player.gold * 0.5));
  player.crew = Math.max(1, player.crew - deserters);
  player.gold = Math.max(0, player.gold - stolenGold);
  player.mutinyGold += stolenGold;
  player.unsharedGold = 0;
  loseSpecialistsOnMutiny(player.specialists, 0.5);
  emitEvent(gs, { kind: 'log', msg: `☠️ MUTINY! ${deserters} crew steal ${stolenGold}g and peel away in your own colors!`, tone: 'r' });
  emitEvent(gs, { kind: 'screen_shake', msg: 'mutiny' });

  const mutineer = createEnemy(player.x + 2, player.y + 1, 'PIRATE', 'HARD', 'PIRATE', gs.world.tiles, player.tk, () => nextRandom(gs));
  mutineer.name = `${player.name ?? player.tk} MUTINEERS`;
  mutineer.isHunter = true;
  mutineer.loot += stolenGold;
  mutineer.x = player.x + 2;
  mutineer.y = player.y + 1;
  gs.enemies.push(mutineer);
  spawnCargoPickup(gs, mutineer.x + 0.3, mutineer.y, Math.round(stolenGold * 0.35), 'MUTINY LOOT');
}
