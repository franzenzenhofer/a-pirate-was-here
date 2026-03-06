export interface NationStyle {
  code: string;
  label: string;
  sailingLabel: string;
  primary: string;
  accent: string;
  text: string;
}

const DEFAULT_STYLE: NationStyle = {
  code: 'PIR',
  label: 'PIRATE',
  sailingLabel: 'BLACK FLAG',
  primary: '#111318',
  accent: '#f2f4f8',
  text: '#f2f4f8',
};

export const NATION_STYLES: Record<string, NationStyle> = {
  SPAIN: {
    code: 'SPA',
    label: 'SPANISH',
    sailingLabel: 'SPANISH COLORS',
    primary: '#f3c64f',
    accent: '#d7654a',
    text: '#1a1320',
  },
  ENGLAND: {
    code: 'ENG',
    label: 'ENGLISH',
    sailingLabel: 'ENGLISH COLORS',
    primary: '#d94d57',
    accent: '#f2f4f8',
    text: '#f2f4f8',
  },
  FRANCE: {
    code: 'FRA',
    label: 'FRENCH',
    sailingLabel: 'FRENCH COLORS',
    primary: '#4b86ff',
    accent: '#f2f4f8',
    text: '#f2f4f8',
  },
  DUTCH: {
    code: 'DUT',
    label: 'DUTCH',
    sailingLabel: 'DUTCH COLORS',
    primary: '#ff9d4a',
    accent: '#f2f4f8',
    text: '#1a1320',
  },
  PIRATE: DEFAULT_STYLE,
  GHOST: {
    code: 'GHO',
    label: 'GHOST',
    sailingLabel: 'CURSED COLORS',
    primary: '#7af0ff',
    accent: '#d9ffff',
    text: '#06131a',
  },
  MONSTER: {
    code: 'SEA',
    label: 'MONSTER',
    sailingLabel: 'SEA TERROR',
    primary: '#6d7a88',
    accent: '#dbe7ef',
    text: '#081116',
  },
  SIREN: {
    code: 'SIR',
    label: 'SIREN',
    sailingLabel: 'SIREN MIST',
    primary: '#ff8cc6',
    accent: '#ffd9ef',
    text: '#2b1024',
  },
};

export function normalizeNationKey(value: string | null | undefined): string {
  return (value ?? 'PIRATE').toUpperCase();
}

export function nationStyle(value: string | null | undefined): NationStyle {
  return NATION_STYLES[normalizeNationKey(value)] ?? DEFAULT_STYLE;
}
