import type { GameState } from '../sim/state/game-state';
import { drainEvents } from '../sim/state/events';
import { addLog } from '../renderer/canvas/log';
import { pushArchive } from '../sim/state/archive';
import { playSoundCue } from './audio';
import { triggerScreenShake } from './screen-shake';

export function consumeSimEvents(gs: GameState): void {
  for (const event of drainEvents(gs)) {
    if (event.kind === 'log' || event.kind === 'toast' || event.kind === 'milestone') {
      addLog(event.msg, event.tone ?? 'b');
      pushArchive(gs, event.msg, event.tone ?? 'b', event.kind);
      if (event.kind === 'milestone') recordMilestone(gs, event.msg, event.msg, inferMilestoneCategory(event.msg));
      continue;
    }

    if (event.kind === 'era_up') {
      addLog(event.msg, event.tone ?? 'o');
      pushArchive(gs, event.msg, event.tone ?? 'o', 'era');
      recordMilestone(gs, event.msg.replace(/⚓/g, '').trim(), 'The Caribbean enters a deadlier age.', 'era');
      const overlay = document.getElementById('era');
      const eraText = document.getElementById('eraTxt');
      if (overlay && eraText) {
        eraText.textContent = event.msg;
        overlay.style.display = 'block';
        window.setTimeout(() => { overlay.style.display = 'none'; }, event.duration ?? 3000);
      }
      continue;
    }

    if (event.kind === 'screen_shake') {
      triggerScreenShake(event.msg);
      continue;
    }

    if (event.kind === 'sound') {
      playSoundCue(event.msg, gs.settings.musicAudio);
      continue;
    }
  }
}

function recordMilestone(
  gs: GameState,
  title: string,
  detail: string,
  category: GameState['milestones'][number]['category'],
): void {
  const id = `${category}-${gs.player.day}-${title}`;
  if (gs.milestones.some(item => item.id === id)) return;
  gs.milestones.unshift({
    id,
    day: gs.player.day,
    title,
    detail,
    category,
  });
  if (gs.milestones.length > 24) gs.milestones.length = 24;
}

function inferMilestoneCategory(msg: string): GameState['milestones'][number]['category'] {
  if (msg.includes('Rival') || msg.includes('legend')) return 'legend';
  if (msg.includes('treasure') || msg.includes('Treasure')) return 'treasure';
  if (msg.includes('mutiny') || msg.includes('MUTINY')) return 'mutiny';
  if (msg.includes('fleet') || msg.includes('Fleet')) return 'fleet';
  if (msg.includes('tribute') || msg.includes('flag')) return 'reputation';
  return 'legend';
}
