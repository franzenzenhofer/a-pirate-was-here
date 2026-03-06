import { addLog } from '../../renderer/canvas/log';
import { cargoCount } from '../economy/trade';
import type { GameState } from './game-state';
import { spawnSpecificEdgeEnemy } from './spawn';

const QUEST_POOL = [
  { id: 'sinkers', title: 'RAIDER HUNT', detail: 'Sink 3 ships', kind: 'combat', goal: 3, rewardGold: 220, rewardFame: 45 },
  { id: 'traders', title: 'FULL HOLD', detail: 'Carry 12 cargo', kind: 'trade', goal: 12, rewardGold: 180, rewardFame: 35 },
  { id: 'fleet', title: 'GROW THE FLEET', detail: 'Claim 2 escort ships', kind: 'explore', goal: 2, rewardGold: 260, rewardFame: 50 },
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
  addLog('☠️ LEGEND SLAIN: ' + gs.activeEvent.title, 'g');
}

function createQuest(gs: GameState): GameState['activeQuest'] {
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
  addLog('🏆 QUEST COMPLETE: ' + quest.title, 'g');
  gs.activeQuest = createQuest(gs);
}

function maybeStartLegend(gs: GameState): void {
  if (gs.activeEvent?.active || gs.player.fame < 80 || gs.era < 1) return;
  const legend = spawnSpecificEdgeEnemy(gs.world.tiles, 'WARSHIP', 'LEGEND', 'PIRATE', 'DREAD_GHOST');
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
  addLog('🌩 LEGEND AWAKENS: ' + gs.activeEvent.title, 'o');
}

function progressFor(gs: GameState, kind: string): number {
  if (kind === 'combat') return gs.player.kills;
  if (kind === 'trade') return cargoCount(gs.player);
  return gs.player.fleet.length;
}
