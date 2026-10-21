import type { StoragePort } from './storage/state.js';

export interface Appearance { primary: string; accent: string }
export const APPEARANCE_KEY = 'udla-notas:appearance:v1';
export const DEFAULT_APPEARANCE: Readonly<Appearance> = { primary: '#164b45', accent: '#d8edaa' };
export const PRESETS = [
  { name: 'Verde original', ...DEFAULT_APPEARANCE },
  { name: 'Azul', primary: '#244b8f', accent: '#bce6fc' },
  { name: 'Lavanda', primary: '#65418a', accent: '#e5cff8' },
  { name: 'Terracota', primary: '#843d32', accent: '#f8d2ad' },
] as const;

export function parseAppearance(value: unknown): Appearance {
  if (!value || typeof value !== 'object') throw new Error('Colores inválidos.');
  const { primary, accent } = value as Record<string, unknown>;
  if (typeof primary !== 'string' || typeof accent !== 'string'
    || !/^#[0-9a-f]{6}$/i.test(primary) || !/^#[0-9a-f]{6}$/i.test(accent)) {
    throw new Error('Usa colores en formato #RRGGBB.');
  }
  return { primary: primary.toLowerCase(), accent: accent.toLowerCase() };
}

export function loadAppearance(storage: Pick<StoragePort, 'getItem'>): Appearance {
  try {
    const raw = storage.getItem(APPEARANCE_KEY);
    return raw === null ? { ...DEFAULT_APPEARANCE } : parseAppearance(JSON.parse(raw));
  } catch { return { ...DEFAULT_APPEARANCE }; }
}

export function saveAppearance(storage: StoragePort, value: Appearance): void {
  // The independent key keeps grade backups and their schema unchanged.
  storage.setItem(APPEARANCE_KEY, JSON.stringify(parseAppearance(value)));
}

function rgb(hex: string): number[] {
  return [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16));
}
function mix(hex: string, target: string, amount: number): string {
  const other = rgb(target);
  return '#' + rgb(hex).map((value, i) => Math.round(value * (1 - amount) + other[i]! * amount)
    .toString(16).padStart(2, '0')).join('');
}
function luminance(hex: string): number {
  const channels = rgb(hex).map(value => {
    const v = value / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722;
}
export function contrast(a: string, b: string): number {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
function ink(background: string): string {
  return contrast(background, '#ffffff') >= contrast(background, '#000000') ? '#ffffff' : '#000000';
}

export function appearanceVariables(value: Appearance): Record<string, string> {
  const { primary, accent } = parseAppearance(value);
  // Derive readable text even when the user chooses very light or very dark colors.
  const onPrimary = ink(primary);
  const softText = mix(primary, onPrimary, 0.9);
  const accentSoft = mix(accent, '#ffffff', 0.78);
  const muted = mix(primary, '#000000', 0.62);
  return {
    '--green': primary, '--lime': accent,
    '--theme-on-primary': onPrimary, '--theme-on-accent': ink(accent),
    '--theme-primary-hover': mix(primary, onPrimary === '#ffffff' ? '#000000' : '#ffffff', 0.12),
    '--theme-text': mix(primary, '#000000', 0.82), '--muted': muted,
    '--theme-canvas': mix(primary, '#ffffff', 0.97),
    '--theme-chrome': mix(primary, '#ffffff', 0.985),
    '--theme-soft': mix(primary, '#ffffff', 0.94),
    '--line': mix(primary, '#ffffff', 0.84),
    '--theme-accent-soft': accentSoft, '--theme-on-accent-soft': ink(accentSoft),
    '--theme-focus': mix(primary, '#000000', 0.42),
    '--theme-meter': mix(primary, '#000000', 0.28),
    '--theme-on-primary-soft': contrast(primary, softText) >= 4.5 ? softText : onPrimary,
    '--theme-hero-line': mix(primary, onPrimary, 0.35),
  };
}

export function applyAppearance(value: Appearance, page: Document = document): void {
  for (const [key, color] of Object.entries(appearanceVariables(value))) {
    page.documentElement.style.setProperty(key, color);
  }
  page.documentElement.dataset.appearance = 'custom';
  page.querySelector('meta[name="theme-color"]')?.setAttribute('content', value.primary);
}
