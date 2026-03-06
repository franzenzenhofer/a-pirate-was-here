import { getCombatHudState } from './combat-hud';
import { latestArchive } from '../sim/state/archive';
import type { GameState } from '../sim/state/game-state';

export function bindSessionUI(onRestart: () => void, onSave: () => void, onStartFresh: () => void): void {
  const restartBtn = document.getElementById('goRestart');
  if (restartBtn) restartBtn.onclick = onRestart;

  const archiveBtn = document.getElementById('archiveBtn');
  if (archiveBtn) {
    archiveBtn.onclick = () => {
      const panel = document.getElementById('archivePanel');
      if (!panel) return;
      panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
    };
  }

  const archiveClose = document.getElementById('archiveClose');
  if (archiveClose) {
    archiveClose.onclick = () => {
      const panel = document.getElementById('archivePanel');
      if (panel) panel.style.display = 'none';
    };
  }

  const settingsBtn = document.getElementById('settingsBtn');
  if (settingsBtn) {
    settingsBtn.onclick = () => togglePanel('settingsPanel');
  }

  const saveNowBtn = document.getElementById('saveNowBtn');
  if (saveNowBtn) saveNowBtn.onclick = onSave;

  const startFreshBtn = document.getElementById('startFreshBtn');
  if (startFreshBtn) startFreshBtn.onclick = onStartFresh;

  const settingsClose = document.getElementById('settingsClose');
  if (settingsClose) {
    settingsClose.onclick = () => {
      const panel = document.getElementById('settingsPanel');
      if (panel) panel.style.display = 'none';
    };
  }
}

export function syncSessionUI(gs: GameState): void {
  applySettingsUI(gs);
  updateGameOver(gs);
  renderArchive(gs);
  renderObjectives(gs);
  renderCombatHud(gs);
}

function applySettingsUI(gs: GameState): void {
  const root = document.documentElement;
  root.style.setProperty('--ui-scale', String(Math.max(1, gs.settings.textScale)));

  const minimap = document.getElementById('minimap');
  if (minimap) minimap.style.display = gs.settings.minimapMode === 'hidden' ? 'none' : 'block';
}

function updateGameOver(gs: GameState): void {
  const panel = document.getElementById('gameover');
  const summary = document.getElementById('goSummary');
  if (!panel || !summary) return;
  panel.style.display = gs.gameOver ? 'block' : 'none';
  if (!gs.gameOver) return;
  summary.textContent =
    `DAY ${gs.player.day} · FAME ${gs.player.fame} · KILLS ${gs.player.kills} · FLEET ${1 + gs.player.fleet.length}`;
}

function renderArchive(gs: GameState): void {
  const body = document.getElementById('archiveBody');
  if (!body) return;
  const entries = latestArchive(gs, 18);
  body.innerHTML = entries.map(entry =>
    `<div class="arch ${entry.type}"><span>DAY ${entry.day}</span> ${entry.msg}</div>`
  ).join('');
}

function renderObjectives(gs: GameState): void {
  const quest = document.getElementById('questLine');
  const event = document.getElementById('eventLine');
  if (quest && gs.activeQuest) {
    quest.textContent = `${gs.activeQuest.title}: ${gs.activeQuest.progress}/${gs.activeQuest.goal}`;
  }
  if (event) {
    event.textContent = gs.activeEvent?.active ? gs.activeEvent.title : 'NO LEGEND ACTIVE';
  }
}

function renderCombatHud(gs: GameState): void {
  const panel = document.getElementById('combatHud');
  const title = document.getElementById('combatTitle');
  const meta = document.getElementById('combatMeta');
  const playerBar = document.getElementById('playerReloadBar');
  const playerText = document.getElementById('playerReloadText');
  const enemyBar = document.getElementById('enemyReloadBar');
  const enemyText = document.getElementById('enemyReloadText');
  if (!panel || !title || !meta || !playerBar || !playerText || !enemyBar || !enemyText) return;

  const combat = getCombatHudState(gs);
  if (!combat) {
    panel.style.display = 'none';
    return;
  }

  panel.style.display = 'block';
  title.textContent = `ENGAGING ${combat.targetName}`;
  meta.textContent = `DIST ${combat.distance.toFixed(1)} · AUTO-FIRE INSIDE RANGE`;
  playerBar.style.width = `${combat.player.progress * 100}%`;
  playerText.textContent = combat.player.label;
  enemyBar.style.width = `${combat.enemy.progress * 100}%`;
  enemyText.textContent = combat.enemy.label;
}

function togglePanel(id: string): void {
  const panel = document.getElementById(id);
  if (!panel) return;
  panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
}
