import type { GameState } from '../sim/state/game-state';

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
