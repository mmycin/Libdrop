import type { FileItem } from "@/lib/types";
import FileRow, { type FileActions } from "./FileRow";
import { FolderIcon } from "./Icons";

export default function ExplorerView({
  currentPath,
  subfolders,
  files,
  folderCounts,
  actions,
  onNavigate,
  onDeleteFolder,
}: {
  currentPath: string;
  subfolders: string[];
  files: FileItem[];
  folderCounts: Record<string, number>;
  actions: FileActions;
  onNavigate: (path: string) => void;
  onDeleteFolder: (path: string) => void;
}) {
  const crumbs = currentPath ? currentPath.split("/") : [];
  const crumbClass = (active: boolean) =>
    `px-2 py-1 rounded-md transition-colors ${
      active
        ? "bg-emerald-500/15 text-emerald-400 font-semibold"
        : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
    }`;

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      <div className="px-4 py-3 bg-zinc-900 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-1.5 text-xs font-mono"
        >
          <button
            onClick={() => onNavigate("")}
            className={crumbClass(currentPath === "")}
          >
            Root
          </button>
          {crumbs.map((segment, idx) => {
            const path = crumbs.slice(0, idx + 1).join("/");
            return (
              <span key={path} className="flex items-center gap-1.5">
                <span className="text-zinc-600">/</span>
                <button
                  onClick={() => onNavigate(path)}
                  className={crumbClass(idx === crumbs.length - 1)}
                >
                  {segment}
                </button>
              </span>
            );
          })}
        </nav>

        {currentPath && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate(crumbs.slice(0, -1).join("/"))}
              className="px-2.5 py-1 text-xs rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
            >
              Up
            </button>
            <button
              onClick={() => onDeleteFolder(currentPath)}
              className="px-2.5 py-1 text-xs rounded-md bg-red-950/70 hover:bg-red-900 text-red-400"
            >
              Delete Folder
            </button>
          </div>
        )}
      </div>

      {subfolders.length === 0 && files.length === 0 ? (
        <div className="p-10 text-center space-y-1">
          <p className="text-sm text-zinc-400">This folder is empty.</p>
          <p className="text-xs text-zinc-500">
            Create a subfolder or upload files above.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-800/80">
          {subfolders.map((path) => {
            const name = path.split("/").pop() || path;
            const count = folderCounts[path] ?? 0;
            return (
              <div
                key={path}
                className="px-4 py-3 flex items-center justify-between gap-4 hover:bg-zinc-900/80 transition-colors"
              >
                <button
                  onClick={() => onNavigate(path)}
                  className="flex items-center gap-3 min-w-0 flex-1 text-left group"
                >
                  <FolderIcon />
                  <div className="min-w-0">
                    <p className="text-sm font-mono text-zinc-100 group-hover:text-emerald-400 truncate transition-colors">
                      {name}/
                    </p>
                    <p className="text-xs text-zinc-500">
                      {count} file{count === 1 ? "" : "s"}
                    </p>
                  </div>
                </button>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onNavigate(path)}
                    className="px-3 py-1.5 text-xs rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                  >
                    Open
                  </button>
                  <button
                    onClick={() => onDeleteFolder(path)}
                    className="px-3 py-1.5 text-xs rounded-lg bg-red-950/70 text-red-400 hover:bg-red-900"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
          {files.map((file) => (
            <FileRow
              key={file.key}
              file={file}
              showFullPath={false}
              actions={actions}
            />
          ))}
        </div>
      )}
    </section>
  );
}

