export type PlanetColor = { primary: string; glow: string; ring: string; bg: string };

export const PLANET_COLORS: Record<string, PlanetColor> = {
  excel:    { primary: '#f97316', glow: 'rgba(249,115,22,0.35)',  ring: '#f97316', bg: 'rgba(249,115,22,0.08)' },
  html:     { primary: '#38bdf8', glow: 'rgba(56,189,248,0.35)', ring: '#38bdf8', bg: 'rgba(56,189,248,0.08)' },
  hardware: { primary: '#4ade80', glow: 'rgba(74,222,128,0.35)', ring: '#4ade80', bg: 'rgba(74,222,128,0.08)' },
  csharp:   { primary: '#c084fc', glow: 'rgba(192,132,252,0.35)',ring: '#c084fc', bg: 'rgba(192,132,252,0.08)' },
  photoshop:{ primary: '#f472b6', glow: 'rgba(244,114,182,0.35)',ring: '#f472b6', bg: 'rgba(244,114,182,0.08)' },
  default:  { primary: '#a78bfa', glow: 'rgba(167,139,250,0.35)',ring: '#a78bfa', bg: 'rgba(167,139,250,0.08)' },
};

const PALETTE_ORDER = ['#38bdf8','#4ade80','#f97316','#c084fc','#f472b6','#fbbf24','#fb923c','#34d399'];

export function getPlanetColors(groupName: string, groupIndex = 0): PlanetColor {
  const lower = groupName.toLowerCase();
  if (lower.includes('excel') || lower.includes('bi') || lower.includes('planilha')) return PLANET_COLORS.excel;
  if (lower.includes('html') || lower.includes('css') || lower.includes('web')) return PLANET_COLORS.html;
  if (lower.includes('hardware') || lower.includes('inform')) return PLANET_COLORS.hardware;
  if (lower.includes('c#') || lower.includes('csharp') || lower.includes('programação') || lower.includes('program')) return PLANET_COLORS.csharp;
  if (lower.includes('photo') || lower.includes('design') || lower.includes('adobe')) return PLANET_COLORS.photoshop;
  // Cycle through palette for unrecognized groups
  const hex = PALETTE_ORDER[groupIndex % PALETTE_ORDER.length] ?? '#a78bfa';
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return { primary: hex, glow: `rgba(${r},${g},${b},0.35)`, ring: hex, bg: `rgba(${r},${g},${b},0.08)` };
}
