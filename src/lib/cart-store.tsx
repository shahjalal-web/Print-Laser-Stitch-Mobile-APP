import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { CartItem, NewCartItem } from './cart-types';
import { computeDiscountAmount, discountEligibleSubtotal, type CartDiscount } from './discount-types';

const STORAGE_KEY = 'pls_cart';
const DISCOUNT_KEY = 'pls_discount';

type CartContextValue = {
  isHydrated: boolean;
  items: CartItem[];
  itemCount: number;
  lineCount: number;
  subtotal: number;
  /** Currently-applied discount rule (from Shopify Admin API), or null. */
  discount: CartDiscount | null;
  /** Dollar amount the customer saves with `discount` at the current subtotal. */
  discountAmount: number;
  total: number;
  addItem: (item: NewCartItem) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, newQty: number) => void;
  clearCart: () => void;
  /** Replace the current discount (cleared when the cart empties or fails the minimum). */
  applyDiscount: (discount: CartDiscount) => void;
  clearDiscount: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

async function safeRead(): Promise<CartItem[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeWrite(items: CartItem[]) {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch(() => {
    // Storage full or unavailable — silently swallow, matches web behavior.
  });
}

async function safeReadDiscount(): Promise<CartDiscount | null> {
  try {
    const raw = await AsyncStorage.getItem(DISCOUNT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CartDiscount;
    if (!parsed?.code || !parsed?.valueType) return null;
    return parsed;
  } catch {
    return null;
  }
}

function safeWriteDiscount(d: CartDiscount | null) {
  const op = d ? AsyncStorage.setItem(DISCOUNT_KEY, JSON.stringify(d)) : AsyncStorage.removeItem(DISCOUNT_KEY);
  op.catch(() => {
    // ignore
  });
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState<CartDiscount | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    Promise.all([safeRead(), safeReadDiscount()]).then(([loadedItems, loadedDiscount]) => {
      setItems(loadedItems);
      setDiscount(loadedDiscount);
      setIsHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    safeWrite(items);
  }, [items, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    safeWriteDiscount(discount);
  }, [discount, isHydrated]);

  const addItem = useCallback<CartContextValue['addItem']>((item) => {
    setItems((prev) => [
      ...prev,
      {
        ...(item as CartItem),
        id: item.id ?? `${item.kind}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        addedAt: item.addedAt ?? Date.now(),
      },
    ]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQty = useCallback((id: string, newQty: number) => {
    if (newQty <= 0) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      return;
    }
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        if (i.kind === 'product') {
          return { ...i, qty: newQty, quantity: newQty, totalPrice: i.unitPrice * newQty };
        }
        // Vehicle sticker parts are single-quantity lines on the website too
        // (each part+vehicle+year combo can only be added once) — not
        // qty-editable from the cart.
        return i;
      }),
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setDiscount(null);
  }, []);

  const applyDiscount = useCallback((d: CartDiscount) => setDiscount(d), []);
  const clearDiscount = useCallback(() => setDiscount(null), []);

  const itemCount = useMemo(() => items.reduce((sum, i) => sum + (i.quantity || 0), 0), [items]);
  const lineCount = items.length;
  const subtotal = useMemo(() => items.reduce((sum, i) => sum + (i.totalPrice || 0), 0), [items]);

  // The subtotal a discount's value actually applies against — the whole
  // cart, unless it's sticker-scoped (see discount-types.ts), in which case
  // only vinyl-sticker line items count.
  const discountBaseSubtotal = useMemo(() => discountEligibleSubtotal(items, discount), [items, discount]);

  // If the cart no longer meets the applied discount's minimum, drop it so the
  // customer isn't confused at checkout.
  useEffect(() => {
    if (!isHydrated || !discount) return;
    if (
      typeof discount.minimumSubtotal === 'number' &&
      discountBaseSubtotal > 0 &&
      discountBaseSubtotal < discount.minimumSubtotal
    ) {
      setDiscount(null);
    }
  }, [discountBaseSubtotal, discount, isHydrated]);

  const discountAmount = useMemo(() => computeDiscountAmount(discount, discountBaseSubtotal), [discount, discountBaseSubtotal]);

  const total = useMemo(() => Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100), [subtotal, discountAmount]);

  const value: CartContextValue = useMemo(
    () => ({
      isHydrated,
      items,
      itemCount,
      lineCount,
      subtotal,
      discount,
      discountAmount,
      total,
      addItem,
      removeItem,
      updateQty,
      clearCart,
      applyDiscount,
      clearDiscount,
    }),
    [
      isHydrated,
      items,
      itemCount,
      lineCount,
      subtotal,
      discount,
      discountAmount,
      total,
      addItem,
      removeItem,
      updateQty,
      clearCart,
      applyDiscount,
      clearDiscount,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
