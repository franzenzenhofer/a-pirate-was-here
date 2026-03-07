import type { SessionUIActions } from './session-ui-types';

export function bindSessionUI(actions: SessionUIActions): void {
  bindButton('goRestart', actions.onRestart);
  bindButton('saveNowBtn', actions.onSave);
  bindButton('startFreshBtn', actions.onStartFresh);
  bindButton('shareLootBtn', actions.onShareLoot);
  bindButton('breakFogBtn', actions.onBreakFog);
  bindButton('copySeedBtn', actions.onCopySeed);
  bindButton('archiveBtn', () => togglePanel('archivePanel'));
  bindButton('archiveClose', () => closePanel('archivePanel'));
  bindButton('settingsBtn', () => togglePanel('settingsPanel'));
  bindButton('settingsClose', () => closePanel('settingsPanel'));
  bindSeedApply(actions);
  bindSettingControl('masterAudioInput', 'change', value => actions.onSettingsChanged({ audio: Boolean(value) }));
  bindSettingControl('textScaleInput', 'input', value => actions.onSettingsChanged({ textScale: Math.max(1, Number(value)) }));
  bindSettingControl('reducedMotionInput', 'change', value => actions.onSettingsChanged({ reducedMotion: Boolean(value) }));
  bindSettingControl('colorSafeInput', 'change', value => actions.onSettingsChanged({ colorSafeHud: Boolean(value) }));
  bindSettingControl('seaAudioInput', 'input', value => actions.onSettingsChanged({ seaAudio: Math.max(0, Math.min(1, Number(value))) }));
  bindSettingControl('musicAudioInput', 'input', value => actions.onSettingsChanged({ musicAudio: Math.max(0, Math.min(1, Number(value))) }));
}

function bindButton(id: string, onClick: () => void): void {
  const button = document.getElementById(id);
  if (button) button.onclick = onClick;
}

function bindSeedApply(actions: SessionUIActions): void {
  const applySeedBtn = document.getElementById('applySeedBtn');
  if (!applySeedBtn) return;
  applySeedBtn.onclick = () => {
    const seedInput = document.getElementById('seedInput') as HTMLInputElement | null;
    const seed = Number(seedInput?.value ?? '0');
    if (Number.isFinite(seed) && seed > 0) actions.onStartSeeded(seed);
  };
}

function bindSettingControl(
  id: string,
  eventName: 'input' | 'change',
  apply: (value: string | boolean) => void,
): void {
  const element = document.getElementById(id) as HTMLInputElement | null;
  if (!element) return;
  element.addEventListener(eventName, () => {
    apply(element.type === 'checkbox' ? element.checked : element.value);
  });
}

function togglePanel(id: string): void {
  const panel = document.getElementById(id);
  if (!panel) return;
  panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
}

function closePanel(id: string): void {
  const panel = document.getElementById(id);
  if (panel) panel.style.display = 'none';
}
