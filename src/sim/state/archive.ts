import type { ArchiveEntry } from '../../core/campaign-types';
import type { GameState } from './game-state';

const ARCHIVE_MAX = 240;

export function pushArchive(
  gs: GameState,
  msg: string,
  type: string,
  category: string = 'general',
): ArchiveEntry {
  const entry: ArchiveEntry = {
    id: gs.nextArchiveId++,
    day: gs.player.day,
    category,
    msg,
    type,
    time: Date.now(),
  };
  gs.archive.unshift(entry);
  if (gs.archive.length > ARCHIVE_MAX) gs.archive.length = ARCHIVE_MAX;
  return entry;
}

export function latestArchive(gs: GameState, count: number = 20): ArchiveEntry[] {
  return gs.archive.slice(0, count);
}
