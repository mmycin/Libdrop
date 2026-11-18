import { CodeIcon } from "./Icons";

export default function Header({
  onRefresh,
  onLogout,
}: {
  onRefresh: () => void;
  onLogout: () => void;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-5">
      <div>
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CodeIcon />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">LabDrop</h1>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
            B2 Code Hub
          </span>
        </div>
        <p className="text-sm text-zinc-400 mt-1">
          Browse folders, preview source code, and manage files.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onRefresh}
          className="px-3 py-1.5 text-xs rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition-colors"
        >
          Refresh
        </button>
        <button
          onClick={onLogout}
          className="px-3 py-1.5 text-xs rounded-lg border border-zinc-700 hover:bg-zinc-800 text-zinc-300 transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );
}

