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

export interface FleetRoleSummary {
  escort: number;
  cargo: number;
  raider: number;
}

export interface GameMilestone {
  id: string;
  day: number;
  title: string;
  detail: string;
  category: 'era' | 'legend' | 'treasure' | 'mutiny' | 'fleet' | 'reputation';
}

export interface GameSettings {
  audio: boolean;
  reducedMotion: boolean;
  textScale: number;
  minimapMode: 'full' | 'compact' | 'hidden';
  colorSafeHud: boolean;
  seaAudio: number;
  musicAudio: number;
  preferredSeed: number;
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

export interface FloatingPickup {
  id: string;
  kind: 'cargo' | 'map' | 'tooth';
  x: number;
  y: number;
  vx: number;
  vy: number;
  value: number;
  ttl: number;
  label: string;
  source: string;
  color: string;
}

export interface FogZone {
  id: string;
  x: number;
  y: number;
  radius: number;
  ttl: number;
  strength: number;
}

export interface RivalCaptain {
  id: string;
  name: string;
  shipType: string;
  fame: number;
  defeated: boolean;
}

export interface SimEvent {
  id: string;
  kind: 'log' | 'era_up' | 'toast' | 'screen_shake' | 'sound' | 'milestone';
  msg: string;
  tone?: 'r' | 'g' | 'b' | 'o';
  duration?: number;
}
