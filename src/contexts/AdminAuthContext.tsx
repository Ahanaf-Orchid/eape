"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

interface AdminAuthContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  checkSession: () => boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const STORAGE_KEY = "eape_admin_session";

interface SessionData {
  email: string;
  token: string;
  loggedInAt: number;
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  const checkSession = useCallback((): boolean => {
    if (typeof window === "undefined") {
      setIsLoading(false);
      return false;
    }

    const sessionStr = localStorage.getItem(STORAGE_KEY);
    if (!sessionStr) {
      setIsLoggedIn(false);
      setToken(null);
      setIsLoading(false);
      return false;
    }

    try {
      const session: SessionData = JSON.parse(sessionStr);
      if (session.token) {
        setToken(session.token);
        setIsLoggedIn(true);
        setIsLoading(false);
        return true;
      }
      localStorage.removeItem(STORAGE_KEY);
      setToken(null);
      setIsLoggedIn(false);
      setIsLoading(false);
      return false;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      setToken(null);
      setIsLoggedIn(false);
      setIsLoading(false);
      return false;
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    const handler = () => {
      setToken(null);
      setIsLoggedIn(false);
    };
    window.addEventListener("admin-unauthorized", handler);
    return () => window.removeEventListener("admin-unauthorized", handler);
  }, []);

  const login = async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        const session: SessionData = { email, token: data.token, loggedInAt: Date.now() };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        setToken(data.token);
        setIsLoggedIn(true);
        return { ok: true };
      }

      return { ok: false, error: data.error || "Invalid credentials" };
    } catch {
      return { ok: false, error: "Network error" };
    }
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setIsLoggedIn(false);
  };

  return (
    <AdminAuthContext.Provider value={{ isLoggedIn, isLoading, token, login, logout, checkSession }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
}
