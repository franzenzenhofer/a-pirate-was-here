export function shipHullFor(tk: string): {
  w: number;
  l: number;
  sailW: number;
  mainSail: number;
  masts: number;
  guns: number;
} {
  if (tk === 'CUTTER') return { w: 0.72, l: 2.2, sailW: 0.42, mainSail: 0.7, masts: 1, guns: 1 };
  if (tk === 'SLOOP') return { w: 0.82, l: 2.4, sailW: 0.48, mainSail: 0.82, masts: 1, guns: 1 };
  if (tk === 'BRIGANTINE') return { w: 0.9, l: 2.62, sailW: 0.54, mainSail: 1.08, masts: 2, guns: 2 };
  if (tk === 'CORVETTE') return { w: 0.95, l: 2.76, sailW: 0.58, mainSail: 1.14, masts: 2, guns: 3 };
  if (tk === 'FRIGATE') return { w: 1.04, l: 2.96, sailW: 0.6, mainSail: 1.18, masts: 2, guns: 3 };
  if (tk === 'FIRESHIP') return { w: 0.86, l: 2.45, sailW: 0.45, mainSail: 0.74, masts: 1, guns: 2 };
  if (tk === 'GALLEON') return { w: 1.1, l: 3.12, sailW: 0.62, mainSail: 1.22, masts: 3, guns: 4 };
  if (tk === 'DREAD_GHOST') return { w: 1.05, l: 3.08, sailW: 0.6, mainSail: 1.18, masts: 3, guns: 4 };
  return { w: 1.12, l: 3.28, sailW: 0.64, mainSail: 1.24, masts: 3, guns: 4 };
}
