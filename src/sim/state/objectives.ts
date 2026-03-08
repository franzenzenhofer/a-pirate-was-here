import { cargoCount } from '../economy/trade';
import type { GameState } from './game-state';
import { spawnSpecificEdgeEnemyWithRng } from './spawn';
import { emitEvent } from './events';
import { nextRandom } from './random';

const QUEST_POOL = [
  { id: 'sinkers', title: 'RAIDER HUNT', detail: 'Sink 3 ships', kind: 'combat', goal: 3, rewardGold: 220, rewardFame: 45 },
  { id: 'traders', title: 'FULL HOLD', detail: 'Carry 12 cargo', kind: 'trade', goal: 12, rewardGold: 180, rewardFame: 35 },
  { id: 'fleet', title: 'GROW THE FLEET', detail: 'Claim 2 escort ships', kind: 'explore', goal: 2, rewardGold: 260, rewardFame: 50 },
] as const;

const STARTER_QUESTS = [
  {
    id: 'first-hold',
    title: 'FIRST HOLD',
    detail: 'Dock at a port, buy 5 cargo, and get back to sea.',
    kind: 'trade',
    goal: 5,
    rewardGold: 140,
    rewardFame: 18,
  },
  {
    id: 'first-prize',
    title: 'FIRST PRIZE',
    detail: 'Disable a ship and claim it into your fleet.',
    kind: 'explore',
    goal: 1,
    rewardGold: 180,
    rewardFame: 28,
  },
  {
    id: 'gun-drill',
    title: 'GUN DRILL',
    detail: 'Sink 1 ship with a clean broadside.',
    kind: 'combat',
    goal: 1,
    rewardGold: 180,
    rewardFame: 24,
  },
] as const;

export function updateObjectives(gs: GameState): void {
  if (!gs.activeQuest) gs.activeQuest = createQuest(gs);
  updateQuest(gs);
  maybeStartLegend(gs);
}

export function resolveLegendaryVictory(gs: GameState, shipType: string): void {
  if (!gs.activeEvent || !gs.activeEvent.active || gs.activeEvent.targetShip !== shipType) return;
  gs.player.gold += gs.activeEvent.rewardGold;
  gs.player.fame += gs.activeEvent.rewardFame;
  gs.activeEvent.active = false;
  emitEvent(gs, { kind: 'milestone', msg: '☠️ LEGEND SLAIN: ' + gs.activeEvent.title, tone: 'g' });
}

function createQuest(gs: GameState): GameState['activeQuest'] {
  const starter = createStarterQuest(gs);
  if (starter) return starter;
  const template = QUEST_POOL[(gs.seed + gs.player.day + gs.player.fame) % QUEST_POOL.length] ?? QUEST_POOL[0];
  return { ...template, progress: progressFor(gs, template.kind), completed: false };
}

function updateQuest(gs: GameState): void {
  const quest = gs.activeQuest;
  if (!quest || quest.completed) return;
  quest.progress = progressFor(gs, quest.kind);
  if (quest.progress < quest.goal) return;
  quest.completed = true;
  gs.player.gold += quest.rewardGold;
  gs.player.fame += quest.rewardFame;
  emitEvent(gs, { kind: 'log', msg: '🏆 QUEST COMPLETE: ' + quest.title, tone: 'g' });
  gs.activeQuest = createQuest(gs);
}

function maybeStartLegend(gs: GameState): void {
  if (gs.activeEvent?.active || gs.player.fame < 80 || gs.era < 1) return;
  const legend = spawnSpecificEdgeEnemyWithRng(gs.world.tiles, 'WARSHIP', 'LEGEND', 'PIRATE', 'DREAD_GHOST', () => nextRandom(gs));
  if (!legend) return;
  gs.enemies.push(legend);
  gs.activeEvent = {
    id: 'legend-' + gs.player.day,
    title: 'GHOST OF THE MAELSTROM',
    detail: 'Sink or claim the DREAD_GHOST haunting the trade lanes.',
    targetShip: 'DREAD_GHOST',
    rewardGold: 900,
    rewardFame: 120,
    active: true,
  };
  emitEvent(gs, { kind: 'log', msg: '🌩 LEGEND AWAKENS: ' + gs.activeEvent.title, tone: 'o' });
}

function createStarterQuest(gs: GameState): GameState['activeQuest'] | null {
  if (gs.player.fame >= 40 || gs.player.day > 6) return null;

  const starter = cargoCount(gs.player) < STARTER_QUESTS[0].goal
    ? STARTER_QUESTS[0]
    : gs.player.fleet.length < STARTER_QUESTS[1].goal
      ? STARTER_QUESTS[1]
      : gs.player.kills < STARTER_QUESTS[2].goal
        ? STARTER_QUESTS[2]
        : null;

  if (!starter) return null;
  return { ...starter, progress: progressFor(gs, starter.kind), completed: false };
}

function progressFor(gs: GameState, kind: string): number {
  if (kind === 'combat') return gs.player.kills;
  if (kind === 'trade') return cargoCount(gs.player);
  return gs.player.fleet.length;
}
