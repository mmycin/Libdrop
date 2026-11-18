"use client";

import { useState } from "react";

export default function CreateFolderForm({
  currentPath,
  onCreate,
}: {
  currentPath: string;
  onCreate: (fullPath: string) => Promise<boolean>;
}) {
  const [name, setName] = useState("");
  const [fromRoot, setFromRoot] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const raw = name.trim().replace(/^\/+|\/+$/g, "");
    if (!raw) return;
    const target = currentPath && !fromRoot ? `${currentPath}/${raw}` : raw;
    setBusy(true);
    const ok = await onCreate(target);
    setBusy(false);
    if (ok) setName("");
  }

  const prefixed = currentPath && !fromRoot;

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-3 flex flex-col justify-between"
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-zinc-200">
            New Folder / Subfolder
          </h2>
          {currentPath && (
            <label className="flex items-center gap-1.5 text-xs text-zinc-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={fromRoot}
                onChange={(e) => setFromRoot(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-950 accent-emerald-500"
              />
              Create from Root
            </label>
          )}
        </div>
        <div className="flex items-center rounded-lg bg-zinc-950 border border-zinc-800 focus-within:border-emerald-500/60 overflow-hidden">
          {prefixed && (
            <span className="pl-3 pr-1 py-2 text-xs font-mono text-emerald-400/90 shrink-0">
              /{currentPath}/
            </span>
          )}
          <input
            type="text"
            placeholder={prefixed ? "Lab-01 or Lab-01/Task-A" : "CSE110L/Lab-01"}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-transparent focus:outline-none font-mono"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={busy || !name.trim()}
        className="w-full py-2 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-100 transition-colors"
      >
        {busy ? "Creating..." : "Create Folder"}
      </button>
    </form>
  );
}

