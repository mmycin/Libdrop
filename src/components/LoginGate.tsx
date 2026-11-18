"use client";

import { useState } from "react";
import { verifyPassphrase } from "@/lib/api";
import { CodeIcon } from "./Icons";

export default function LoginGate({
  onLogin,
}: {
  onLogin: (passphrase: string) => void;
}) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    setLoading(true);
    setError(null);
    try {
      if (await verifyPassphrase(value)) onLogin(value);
      else setError("Incorrect passphrase. Please try again.");
    } catch {
      setError("Failed to verify passphrase.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800"
      >
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CodeIcon />
          </div>
          <h1 className="text-xl font-bold tracking-tight">LabDrop</h1>
        </div>
        <p className="text-sm text-zinc-400">
          Enter the passphrase to access your code hub.
        </p>
        <input
          type="password"
          placeholder="Passphrase"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
          className="w-full px-3.5 py-2 text-sm rounded-lg bg-zinc-950 border border-zinc-800 focus:outline-none focus:border-emerald-500/60"
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="w-full py-2 text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white transition-colors"
        >
          {loading ? "Verifying..." : "Unlock"}
        </button>
      </form>
    </main>
  );
}

