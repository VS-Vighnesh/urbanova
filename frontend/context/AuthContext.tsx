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
import { apiFetch, clearToken, hasToken, saveToken } from "@/lib/api";
import type { User } from "@/types";

interface Credentials {
  email: string;
  password: string;
}

interface Registration extends Credentials {
  name: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (credentials: Credentials) => Promise<void>;
  register: (input: Registration) => Promise<void>;
  logout: () => void;
}

interface AuthResponse {
  access_token: string;
  user: User;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (!hasToken()) {
        if (active) setLoading(false);
        return undefined;
      }
      return apiFetch<User>("/api/auth/me")
        .then((currentUser) => {
          if (active) setUser(currentUser);
        })
        .catch(() => {
          clearToken();
          if (active) setUser(null);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    });
    return () => {
      active = false;
    };
  }, []);

  const authenticate = useCallback(async (path: string, input: Credentials | Registration) => {
    const result = await apiFetch<AuthResponse>(path, {
      method: "POST",
      body: JSON.stringify(input),
    });
    saveToken(result.access_token);
    setUser(result.user);
  }, []);

  const login = useCallback(
    (credentials: Credentials) => authenticate("/api/auth/login", credentials),
    [authenticate],
  );
  const register = useCallback(
    (input: Registration) => authenticate("/api/auth/register", input),
    [authenticate],
  );
  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
