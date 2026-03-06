import { latestArchive } from '../sim/state/archive';
import type { GameState } from '../sim/state/game-state';

export function bindSessionUI(onRestart: () => void, onSave: () => void): void {
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

  const saveBtn = document.getElementById('saveBtn');
  if (saveBtn) saveBtn.onclick = onSave;
}

export function syncSessionUI(gs: GameState): void {
  updateGameOver(gs);
  renderArchive(gs);
  renderObjectives(gs);
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
