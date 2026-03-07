import { addLog } from '../renderer/canvas/log';
import { openCaptureMenu } from '../renderer/canvas/menus';
import { createExplosion } from '../sim/combat/damage';
import { registerSeaLoot } from '../sim/state/crew-chaos';
import { rewardSpecialVictory } from '../sim/state/encounters';
import { resolveLegendaryVictory } from '../sim/state/objectives';
import { nextRandom } from '../sim/state/random';
import type { GameState } from '../sim/state/game-state';
import { captureInRange } from './game-actions-available';

export function createCaptureFlow(gs: GameState): {
  enqueueCapture: (enemy: GameState['enemies'][number]) => void;
  maybeOpenCaptureMenu: () => void;
} {
  let activeCaptureId: string | null = null;

  function enqueueCapture(enemy: GameState['enemies'][number]): void {
    const id = String(enemy.id);
    if (!gs.captureQueue.includes(id)) gs.captureQueue.push(id);
  }

  function maybeOpenCaptureMenu(): void {
    if (gs.paused || activeCaptureId) return;
    pruneCaptureQueue();
    const nextId = gs.captureQueue[0];
    if (!nextId) return;
    const enemy = gs.enemies.find(entry =>
      String(entry.id) === nextId && entry.disabled && !entry.sunk && !entry.captured && captureInRange(gs, entry),
    );
    if (!enemy) {
      gs.captureQueue.shift();
      return;
    }
    activeCaptureId = nextId;
    gs.paused = true;
    openCaptureMenu(enemy, gs.player, addLog, () => nextRandom(gs), (capturedEnemy, outcome, action) => {
      handleCaptureResult(capturedEnemy, nextId, outcome, action);
    });
  }

  function pruneCaptureQueue(): void {
    gs.captureQueue = gs.captureQueue.filter(id => {
      const enemy = gs.enemies.find(entry => String(entry.id) === id);
      return Boolean(enemy && enemy.disabled && !enemy.sunk && !enemy.captured && captureInRange(gs, enemy));
    });
  }

  function handleCaptureResult(
    enemy: GameState['enemies'][number],
    captureId: string,
    outcome: 'sunk' | 'captured' | 'released',
    action: 'loot' | 'capture' | 'board' | 'burn' | 'release',
  ): void {
    if (outcome === 'sunk') gs.particles.push(...createExplosion(enemy.x, enemy.y, '#ff6622', 20));
    if (outcome !== 'released') {
      resolveLegendaryVictory(gs, enemy.tk);
      if (action === 'loot') registerSeaLoot(gs, enemy.loot, enemy.name ?? enemy.tk);
      if (action === 'capture') registerSeaLoot(gs, ~~(enemy.loot * 0.3), enemy.name ?? enemy.tk);
      if (action === 'board') registerSeaLoot(gs, ~~(enemy.loot * 1.5), enemy.name ?? enemy.tk);
      rewardSpecialVictory(gs, enemy);
      if (enemy.name?.includes('MUTINEERS') && gs.player.mutinyGold > 0) {
        gs.player.gold += gs.player.mutinyGold;
        addLog(`Recovered ${gs.player.mutinyGold}g from the mutineers!`, 'g');
        gs.player.mutinyGold = 0;
      }
    }
    gs.captureQueue = gs.captureQueue.filter(id => id !== captureId);
    activeCaptureId = null;
    gs.paused = false;
  }

  return { enqueueCapture, maybeOpenCaptureMenu };
}
