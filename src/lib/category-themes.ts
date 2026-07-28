/** Ported from the website's CategoryGrid.tsx — same pastel diagonal-split
 * card themes, keyed by Shopify collection handle where the client
 * specified one; other collections cycle through the set by index so new
 * collections still render on-brand. */
export type CategoryTheme = {
  base: string;
  diagonal: string;
  heading: string;
  desc: string;
};

export const CATEGORY_THEMES: CategoryTheme[] = [
  { base: '#ddd0ab', diagonal: '#c7a978', heading: '#5c4023', desc: '#6b5538' },
  { base: '#d7edad', diagonal: '#a9d97e', heading: '#1f5c2e', desc: '#2e6b3e' },
  { base: '#9adfc4', diagonal: '#5fae8d', heading: '#1c6b52', desc: '#256b52' },
  { base: '#b7a4e0', diagonal: '#9580c9', heading: '#3d2a63', desc: '#4a3a7a' },
  { base: '#a6bce8', diagonal: '#7e97d6', heading: '#274070', desc: '#33487a' },
  { base: '#ecdca0', diagonal: '#e0a35c', heading: '#8a5222', desc: '#8a5a2a' },
  { base: '#f0a8ba', diagonal: '#d94066', heading: '#7a1f3a', desc: '#832945' },
  { base: '#d6d6d6', diagonal: '#a3a3a3', heading: '#2b2b2b', desc: '#3c3c3c' },
  { base: '#8993d9', diagonal: '#5c67b8', heading: '#232a54', desc: '#28305e' },
];

const CATEGORY_THEME_BY_HANDLE: Record<string, CategoryTheme> = {
  'custom-hats': CATEGORY_THEMES[0],
  'custom-apparel': CATEGORY_THEMES[1],
  'stickers-labels': CATEGORY_THEMES[2],
  'signs-banners': CATEGORY_THEMES[3],
  'business-printing': CATEGORY_THEMES[4],
  'uv-printing': CATEGORY_THEMES[5],
  'laser-engraving': CATEGORY_THEMES[6],
  'vehicle-boat-graphics': CATEGORY_THEMES[8],
};

export function themeForCategory(handle: string, index: number): CategoryTheme {
  return CATEGORY_THEME_BY_HANDLE[handle] ?? CATEGORY_THEMES[index % CATEGORY_THEMES.length];
}
