import type { GameState } from '../sim/state/game-state';
import { updateCannonball, createExplosion, createSplash } from '../sim/combat/damage';
import { addLog } from '../renderer/canvas/log';
import { revealTreasureByBlast } from '../sim/state/pickups';
import { FEVER_DURATION } from '../sim/state/crew-chaos';
import { rewardSpecialVictory, spawnCrabLeviathan } from '../sim/state/encounters';
import { fleetIncomingDamageReduction } from '../sim/state/fleet';
import { playSoundCue } from './audio';

export function updateCballs(gs: GameState, dt: number): void {
  for (let i = gs.cannonballs.length - 1; i >= 0; i--) {
    const b = gs.cannonballs[i]!;
    const result = updateCannonball(b, dt, gs.player, gs.enemies, gs.world.tiles);
    if (result.type === 'splash') {
      gs.particles.push(...createSplash(b.x, b.y));
      const revealed = revealTreasureByBlast(gs, b.x, b.y);
      if (revealed) {
        gs.particles.push(...createExplosion(revealed.x + 0.5, revealed.y + 0.5, '#e0b840', 18));
        playSoundCue(revealed.fakeIsland ? 'mutiny' : 'treasure', gs.settings.musicAudio);
        if (revealed.fakeIsland) {
          revealed.looted = true;
          spawnCrabLeviathan(gs, revealed.x, revealed.y);
        }
      }
      gs.cannonballs.splice(i, 1);
    } else if (result.type === 'miss' && b.dist > b.maxDist) {
      gs.cannonballs.splice(i, 1);
    } else if (result.type === 'player_hit') {
      if (b.kind === 'cursed') {
        const crewLoss = Math.min(gs.player.crew - 1, Math.max(3, Math.round(result.dmg * 3)));
        gs.player.crew = Math.max(1, gs.player.crew - crewLoss);
        gs.player.feverT = FEVER_DURATION;
        gs.particles.push(...createExplosion(gs.player.x, gs.player.y, '#66ff99', 9));
        addLog(`CURSED FIRE! -${crewLoss} CREW · FEVER MAXED`, 'r');
        playSoundCue('weather', gs.settings.musicAudio);
      } else {
        const reduced = result.dmg * (1 - fleetIncomingDamageReduction(gs.player));
        gs.player.hp = Math.max(0, gs.player.hp - reduced);
        gs.particles.push(...createExplosion(gs.player.x, gs.player.y, '#ff6622', 9));
        addLog('HIT! -' + ~~reduced + ' HP', 'r');
        playSoundCue('combat', gs.settings.musicAudio);
      }
      gs.cannonballs.splice(i, 1);
      if (gs.player.hp <= 0 && !gs.gameOver) {
        gs.gameOver = true;
        addLog('SHIP SUNK! Your voyage is over.', 'r');
      }
    } else if ((result.type === 'enemy_hit' || result.type === 'enemy_disabled') && result.target) {
      if (result.target.tk === 'CRAB_LEVIATHAN' && !result.target.shellBroken) {
        gs.particles.push(...createSplash(result.target.x, result.target.y));
        addLog('The crab shell shrugs off the broadside!', 'o');
        gs.cannonballs.splice(i, 1);
        continue;
      }
      result.target.hp -= result.dmg;
      gs.particles.push(...createExplosion(result.target.x, result.target.y, result.target.tk === 'MEGALODON' ? '#bbf8ff' : '#ff8822', 7));
      playSoundCue(result.target.tk === 'MEGALODON' ? 'weather' : 'combat', gs.settings.musicAudio);
      gs.cannonballs.splice(i, 1);
      if (result.target.tk === 'MEGALODON' && result.target.state === 'MEGA_CHARGE') {
        result.target.stunnedT = 5000;
        result.target.state = 'MEGA_STUNNED';
        addLog('NOSE SHOT! The Megalodon is stunned!', 'g');
      }
      if (result.type === 'enemy_disabled') {
        if (result.target.tk === 'MEGALODON' || result.target.tk === 'CRAB_LEVIATHAN') {
          result.target.sunk = true;
          rewardSpecialVictory(gs, result.target);
          addLog(`${result.target.name ?? result.target.tk} is finished!`, 'g');
        } else {
          result.target.disabled = true; result.target.speed = 0;
          addLog(result.target.tk + ' DISABLED! Sail close to board.', 'g');
        }
      }
    } else if (result.type === 'friendly_fire' && result.target) {
      result.target.hp -= result.dmg;
      if (result.target.hp <= 0) {
        result.target.disabled = true;
        gs.particles.push(...createExplosion(result.target.x, result.target.y, '#ff8822', 6));
        addLog(result.target.tk + ' disabled by friendly fire!', 'o');
      }
      gs.cannonballs.splice(i, 1);
    }
  }
}
