import type { FileItem } from "@/lib/types";
import FileRow, { type FileActions } from "./FileRow";

export default function GroupedView({
  groups,
  actions,
  onNavigate,
  onDeleteFolder,
}: {
  groups: [string, FileItem[]][];
  actions: FileActions;
  onNavigate: (path: string) => void;
  onDeleteFolder: (path: string) => void;
}) {
  if (groups.length === 0) {
    return (
      <div className="p-10 rounded-xl border border-zinc-800 bg-zinc-900/40 text-center text-sm text-zinc-500">
        No files or folders uploaded yet.
      </div>
    );
  }

  return (
    <section className="space-y-5">
      {groups.map(([dir, items]) => (
        <div
          key={dir}
          className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden"
        >
          <div className="px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between gap-3">
            <button
              onClick={() => onNavigate(dir === "(Root)" ? "" : dir)}
              className="text-xs font-mono text-emerald-400 hover:underline text-left truncate"
            >
              {dir === "(Root)" ? "/ (Root)" : `/${dir}`}
            </button>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-zinc-500">
                {items.length} file{items.length === 1 ? "" : "s"}
              </span>
              {dir !== "(Root)" && (
                <button
                  onClick={() => onDeleteFolder(dir)}
                  className="px-2 py-1 text-[11px] rounded bg-red-950/70 text-red-400 hover:bg-red-900"
                >
                  Delete Folder
                </button>
              )}
            </div>
          </div>
          {items.length === 0 ? (
            <div className="px-4 py-3 text-xs text-zinc-500 italic">
              Empty folder
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/80">
              {items.map((file) => (
                <FileRow
                  key={file.key}
                  file={file}
                  showFullPath={false}
                  actions={actions}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </section>
  );
}

