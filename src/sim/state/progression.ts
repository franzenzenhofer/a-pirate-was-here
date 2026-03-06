import type { Port } from '../../core/types';
import type { GameState } from './game-state';
import { ERA_DAYS, ERA_NAMES, SPAWN_INTERVAL, TREASURE_RESPAWN, PORT_WAR_CHECK } from '../../config/world';
import { TIERS } from '../../config/ports';
import { NATION_FLAGS } from '../../config/ports';
import { spawnEdgeEnemy, spawnTreasures, createEnemy } from './spawn';
import { isSail } from '../world/gen';
import { addLog } from '../../renderer/canvas/log';

/** Update era progression, spawning, and port wars */
export function updateProgression(gs: GameState, dt: number): void {
  updateEra(gs);
  updateSpawns(gs, dt);
  updateTreasureRespawn(gs, dt);
  updatePortWars(gs, dt);
  cleanupSunkShips(gs);
}

function updateEra(gs: GameState): void {
  const newEra = ERA_DAYS.filter(d => gs.player.day >= d).length - 1;
  if (newEra > gs.era) {
    gs.era = newEra;
    const el = document.getElementById('era');
    const txt = document.getElementById('eraTxt');
    if (el && txt) {
      txt.textContent = '⚓ ' + (ERA_NAMES[Math.min(gs.era, 4)] ?? '') + ' ⚓';
      el.style.display = 'block';
      addLog('🌊 ' + (ERA_NAMES[Math.min(gs.era, 4)] ?? ''), 'o');
      setTimeout(() => { el.style.display = 'none'; }, 3000);
    }
  }
}

function updateSpawns(gs: GameState, dt: number): void {
  gs.spawnTimer += dt;
  const interval = Math.max(8000, SPAWN_INTERVAL - gs.era * 4000);
  if (gs.spawnTimer > interval) {
    gs.spawnTimer = 0;
    const count = gs.enemies.filter(e => !e.sunk && !e.captured).length;
    if (count < 80 + gs.era * 10) {
      const en = spawnEdgeEnemy(gs.world.tiles, gs.era);
      if (en) gs.enemies.push(en);
      if (gs.era >= 2 && Math.random() < 0.5) {
        const en2 = spawnEdgeEnemy(gs.world.tiles, gs.era);
        if (en2) gs.enemies.push(en2);
      }
      if (gs.era >= 3 && Math.random() < 0.4) {
        const en3 = spawnEdgeEnemy(gs.world.tiles, gs.era, Math.min(gs.era, 4));
        if (en3) gs.enemies.push(en3);
      }
    }
  }
}

function updateTreasureRespawn(gs: GameState, dt: number): void {
  gs.treasureTimer += dt;
  if (gs.treasureTimer > TREASURE_RESPAWN) {
    gs.treasureTimer = 0;
    const unlootedCount = gs.treasures.filter(t => !t.looted).length;
    if (unlootedCount < 20) {
      const newT = spawnTreasures(gs.world.tiles, 8 + gs.era * 2, gs.treasures);
      gs.treasures.push(...newT);
      addLog('💰 New treasures spotted!', 'b');
    }
  }
}

function updatePortWars(gs: GameState, dt: number): void {
  gs.portWarTimer += dt;
  if (gs.portWarTimer < PORT_WAR_CHECK) return;
  gs.portWarTimer = 0;
  if (Math.random() > 0.4) return;

  const attPort = gs.ports[~~(Math.random() * gs.ports.length)];
  const defPort = gs.ports[~~(Math.random() * gs.ports.length)];
  if (!attPort || !defPort || attPort === defPort || attPort.nat === defPort.nat) return;

  for (let a = 0; a < 20; a++) {
    const sx = attPort.x + ~~((Math.random() - 0.5) * 6);
    const sy = attPort.y + ~~((Math.random() - 0.5) * 6);
    if (isSail(gs.world.tiles, sx, sy)) {
      const tier = Math.min(1 + gs.era, 4);
      const warship = createEnemy(sx + 0.5, sy + 0.5, 'WARSHIP', TIERS[tier] ?? 'MEDIUM', attPort.nat, gs.world.tiles);
      warship.attackTarget = defPort;
      warship.state = 'PORT_ATTACK';
      gs.enemies.push(warship);
      addLog((NATION_FLAGS[attPort.nat] ?? '') + ' fleet sails for ' + defPort.name + '!', 'o');
      break;
    }
  }
}

function cleanupSunkShips(gs: GameState): void {
  if (gs.enemies.length > 200) {
    let removed = 0;
    for (let i = gs.enemies.length - 1; i >= 0 && removed < 50; i--) {
      if (gs.enemies[i]?.sunk) { gs.enemies.splice(i, 1); removed++; }
    }
  }
}

/** Handle port attack by enemy or player */
export function portUnderAttack(
  port: Port,
  attackerCn: number,
  attackerHp: number,
  attackerMaxHp: number,
  attackerNat: string,
): { success: boolean; msg: string } {
  const aPow = attackerCn * (attackerHp / attackerMaxHp);
  const dPow = port.cannons + port.garrison * 0.6;
  const roll = Math.random() * aPow / (aPow + dPow + 1);

  if (roll > 0.38) {
    port.nat = attackerNat;
    port.rel = attackerNat === 'PIRATE' ? 'neutral' : 'enemy';
    port.garrison = ~~(port.garrison * 0.3);
    port.wealth = ~~(port.wealth * 0.2);
    return { success: true, msg: port.name + ' falls to ' + (NATION_FLAGS[attackerNat] ?? '') + '!' };
  }
  return { success: false, msg: port.name + ' repelled attack!' };
}

