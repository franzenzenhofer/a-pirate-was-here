import type { SessionUIActions } from './session-ui-types';

let activeModal: string | null = null;

export function getActiveModal(): string | null {
  return activeModal;
}

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
  bindMobileUI(actions);
}

function bindMobileUI(actions: SessionUIActions): void {
  bindButton('statusBadge', () => togglePanel('inspectPanel'));
  bindButton('menuBtn', () => openDrawer());
  bindButton('drawerClose', () => closeDrawer());
  bindButton('drawerDetails', () => { closeDrawer(); togglePanel('inspectPanel'); });
  bindButton('drawerLog', () => { closeDrawer(); togglePanel('archivePanel'); });
  bindButton('drawerSettings', () => { closeDrawer(); togglePanel('settingsPanel'); });
  bindActionOverlayDelegation(actions);
}

function bindActionOverlayDelegation(actions: SessionUIActions): void {
  const overlay = document.getElementById('actionOverlay');
  if (!overlay) return;
  overlay.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.id === 'aoShareLoot') actions.onShareLoot();
    if (target.id === 'aoBlastFog') actions.onBreakFog();
  });
}

function openDrawer(): void {
  const drawer = document.getElementById('menuDrawer');
  if (drawer) { drawer.style.display = 'block'; requestAnimationFrame(() => drawer.classList.add('open')); }
}

function closeDrawer(): void {
  const drawer = document.getElementById('menuDrawer');
  if (!drawer) return;
  drawer.classList.remove('open');
  setTimeout(() => { if (!drawer.classList.contains('open')) drawer.style.display = 'none'; }, 160);
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
  const wasOpen = panel.style.display === 'block';
  panel.style.display = wasOpen ? 'none' : 'block';
  activeModal = wasOpen ? null : id;
}

function closePanel(id: string): void {
  const panel = document.getElementById(id);
  if (panel) panel.style.display = 'none';
  if (activeModal === id) activeModal = null;
}
