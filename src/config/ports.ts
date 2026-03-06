/** Named Caribbean ports */
export const PORT_NAMES = [
  'HAVANA', 'PORTO BELLO', 'CARTAGENA', 'VERA CRUZ', 'CAMPECHE',
  'MARACAIBO', 'CARACAS', 'TRINIDAD', 'BARBADOS', 'TORTUGA',
  'PORT ROYAL', 'NASSAU', 'SANTO DOMINGO', 'SANTIAGO', 'RIO DE ORO',
  'SANTA MARTA', 'CUMANA', 'MARGARITA', 'CURACAO', 'ST KITTS',
  'MARTINIQUE', 'GUADELOUPE', 'DOMINICA', 'ANTIGUA', 'MONTSERRAT',
  'CAT IS', 'GRAND CAYMAN', 'PORT AU PRINCE', 'BELIZE', 'PANAMA',
] as const;

/** Nations that control ports */
export const NATIONS = ['SPAIN', 'ENGLAND', 'FRANCE', 'DUTCH', 'PIRATE'] as const;
export type Nation = (typeof NATIONS)[number];

/** Nation flag emojis */
export const NATION_FLAGS: Record<string, string> = {
  SPAIN: '🇪🇸',
  ENGLAND: '🏴',
  FRANCE: '🇫🇷',
  DUTCH: '🇳🇱',
  PIRATE: '🏴‍☠️',
};

/** Enemy ship roles */
export const ROLES = ['MERCHANT', 'PIRATE', 'WARSHIP', 'ESCORT', 'PATROL'] as const;

/** Enemy tier levels */
export const TIERS = ['EASY', 'MEDIUM', 'HARD', 'ELITE', 'LEGEND'] as const;

/** Role behavior profiles */
export const BEHAVIOR: Record<string, { aggro: number; flee: number; wander: boolean; portAttack: boolean }> = {
  MERCHANT: { aggro: 0.0,  flee: 0.60, wander: true,  portAttack: false },
  PIRATE:   { aggro: 0.85, flee: 0.25, wander: true,  portAttack: true },
  WARSHIP:  { aggro: 0.60, flee: 0.15, wander: false, portAttack: true },
  ESCORT:   { aggro: 0.75, flee: 0.15, wander: false, portAttack: false },
  PATROL:   { aggro: 0.50, flee: 0.20, wander: true,  portAttack: false },
};
