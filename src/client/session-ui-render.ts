import { fleetSummary } from '../sim/state/fleet';
import { latestArchive } from '../sim/state/archive';
import type { GameState } from '../sim/state/game-state';
import { BUILD_TIMESTAMP, BUILD_VERSION } from '../generated/build-version';
import { renderCombatHud } from './session-ui-combat';

export function syncSessionUI(gs: GameState): void {
  applySettingsUI(gs);
  updateGameOver(gs);
  renderArchive(gs);
  renderObjectives(gs);
  renderCombatHud(gs);
  renderBuildVersion();
}

function applySettingsUI(gs: GameState): void {
  const root = document.documentElement;
  const body = document.body;
  root.style.setProperty('--ui-scale', String(Math.max(1, gs.settings.textScale)));
  body.classList.toggle('reduced-motion', gs.settings.reducedMotion);
  body.classList.toggle('color-safe', gs.settings.colorSafeHud);
  const minimap = document.getElementById('minimap');
  if (minimap) minimap.style.display = gs.settings.minimapMode === 'hidden' ? 'none' : 'block';
  syncInputValue('textScaleInput', String(gs.settings.textScale));
  syncCheckbox('masterAudioInput', gs.settings.audio);
  syncCheckbox('reducedMotionInput', gs.settings.reducedMotion);
  syncCheckbox('colorSafeInput', gs.settings.colorSafeHud);
  syncInputValue('seaAudioInput', String(gs.settings.seaAudio));
  syncInputValue('musicAudioInput', String(gs.settings.musicAudio));
  syncInputValue('seedInput', String(gs.settings.preferredSeed || gs.seed));
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
  const fleet = document.getElementById('fleetLine');
  const milestone = document.getElementById('milestoneLine');
  if (quest) quest.textContent = gs.activeQuest
    ? `${gs.activeQuest.title}: ${gs.activeQuest.progress}/${gs.activeQuest.goal}`
    : 'QUEST: NONE';
  if (event) event.textContent = gs.activeEvent?.active ? gs.activeEvent.title : 'NO LEGEND ACTIVE';
  if (fleet) {
    const summary = fleetSummary(gs.player);
    fleet.textContent = `FLEET E${summary.escort} · C${summary.cargo} · R${summary.raider}`;
  }
  if (milestone) milestone.textContent = gs.milestones[0]
    ? gs.milestones[0].title.toUpperCase()
    : `SEED ${gs.settings.preferredSeed || gs.seed}`;
  renderCrewState(gs);
  renderMilestones(gs);
}

function renderCrewState(gs: GameState): void {
  const meta = document.getElementById('crewMeta');
  const feverBar = document.getElementById('feverBar');
  const hypeBar = document.getElementById('hypeBar');
  const shareLootBtn = document.getElementById('shareLootBtn') as HTMLButtonElement | null;
  const breakFogBtn = document.getElementById('breakFogBtn') as HTMLButtonElement | null;
  if (!meta || !feverBar || !hypeBar || !shareLootBtn || !breakFogBtn) return;
  const feverProgress = gs.player.feverT > 0 ? gs.player.feverT / 120000 : 0;
  const hypeProgress = gs.player.hypedT > 0 ? Math.min(1, gs.player.hypedT / 60000) : 0;
  feverBar.style.width = `${Math.max(0, Math.min(100, feverProgress * 100))}%`;
  hypeBar.style.width = `${Math.max(0, Math.min(100, hypeProgress * 100))}%`;
  shareLootBtn.style.display = gs.player.unsharedGold > 0 ? 'block' : 'none';
  breakFogBtn.style.display = gs.player.deafenedT <= 0 && gs.fogZones.some(fog => Math.hypot(gs.player.x - fog.x, gs.player.y - fog.y) < fog.radius)
    ? 'block'
    : 'none';
  meta.textContent = gs.player.hypedT > 0
    ? `HYPED · ${Math.ceil(gs.player.hypedT / 1000)}s · fresh loot ${gs.player.unsharedGold}g`
    : gs.player.feverT > 0
      ? `GOLD FEVER · ${Math.ceil(gs.player.feverT / 1000)}s · unshared ${gs.player.unsharedGold}g`
      : gs.player.unsharedGold > 0
        ? `FRESH BOOTY ${gs.player.unsharedGold}g`
        : 'CALM SEAS';
}

function renderMilestones(gs: GameState): void {
  const body = document.getElementById('milestoneList');
  if (!body) return;
  body.innerHTML = gs.milestones.slice(0, 5).map(item =>
    `<div class="milestoneEntry">DAY ${item.day} · ${item.title}<br>${item.detail}</div>`
  ).join('');
}

function renderBuildVersion(): void {
  const buildVersion = document.getElementById('buildVersion');
  if (buildVersion) buildVersion.textContent = `BUILD ${BUILD_VERSION} · ${BUILD_TIMESTAMP}`;
}

function syncInputValue(id: string, value: string): void {
  const element = document.getElementById(id) as HTMLInputElement | null;
  if (element && document.activeElement !== element && element.value !== value) element.value = value;
}

function syncCheckbox(id: string, value: boolean): void {
  const element = document.getElementById(id) as HTMLInputElement | null;
  if (element && element.checked !== value) element.checked = value;
}
