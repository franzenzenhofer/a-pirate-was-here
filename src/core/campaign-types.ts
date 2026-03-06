export interface ShipUpgradeLevels {
  hull: number;
  sails: number;
  range: number;
}

export interface ArchiveEntry {
  id: number;
  day: number;
  category: string;
  msg: string;
  type: string;
  time: number;
}

export interface PlunderItem {
  name: string;
  value: number;
  source: string;
  qty: number;
}

export interface GameSettings {
  audio: boolean;
  reducedMotion: boolean;
  textScale: number;
  minimapMode: 'full' | 'compact' | 'hidden';
}

export interface QuestState {
  id: string;
  title: string;
  detail: string;
  kind: 'combat' | 'trade' | 'explore';
  goal: number;
  progress: number;
  rewardGold: number;
  rewardFame: number;
  completed: boolean;
}

export interface WorldEventState {
  id: string;
  title: string;
  detail: string;
  targetShip: string;
  rewardGold: number;
  rewardFame: number;
  active: boolean;
}
