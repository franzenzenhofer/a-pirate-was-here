import type { EnemyShip, PlayerShip } from '../../core/types';
import { displayShipName } from '../../core/ship-identity';
import { resolveBoarding } from '../../sim/combat/boarding';
import { fleetRoleForShip } from '../../sim/state/fleet';
import type { LogFn } from './log';
import { mkBtn } from './menu-button';

export function openCaptureMenu(
  enemy: EnemyShip,
  player: PlayerShip,
  log: LogFn,
  randomValue: () => number,
  onDone: (
    enemy: EnemyShip,
    outcome: 'sunk' | 'captured' | 'released',
    action: 'loot' | 'capture' | 'board' | 'burn' | 'release',
  ) => void,
): void {
  if (enemy.sunk) return;
  const menu = document.getElementById('cmenu')!;
  document.getElementById('ctitle')!.textContent = '⚔️ ' + displayShipName(enemy) + ' DISABLED!';
  const body = document.getElementById('cbody')!;
  body.innerHTML = '';
  const close = (): void => { menu.style.display = 'none'; };

  mkBtn(body, `💰 LOOT & SINK (+${enemy.loot}g +${enemy.xp}fame)`, 'y', () => finishLoot(enemy, player, log, close, onDone));
  mkBtn(body, `⚓ CLAIM PRIZE SHIP (+${~~(enemy.loot * 0.3)}g)`, 'g', () => finishCapture(enemy, player, log, close, onDone));
  mkBtn(body, `⚔️ BOARD! (crew: ${player.crew})`, 'b', () => finishBoard(enemy, player, log, close, randomValue, onDone));
  mkBtn(body, `🔥 BURN IT (+${enemy.xp}fame)`, 'r', () => finishBurn(enemy, player, close, onDone));

  menu.style.display = 'block';
  document.getElementById('cclose')!.onclick = () => { onDone(enemy, 'released', 'release'); close(); };
}

function finishLoot(
  enemy: EnemyShip,
  player: PlayerShip,
  log: LogFn,
  close: () => void,
  onDone: Parameters<typeof openCaptureMenu>[4],
): void {
  player.gold += enemy.loot;
  player.kills++;
  player.fame += enemy.xp;
  enemy.sunk = true;
  onDone(enemy, 'sunk', 'loot');
  log('💰 Looted ' + displayShipName(enemy) + ': +' + enemy.loot + 'g', 'g');
  close();
}

function finishCapture(
  enemy: EnemyShip,
  player: PlayerShip,
  log: LogFn,
  close: () => void,
  onDone: Parameters<typeof openCaptureMenu>[4],
): void {
  player.fleet.push({ tk: enemy.tk, name: enemy.name, role: fleetRoleForShip(enemy.tk) });
  player.fame += enemy.xp * 4;
  player.gold += ~~(enemy.loot * 0.3);
  enemy.captured = true;
  enemy.disabled = false;
  log('⚓ ' + displayShipName(enemy) + ' joins fleet!', 'g');
  onDone(enemy, 'captured', 'capture');
  close();
}

function finishBoard(
  enemy: EnemyShip,
  player: PlayerShip,
  log: LogFn,
  close: () => void,
  randomValue: () => number,
  onDone: Parameters<typeof openCaptureMenu>[4],
): void {
  const result = resolveBoarding(player, enemy, randomValue);
  player.crew = Math.max(1, player.crew - result.playerCrewLost);
  if (result.success) {
    player.gold += result.loot;
    player.fame += result.fame;
    player.kills++;
    enemy.sunk = true;
    onDone(enemy, 'sunk', 'board');
    log('⚔️ ' + result.msg, 'g');
  } else {
    onDone(enemy, 'released', 'release');
    log('⚔️ ' + result.msg, 'r');
  }
  close();
}

function finishBurn(
  enemy: EnemyShip,
  player: PlayerShip,
  close: () => void,
  onDone: Parameters<typeof openCaptureMenu>[4],
): void {
  player.fame += enemy.xp;
  enemy.sunk = true;
  onDone(enemy, 'sunk', 'burn');
  close();
}
