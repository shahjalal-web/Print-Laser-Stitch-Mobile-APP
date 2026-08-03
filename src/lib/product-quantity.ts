/** Ports the website's product-type detection (src/app/products/[handle]/page.tsx
 * on the Next.js site) so the mobile product screen picks the same
 * quantity rules — apparel gets a per-size quantity matrix with a minimum
 * order size, everything else gets a plain quantity stepper (min 1 unless
 * the title encodes a higher minimum). */

const APPAREL_SIZE_PATTERN =
  /^(xxs|xs|s|m|l|xl|xxl|xxxl|\d+xl|small|medium|large|extra\s+(small|large))$/i;

export function isSizeOptionName(name: string): boolean {
  const n = name.toLowerCase().trim();
  return n === 'size' || /\bsize\b/i.test(n);
}

export function hasApparelSizes(values: readonly string[]): boolean {
  return values.some((v) => APPAREL_SIZE_PATTERN.test(v.trim()));
}

export function isQuantityOptionName(name: string): boolean {
  return name.toLowerCase().trim() === 'quantity';
}

/** "Min 12", "Minimum purchase 12", "12 Piece Minimum", "6-unit minimum"… */
export function detectMinQuantityFromTitle(title: string): number | null {
  const a = title.match(/\bmin(?:imum)?(?:\s+purchase)?\s+(\d+)/i);
  if (a) {
    const n = Number(a[1]);
    if (Number.isFinite(n) && n > 1) return n;
  }
  const b = title.match(
    /\b(\d+)[-\s]+(?:pcs?|pieces?|units?|packs?|qty)?[-\s]*min(?:imum)?(?:\s+purchase)?/i,
  );
  if (b) {
    const n = Number(b[1]);
    if (Number.isFinite(n) && n > 1) return n;
  }
  return null;
}

export const DEFAULT_APPAREL_MIN_QUANTITY = 12;
