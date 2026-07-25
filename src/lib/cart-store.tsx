import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { CartItem, NewCartItem } from './cart-types';

const STORAGE_KEY = 'pls_cart';

type CartContextValue = {
  isHydrated: boolean;
  items: CartItem[];
  itemCount: number;
  lineCount: number;
  subtotal: number;
  total: number;
  addItem: (item: NewCartItem) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, newQty: number) => void;
  clearCart: () => void;
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

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    safeRead().then((loaded) => {
      setItems(loaded);
      setIsHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    safeWrite(items);
  }, [items, isHydrated]);

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

  const clearCart = useCallback(() => setItems([]), []);

  const itemCount = useMemo(() => items.reduce((sum, i) => sum + (i.quantity || 0), 0), [items]);
  const lineCount = items.length;
  const subtotal = useMemo(() => items.reduce((sum, i) => sum + (i.totalPrice || 0), 0), [items]);
  const total = Math.max(0, Math.round(subtotal * 100) / 100);

  const value: CartContextValue = useMemo(
    () => ({ isHydrated, items, itemCount, lineCount, subtotal, total, addItem, removeItem, updateQty, clearCart }),
    [isHydrated, items, itemCount, lineCount, subtotal, total, addItem, removeItem, updateQty, clearCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
