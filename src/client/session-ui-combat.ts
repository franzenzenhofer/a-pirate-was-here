import { getCombatHudState } from './combat-hud';
import type { GameState } from '../sim/state/game-state';

export function renderCombatHud(gs: GameState): void {
  const panel = document.getElementById('combatHud');
  const title = document.getElementById('combatTitle');
  const meta = document.getElementById('combatMeta');
  const playerHullLabel = document.getElementById('playerHullLabel');
  const playerBar = document.getElementById('playerReloadBar');
  const playerText = document.getElementById('playerReloadText');
  const playerReloadLabel = document.getElementById('playerReloadLabel');
  const enemyHullLabel = document.getElementById('enemyHullLabel');
  const enemyBar = document.getElementById('enemyReloadBar');
  const enemyText = document.getElementById('enemyReloadText');
  const enemyReloadLabel = document.getElementById('enemyReloadLabel');
  const playerHullBar = document.getElementById('playerHullBar');
  const playerHullText = document.getElementById('playerHullText');
  const enemyHullBar = document.getElementById('enemyHullBar');
  const enemyHullText = document.getElementById('enemyHullText');
  if (!panel || !title || !meta || !playerBar || !playerText || !enemyBar || !enemyText
    || !playerHullLabel || !playerReloadLabel || !enemyHullLabel || !enemyReloadLabel
    || !playerHullBar || !playerHullText || !enemyHullBar || !enemyHullText) return;
  if (gs.gameOver || gs.player.hp <= 0) {
    panel.style.display = 'none';
    return;
  }

  const combat = getCombatHudState(gs);
  if (!combat) {
    panel.style.display = 'none';
    return;
  }

  panel.style.display = 'block';
  title.textContent = `ENGAGING ${combat.targetName}`;
  meta.textContent = `DIST ${combat.distance.toFixed(1)} · AUTO-FIRE INSIDE RANGE`;
  playerHullLabel.textContent = `${combat.playerName} HEALTH`;
  playerReloadLabel.textContent = `${combat.playerName} BROADSIDE`;
  enemyHullLabel.textContent = `${combat.targetName} HEALTH`;
  enemyReloadLabel.textContent = `${combat.targetName} BROADSIDE`;
  playerHullBar.style.width = `${combat.playerHull.progress * 100}%`;
  playerHullText.textContent = combat.playerHull.label;
  enemyHullBar.style.width = `${combat.enemyHull.progress * 100}%`;
  enemyHullText.textContent = combat.enemyHull.label;
  playerBar.style.width = `${combat.player.progress * 100}%`;
  playerText.textContent = combat.player.label;
  enemyBar.style.width = `${combat.enemy.progress * 100}%`;
  enemyText.textContent = combat.enemy.label;
}
