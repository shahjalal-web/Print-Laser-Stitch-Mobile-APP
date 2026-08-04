/** Ports the website's configurator/colors.ts so the mobile product screen
 * can detect a Color option and render real swatches the same way. */

export const COLOR_HEX: Record<string, string> = {
  black: '#0b0b0b',
  'jet black': '#0b0b0b',
  white: '#f7f7f7',
  navy: '#1c2940',
  'navy blue': '#1c2940',
  red: '#c93434',
  'true red': '#c93434',
  'royal blue': '#1f4ec9',
  royal: '#1f4ec9',
  blue: '#2563eb',
  'sky blue': '#7dd3fc',
  'light blue': '#bae6fd',
  green: '#16a34a',
  'forest green': '#1b5e20',
  'kelly green': '#22c55e',
  'lime green': '#a3e635',
  yellow: '#fde047',
  orange: '#f97316',
  pink: '#ec4899',
  'hot pink': '#f43f5e',
  purple: '#7c3aed',
  maroon: '#7f1d1d',
  burgundy: '#7f1d1d',
  brown: '#78350f',
  tan: '#d2b48c',
  beige: '#e9dcc4',
  grey: '#6b7280',
  gray: '#6b7280',
  'heather grey': '#a3a3a3',
  'heather gray': '#a3a3a3',
  'charcoal grey': '#374151',
  'charcoal gray': '#374151',
  charcoal: '#374151',
  graphite: '#3c4043',
  silver: '#cbd5e1',
  gold: '#d4af37',
  multicolor: '#888888',
  multicolour: '#888888',
};

/** Resolve a hex code for a colour name — exact match first, then longest
 * substring match (so "Navy Blue" beats "Blue"). Null when nothing matches. */
export function colorHex(name: string): string | null {
  const n = name.toLowerCase().trim();
  if (n in COLOR_HEX) return COLOR_HEX[n];
  let best: { key: string; hex: string } | null = null;
  for (const [key, hex] of Object.entries(COLOR_HEX)) {
    if (n.includes(key) && (!best || key.length > best.key.length)) {
      best = { key, hex };
    }
  }
  return best?.hex ?? null;
}

/** Matches option names like "Color", "Colour", "Shirt Color", "T-Shirt Color". */
export function isColorOptionName(name: string): boolean {
  return /\bcolou?r\b/i.test(name);
}
