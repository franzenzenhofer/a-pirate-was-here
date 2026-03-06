import type { Port } from '../../core/types';
import type { GameState } from './game-state';
import { ERA_FAME, ERA_NAMES, SPAWN_INTERVAL, TREASURE_RESPAWN, PORT_WAR_CHECK } from '../../config/world';
import { TIERS } from '../../config/ports';
import { NATION_FLAGS } from '../../config/ports';
import { spawnEdgeEnemyWithRng, spawnTreasuresWithSeed, createEnemy } from './spawn';
import { isSail } from '../world/gen';
import { updateObjectives } from './objectives';
import { emitEvent } from './events';
import { nextRandom } from './random';

export interface PortRaidAssessment {
  winChance: number;
  expectedGold: number;
  expectedPlunder: number;
  counterDamage: number;
  rating: 'FAVORABLE' | 'RISKY' | 'DESPERATE';
}

/** Update era progression, spawning, and port wars */
export function updateProgression(gs: GameState, dt: number): void {
  updateEra(gs);
  updateObjectives(gs);
  updateSpawns(gs, dt);
  updateTreasureRespawn(gs, dt);
  updatePortWars(gs, dt);
  cleanupSunkShips(gs);
}

export function eraForFame(fame: number): number {
  return ERA_FAME.filter(f => fame >= f).length - 1;
}

function updateEra(gs: GameState): void {
  const newEra = eraForFame(gs.player.fame);
  if (newEra > gs.era) {
    gs.era = newEra;
    emitEvent(gs, {
      kind: 'era_up',
      msg: '⚓ ' + (ERA_NAMES[Math.min(gs.era, 4)] ?? '') + ' ⚓',
      tone: 'o',
      duration: 3000,
    });
  }
}

function updateSpawns(gs: GameState, dt: number): void {
  gs.spawnTimer += dt;
  const interval = Math.max(8000, SPAWN_INTERVAL - gs.era * 4000);
  if (gs.spawnTimer > interval) {
    gs.spawnTimer = 0;
    const count = gs.enemies.filter(e => !e.sunk && !e.captured).length;
    if (count < 80 + gs.era * 10) {
      const en = spawnEdgeEnemyWithRng(gs.world.tiles, gs.era, undefined, () => nextRandom(gs));
      if (en) gs.enemies.push(en);
      if (gs.era >= 2 && nextRandom(gs) < 0.5) {
        const en2 = spawnEdgeEnemyWithRng(gs.world.tiles, gs.era, undefined, () => nextRandom(gs));
        if (en2) gs.enemies.push(en2);
      }
      if (gs.era >= 3 && nextRandom(gs) < 0.4) {
        const en3 = spawnEdgeEnemyWithRng(gs.world.tiles, gs.era, Math.min(gs.era, 4), () => nextRandom(gs));
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
      const newT = spawnTreasuresWithSeed(gs.world.tiles, 8 + gs.era * 2, gs.treasures, gs.seed + gs.player.day + gs.treasures.length);
      gs.treasures.push(...newT);
      emitEvent(gs, { kind: 'log', msg: '💰 New treasures spotted!', tone: 'b' });
    }
  }
}

function updatePortWars(gs: GameState, dt: number): void {
  gs.portWarTimer += dt;
  if (gs.portWarTimer < PORT_WAR_CHECK) return;
  gs.portWarTimer = 0;
  if (nextRandom(gs) > 0.4) return;

  const attPort = gs.ports[Math.floor(nextRandom(gs) * gs.ports.length)];
  const defPort = gs.ports[Math.floor(nextRandom(gs) * gs.ports.length)];
  if (!attPort || !defPort || attPort === defPort || attPort.nat === defPort.nat) return;

  for (let a = 0; a < 20; a++) {
    const sx = attPort.x + Math.floor((nextRandom(gs) - 0.5) * 6);
    const sy = attPort.y + Math.floor((nextRandom(gs) - 0.5) * 6);
    if (isSail(gs.world.tiles, sx, sy)) {
      const tier = Math.min(1 + gs.era, 4);
      const warship = createEnemy(sx + 0.5, sy + 0.5, 'WARSHIP', TIERS[tier] ?? 'MEDIUM', attPort.nat, gs.world.tiles, undefined, () => nextRandom(gs));
      warship.attackTarget = defPort;
      warship.state = 'PORT_ATTACK';
      gs.enemies.push(warship);
      emitEvent(gs, { kind: 'log', msg: (NATION_FLAGS[attPort.nat] ?? '') + ' fleet sails for ' + defPort.name + '!', tone: 'o' });
      break;
    }
  }
}

function cleanupSunkShips(gs: GameState): void {
  if (gs.enemies.length > 200) {
    let removed = 0;
    for (let i = gs.enemies.length - 1; i >= 0 && removed < 50; i--) {
      if (gs.enemies[i]?.sunk || gs.enemies[i]?.captured) { gs.enemies.splice(i, 1); removed++; }
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
  roll: number = 0.5,
): { success: boolean; msg: string } {
  const raid = assessPortRaid(port, attackerCn, attackerHp, attackerMaxHp);

  if (roll < raid.winChance) {
    port.nat = attackerNat;
    port.rel = attackerNat === 'PIRATE' ? 'neutral' : 'enemy';
    port.garrison = ~~(port.garrison * 0.35);
    port.wealth = Math.max(120, port.wealth - raid.expectedPlunder);
    return { success: true, msg: port.name + ' falls to ' + (NATION_FLAGS[attackerNat] ?? '') + '!' };
  }
  return { success: false, msg: `${port.name} repelled the raid! (${raid.rating} odds)` };
}

export function assessPortRaid(
  port: Port,
  attackerCn: number,
  attackerHp: number,
  attackerMaxHp: number,
): PortRaidAssessment {
  const hullFactor = attackerMaxHp > 0 ? attackerHp / attackerMaxHp : 0;
  const attackPower = attackerCn * (0.55 + hullFactor * 0.9);
  const defensePower = port.cannons * 1.15 + port.garrison * 0.7 + port.wealth / 800;
  const winChance = Math.max(0.08, Math.min(0.92, attackPower / (attackPower + defensePower + 1)));
  const expectedGold = Math.max(70, Math.round(port.wealth * (0.08 + winChance * 0.18)));
  const expectedPlunder = Math.max(120, Math.round(port.wealth * (0.28 + winChance * 0.34)));
  const counterDamage = Math.max(2, Math.round((defensePower / Math.max(attackerCn, 1)) * 2.4));

  return {
    winChance,
    expectedGold,
    expectedPlunder,
    counterDamage,
    rating: winChance >= 0.65 ? 'FAVORABLE' : winChance >= 0.4 ? 'RISKY' : 'DESPERATE',
  };
}
