import type { FileItem } from "@/lib/types";
import FileRow, { type FileActions } from "./FileRow";
import { FolderIcon } from "./Icons";

export default function SearchResults({
  term,
  folders,
  files,
  folderCounts,
  actions,
  onOpenFolder,
}: {
  term: string;
  folders: string[];
  files: FileItem[];
  folderCounts: Record<string, number>;
  actions: FileActions;
  onOpenFolder: (path: string) => void;
}) {
  return (
    <section className="space-y-4">
      <p className="text-xs text-zinc-400">
        Showing {folders.length} folder{folders.length === 1 ? "" : "s"} and{" "}
        {files.length} file{files.length === 1 ? "" : "s"} matching &ldquo;
        {term}&rdquo;
      </p>

      {folders.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
          <div className="px-4 py-2 bg-zinc-900 border-b border-zinc-800 text-xs font-medium text-zinc-400">
            Matching Folders
          </div>
          <div className="divide-y divide-zinc-800/80">
            {folders.map((folder) => (
              <div
                key={folder}
                className="px-4 py-2.5 flex items-center justify-between gap-3 hover:bg-zinc-900/80"
              >
                <button
                  onClick={() => onOpenFolder(folder)}
                  className="flex items-center gap-2.5 text-left min-w-0 flex-1"
                >
                  <FolderIcon />
                  <span className="text-sm font-mono text-emerald-400 truncate">
                    /{folder}
                  </span>
                </button>
                <span className="text-xs text-zinc-500 shrink-0">
                  {folderCounts[folder] ?? 0} files
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {files.length > 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden divide-y divide-zinc-800/80">
          {files.map((file) => (
            <FileRow key={file.key} file={file} showFullPath actions={actions} />
          ))}
        </div>
      ) : (
        folders.length === 0 && (
          <p className="text-sm text-zinc-500 py-8 text-center">
            No matching folders or files found.
          </p>
        )
      )}
    </section>
  );
}

