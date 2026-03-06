import type { GameState } from '../sim/state/game-state';
import { updateCannonball, createExplosion, createSplash } from '../sim/combat/damage';
import { openCaptureMenu } from '../renderer/canvas/menus';
import { addLog } from '../renderer/canvas/log';

export function updateCballs(gs: GameState, dt: number): void {
  for (let i = gs.cannonballs.length - 1; i >= 0; i--) {
    const b = gs.cannonballs[i]!;
    const result = updateCannonball(b, dt, gs.player, gs.enemies, gs.world.tiles);
    if (result.type === 'splash') {
      gs.particles.push(...createSplash(b.x, b.y)); gs.cannonballs.splice(i, 1);
    } else if (result.type === 'miss' && b.dist > b.maxDist) {
      gs.cannonballs.splice(i, 1);
    } else if (result.type === 'player_hit') {
      gs.player.hp = Math.max(0, gs.player.hp - result.dmg);
      gs.particles.push(...createExplosion(gs.player.x, gs.player.y, '#ff6622', 9));
      addLog('HIT! -' + ~~result.dmg + ' HP', 'r'); gs.cannonballs.splice(i, 1);
      if (gs.player.hp <= 0) addLog('SHIP SUNK! Reload to continue', 'r');
    } else if ((result.type === 'enemy_hit' || result.type === 'enemy_disabled') && result.target) {
      result.target.hp -= result.dmg;
      gs.particles.push(...createExplosion(result.target.x, result.target.y, '#ff8822', 7));
      gs.cannonballs.splice(i, 1);
      if (result.type === 'enemy_disabled') {
        result.target.disabled = true; result.target.speed = 0;
        addLog(result.target.tk + ' DISABLED!', 'g');
        const ref = result.target;
        setTimeout(() => {
          gs.paused = true;
          openCaptureMenu(ref, gs.player, addLog, (e) => {
            gs.particles.push(...createExplosion(e.x, e.y, '#ff6622', 20)); gs.paused = false;
          });
        }, 500);
      }
    } else if (result.type === 'friendly_fire' && result.target) {
      result.target.hp -= result.dmg;
      if (result.target.hp <= 0) {
        result.target.disabled = true;
        gs.particles.push(...createExplosion(result.target.x, result.target.y, '#ff8822', 6));
      }
      gs.cannonballs.splice(i, 1);
    }
  }
}
