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
import { ApiError, apiFetch, clearToken, hasToken, saveToken } from "@/lib/api";
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
  sessionError: string | null;
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
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (!hasToken()) {
        if (active) setLoading(false);
        return undefined;
      }
      return apiFetch<User>("/api/auth/me")
        .then((currentUser) => {
          if (active) {
            setUser(currentUser);
            setSessionError(null);
          }
        })
        .catch((error: unknown) => {
          if (!active) return;
          setUser(null);
          if (error instanceof ApiError && error.status === 401) {
            clearToken();
            setSessionError("Your session has expired. Please sign in again.");
            return;
          }
          setSessionError(error instanceof Error ? error.message : "Unable to verify your session.");
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
    setSessionError(null);
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
    setSessionError(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, sessionError, login, register, logout }),
    [user, loading, sessionError, login, register, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
