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
}

export type CartItem = ProductCartItem | VehicleStickerCartItem | VinylStickerCartItem;

type DistributiveOmit<T, K extends keyof any> = T extends T ? Omit<T, K> : never;
export type NewCartItem = DistributiveOmit<CartItem, 'id' | 'addedAt'> &
  Partial<Pick<CartItemBase, 'id' | 'addedAt'>>;
