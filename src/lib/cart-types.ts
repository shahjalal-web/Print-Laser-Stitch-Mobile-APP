/**
 * Cart item shapes matching the website's `cart-types.ts` closely enough
 * to post straight to /api/checkout-cart. The mobile app only produces
 * "product" kind items today (from the Shop tab's product page) — the
 * other kinds are placeholders so future configurators (vinyl stickers,
 * t-shirts, signage, decals, vehicle kits) can slot into the same cart
 * without changing this file's shape.
 */

export interface CartItemBase {
  id: string;
  addedAt: number;
  title: string;
  subtitle: string;
  thumbnail: string;
  unitLabel: string;
  totalPrice: number;
  quantity: number;
  /** Optional return path so the user can edit and re-add. */
  editHref?: string;
}

export interface ProductCartItem extends CartItemBase {
  kind: 'product';
  variantId: string;
  productTitle: string;
  selectedOptions: Record<string, string>;
  qty: number;
  unitPrice: number;
  extraProperties?: Record<string, string>;
}

export interface VehicleStickerCartItem extends CartItemBase {
  kind: 'vehicle-sticker';
  make: string;
  model: string;
  year: number;
  part: string;
  partLabel: string;
}

export interface VinylStickerCartItem extends CartItemBase {
  kind: 'vinyl-sticker';
  shape: string;
  material: string;
  size: string;
  customWidth?: number;
  customHeight?: number;
  roundedCorners: boolean | null;
  /** Snapped tier (50, 100, 250…) used for pricing. */
  tierQty: number;
  perUnit: number;
  fileUrl?: string;
  fileName?: string;
  instructions?: string;
  editHref: string;
  /** Preflight proof (set once the customer reviews & approves a proof via
   * the website's Proof Studio, opened in-browser and handed back here). */
  proof?: {
    status: 'approved' | 'changes-requested';
    /** Shopify Files URL of the flattened proof preview. */
    proofUrl?: string;
    /** Shopify Files URL of the production cutline SVG. */
    cutlineUrl?: string;
    shape: string;
    borderThickness: string;
    roundedCorners: string;
    removedBackground: boolean;
    lowResolution: boolean;
    /** Customer note when they asked for changes instead of approving. */
    changeNote?: string;
  };
}

/** Decal Signage Calculator (service-plan-based). Single rectangle × qty, one
 * of three service tiers, optional discount. No tax, no material. */
export interface SignageCartItem extends CartItemBase {
  kind: 'signage';
  /** Width in the chosen unit. */
  width: number;
  /** Length in the chosen unit. */
  length: number;
  /** Whether width/length are feet or inches. */
  unit: 'ft' | 'in';
  qty: number;
  servicePlan: string;
  servicePlanLabel: string;
  pricePerSqFt: number;
  unitAreaSqFt: number;
  totalAreaSqFt: number;
  discountPercent: number;
  subtotal: number;
  notes?: string;
}

export interface DecalPanelLine {
  type: string;
  typeLabel: string;
  /** Width in inches. */
  width: number;
  /** Height in inches. */
  height: number;
  description?: string;
}

/** Quick Quote calculator (multi-panel + material). Material's $/sqft × total
 * area, optional discount, 7% Martin County tax always on top. */
export interface DecalCartItem extends CartItemBase {
  kind: 'decal';
  panels: DecalPanelLine[];
  material: string;
  materialLabel: string;
  discountPercent: number;
  pricePerSqFt: number;
  totalAreaSqFt: number;
  /** Subtotal before discount + tax. */
  subtotal: number;
  /** Tax amount (7% Martin County, already baked into totalPrice). */
  taxAmount: number;
  notes?: string;
}

export type CartItem =
  | ProductCartItem
  | VehicleStickerCartItem
  | VinylStickerCartItem
  | SignageCartItem
  | DecalCartItem;

type DistributiveOmit<T, K extends keyof any> = T extends T ? Omit<T, K> : never;
export type NewCartItem = DistributiveOmit<CartItem, 'id' | 'addedAt'> &
  Partial<Pick<CartItemBase, 'id' | 'addedAt'>>;
