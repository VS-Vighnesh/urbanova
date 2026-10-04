"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "urbanova_wishlist";

interface WishlistContextValue {
  slugs: string[];
  isSaved: (slug: string) => boolean;
  toggle: (slug: string) => void;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [slugs, setSlugs] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored || !active) return;
      try {
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.every((value): value is string => typeof value === "string")) {
          setSlugs(parsed);
        }
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const toggle = useCallback((slug: string) => {
    setSlugs((current) => {
      const next = current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug];
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);
  const value = useMemo(
    () => ({ slugs, isSaved: (slug: string) => slugs.includes(slug), toggle }),
    [slugs, toggle],
  );
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistContextValue {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist must be used inside WishlistProvider");
  return context;
}
