import type { GameState } from '../sim/state/game-state';

let audioCtx: AudioContext | null = null;
let ambientCooldown = 0;

export function primeAudio(): void {
  if (typeof window === 'undefined') return;
  if (!audioCtx) audioCtx = new window.AudioContext();
  if (audioCtx.state === 'suspended') void audioCtx.resume();
}

export function playSoundCue(kind: string, volume: number = 1): void {
  if (!audioCtx || volume <= 0) return;
  const map = SOUND_MAP[kind] ?? SOUND_MAP.ui!;
  playTone(map.freq, map.duration, map.type, volume * map.gain, map.endFreq);
}

export function syncAmbientAudio(gs: GameState, dt: number): void {
  ambientCooldown = Math.max(0, ambientCooldown - dt);
  if (!gs.settings.audio || gs.settings.seaAudio <= 0 || ambientCooldown > 0) return;
  const cue =
    gs.fogZones.some(f => Math.hypot(gs.player.x - f.x, gs.player.y - f.y) < f.radius) ? 'weather'
      : gs.enemies.some(e => !e.sunk && !e.disabled && Math.hypot(e.x - gs.player.x, e.y - gs.player.y) < 8) ? 'combat'
        : gs.activePort ? 'port'
          : 'sea';
  playSoundCue(cue, cue === 'combat' ? gs.settings.musicAudio : gs.settings.seaAudio);
  ambientCooldown = cue === 'combat' ? 1200 : cue === 'weather' ? 1800 : 2600;
}

function playTone(
  freq: number,
  durationMs: number,
  type: OscillatorType,
  gainValue: number,
  endFreq?: number,
): void {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (typeof endFreq === 'number') osc.frequency.exponentialRampToValueAtTime(endFreq, now + durationMs / 1000);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, gainValue * 0.08), now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + durationMs / 1000);
}

const SOUND_MAP: Record<string, { freq: number; endFreq?: number; duration: number; type: OscillatorType; gain: number }> = {
  ui: { freq: 560, endFreq: 760, duration: 80, type: 'square', gain: 1 },
  party: { freq: 420, endFreq: 900, duration: 180, type: 'triangle', gain: 1.1 },
  mutiny: { freq: 210, endFreq: 110, duration: 260, type: 'sawtooth', gain: 1.2 },
  port: { freq: 680, endFreq: 540, duration: 220, type: 'triangle', gain: 0.8 },
  combat: { freq: 150, endFreq: 220, duration: 120, type: 'square', gain: 1 },
  weather: { freq: 300, endFreq: 180, duration: 280, type: 'sine', gain: 0.9 },
  treasure: { freq: 740, endFreq: 1120, duration: 220, type: 'triangle', gain: 1 },
  sea: { freq: 120, endFreq: 90, duration: 260, type: 'sine', gain: 0.6 },
};
