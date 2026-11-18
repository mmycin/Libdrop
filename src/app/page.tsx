"use client";

import { useCallback, useEffect, useState } from "react";
import { verifyPassphrase } from "@/lib/api";
import Hub from "@/components/Hub";
import LoginGate from "@/components/LoginGate";

const STORAGE_KEY = "labdrop_pwd";

export default function Page() {
  const [password, setPassword] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  // Restore a saved session (state is only set inside promise callbacks).
  useEffect(() => {
    let cancelled = false;
    Promise.resolve(localStorage.getItem(STORAGE_KEY))
      .then(async (saved) => {
        if (!saved) return null;
        try {
          if (await verifyPassphrase(saved)) return saved;
          localStorage.removeItem(STORAGE_KEY);
        } catch {
          // transient network error: fall back to the login screen
        }
        return null;
      })
      .then((valid) => {
        if (cancelled) return;
        if (valid) setPassword(valid);
        setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback((passphrase: string) => {
    localStorage.setItem(STORAGE_KEY, passphrase);
    setPassword(passphrase);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setPassword(null);
  }, []);

  if (checking) {
    return <main className="min-h-screen bg-zinc-950" />;
  }

  return password ? (
    <Hub password={password} onLogout={logout} />
  ) : (
    <LoginGate onLogin={login} />
  );
}
