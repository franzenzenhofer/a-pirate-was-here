import { getCombatHudState } from './combat-hud';
import { fleetSummary } from '../sim/state/fleet';
import { latestArchive } from '../sim/state/archive';
import type { GameState } from '../sim/state/game-state';
import { BUILD_TIMESTAMP, BUILD_VERSION } from '../generated/build-version';

export interface SessionUIActions {
  onRestart: () => void;
  onSave: () => void;
  onStartFresh: () => void;
  onShareLoot: () => void;
  onBreakFog: () => void;
  onCopySeed: () => void;
  onStartSeeded: (seed: number) => void;
  onSettingsChanged: (patch: Partial<GameState['settings']>) => void;
}

export function bindSessionUI(actions: SessionUIActions): void {
  const restartBtn = document.getElementById('goRestart');
  if (restartBtn) restartBtn.onclick = actions.onRestart;

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
  if (saveNowBtn) saveNowBtn.onclick = actions.onSave;

  const startFreshBtn = document.getElementById('startFreshBtn');
  if (startFreshBtn) startFreshBtn.onclick = actions.onStartFresh;

  const shareLootBtn = document.getElementById('shareLootBtn');
  if (shareLootBtn) shareLootBtn.onclick = actions.onShareLoot;

  const breakFogBtn = document.getElementById('breakFogBtn');
  if (breakFogBtn) breakFogBtn.onclick = actions.onBreakFog;

  const copySeedBtn = document.getElementById('copySeedBtn');
  if (copySeedBtn) copySeedBtn.onclick = actions.onCopySeed;

  const applySeedBtn = document.getElementById('applySeedBtn');
  if (applySeedBtn) {
    applySeedBtn.onclick = () => {
      const seedInput = document.getElementById('seedInput') as HTMLInputElement | null;
      const seed = Number(seedInput?.value ?? '0');
      if (Number.isFinite(seed) && seed > 0) actions.onStartSeeded(seed);
    };
  }

  bindSettingControl('masterAudioInput', 'change', (value) => actions.onSettingsChanged({ audio: Boolean(value) }));
  bindSettingControl('textScaleInput', 'input', (value) => actions.onSettingsChanged({ textScale: Math.max(1, Number(value)) }));
  bindSettingControl('reducedMotionInput', 'change', (value) => actions.onSettingsChanged({ reducedMotion: Boolean(value) }));
  bindSettingControl('colorSafeInput', 'change', (value) => actions.onSettingsChanged({ colorSafeHud: Boolean(value) }));
  bindSettingControl('seaAudioInput', 'input', (value) => actions.onSettingsChanged({ seaAudio: Math.max(0, Math.min(1, Number(value))) }));
  bindSettingControl('musicAudioInput', 'input', (value) => actions.onSettingsChanged({ musicAudio: Math.max(0, Math.min(1, Number(value))) }));

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
  if (event) {
    event.textContent = gs.activeEvent?.active ? gs.activeEvent.title : 'NO LEGEND ACTIVE';
  }
  if (fleet) {
    const summary = fleetSummary(gs.player);
    fleet.textContent = `FLEET E${summary.escort} · C${summary.cargo} · R${summary.raider}`;
  }
  if (milestone) {
    milestone.textContent = gs.milestones[0]
      ? `${gs.milestones[0].title.toUpperCase()}`
      : `SEED ${gs.settings.preferredSeed || gs.seed}`;
  }
  renderCrewState(gs);
  renderMilestones(gs);
}

function renderCombatHud(gs: GameState): void {
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

function togglePanel(id: string): void {
  const panel = document.getElementById(id);
  if (!panel) return;
  panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
}

function renderBuildVersion(): void {
  const buildVersion = document.getElementById('buildVersion');
  if (!buildVersion) return;
  buildVersion.textContent = `BUILD ${BUILD_VERSION} · ${BUILD_TIMESTAMP}`;
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
  breakFogBtn.style.display = gs.player.deafenedT <= 0 && gs.fogZones.some(f => Math.hypot(gs.player.x - f.x, gs.player.y - f.y) < f.radius) ? 'block' : 'none';
  meta.textContent =
    gs.player.hypedT > 0 ? `HYPED · ${Math.ceil(gs.player.hypedT / 1000)}s · fresh loot ${gs.player.unsharedGold}g`
      : gs.player.feverT > 0 ? `GOLD FEVER · ${Math.ceil(gs.player.feverT / 1000)}s · unshared ${gs.player.unsharedGold}g`
        : gs.player.unsharedGold > 0 ? `FRESH BOOTY ${gs.player.unsharedGold}g`
          : 'CALM SEAS';
}

function renderMilestones(gs: GameState): void {
  const body = document.getElementById('milestoneList');
  if (!body) return;
  const items = gs.milestones.slice(0, 5);
  body.innerHTML = items.map(item =>
    `<div class="milestoneEntry">DAY ${item.day} · ${item.title}<br>${item.detail}</div>`
  ).join('');
}

function bindSettingControl(
  id: string,
  eventName: 'input' | 'change',
  apply: (value: string | boolean) => void,
): void {
  const el = document.getElementById(id) as HTMLInputElement | null;
  if (!el) return;
  el.addEventListener(eventName, () => {
    apply(el.type === 'checkbox' ? el.checked : el.value);
  });
}

function syncInputValue(id: string, value: string): void {
  const el = document.getElementById(id) as HTMLInputElement | null;
  if (el && document.activeElement !== el && el.value !== value) el.value = value;
}

function syncCheckbox(id: string, value: boolean): void {
  const el = document.getElementById(id) as HTMLInputElement | null;
  if (el && el.checked !== value) el.checked = value;
}
