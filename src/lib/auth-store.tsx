import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { api, ApiError } from './api';

const TOKEN_KEY = 'pls_token';

export type Customer = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  displayName: string;
};

type AuthResult = { ok: true } | { ok: false; error: string; mayNeedPasswordSetup?: boolean };

type AuthContextValue = {
  isHydrated: boolean;
  customer: Customer | null;
  authHeader: HeadersInit | undefined;
  login: (email: string, password: string) => Promise<AuthResult>;
  signup: (input: {
    email: string;
    password: string;
    firstName: string;
    lastName?: string;
  }) => Promise<AuthResult>;
  logout: () => Promise<void>;
  /** Call after profile/password updates that return a rotated Shopify
   * token — Shopify issues a new one on those mutations and invalidates
   * the old one, so the stored copy must be replaced or the next request
   * gets rejected. */
  updateToken: (token: string) => Promise<void>;
  setCustomer: (customer: Customer) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function authHeaderFor(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync(TOKEN_KEY);
        if (stored) {
          try {
            const res = await api.get<{ customer: Customer }>('/api/auth/me', authHeaderFor(stored));
            setToken(stored);
            setCustomer(res.customer);
          } catch {
            // Expired/invalid — drop it silently, user just appears logged out.
            await SecureStore.deleteItemAsync(TOKEN_KEY);
          }
        }
      } catch {
        // Keychain unreadable — treat as logged out rather than crashing startup.
      }
      setIsHydrated(true);
    })();
  }, []);

  const login = useCallback<AuthContextValue['login']>(async (email, password) => {
    try {
      const res = await api.post<{ ok: boolean; token: string }>('/api/auth/login', { email, password });
      await SecureStore.setItemAsync(TOKEN_KEY, res.token);
      const me = await api.get<{ customer: Customer }>('/api/auth/me', authHeaderFor(res.token));
      setToken(res.token);
      setCustomer(me.customer);
      return { ok: true };
    } catch (err) {
      if (err instanceof ApiError) {
        const mayNeedPasswordSetup =
          err.data && typeof err.data === 'object' && 'mayNeedPasswordSetup' in err.data
            ? Boolean((err.data as { mayNeedPasswordSetup?: boolean }).mayNeedPasswordSetup)
            : false;
        return { ok: false, error: err.message, mayNeedPasswordSetup };
      }
      return { ok: false, error: 'Login failed — please try again.' };
    }
  }, []);

  const signup = useCallback<AuthContextValue['signup']>(async ({ email, password, firstName, lastName }) => {
    try {
      const res = await api.post<{ ok: boolean; token?: string; requiresManualLogin?: boolean }>(
        '/api/auth/signup',
        { email, password, firstName, lastName },
      );
      if (res.requiresManualLogin || !res.token) {
        return { ok: true };
      }
      await SecureStore.setItemAsync(TOKEN_KEY, res.token);
      const me = await api.get<{ customer: Customer }>('/api/auth/me', authHeaderFor(res.token));
      setToken(res.token);
      setCustomer(me.customer);
      return { ok: true };
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Signup failed — please try again.';
      return { ok: false, error: message };
    }
  }, []);

  const logout = useCallback(async () => {
    if (token) {
      api.post('/api/auth/logout', undefined, authHeaderFor(token)).catch(() => {
        // Best-effort server-side invalidation — still clear locally below.
      });
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setToken(null);
    setCustomer(null);
  }, [token]);

  const updateToken = useCallback(async (newToken: string) => {
    await SecureStore.setItemAsync(TOKEN_KEY, newToken);
    setToken(newToken);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isHydrated,
      customer,
      authHeader: token ? authHeaderFor(token) : undefined,
      login,
      signup,
      logout,
      updateToken,
      setCustomer,
    }),
    [isHydrated, customer, token, login, signup, logout, updateToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
