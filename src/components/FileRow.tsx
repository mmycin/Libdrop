import type { FileItem } from "@/lib/types";
import { formatBytes, formatDate, getFileName } from "@/lib/format";
import { FileIcon } from "./Icons";

export interface FileActions {
  onPreview: (file: FileItem) => void;
  onViewRaw: (key: string) => void;
  onDownload: (key: string) => void;
  onDelete: (key: string) => void;
}

const btn =
  "px-3 py-1.5 text-xs rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200";

export default function FileRow({
  file,
  showFullPath,
  actions,
}: {
  file: FileItem;
  showFullPath: boolean;
  actions: FileActions;
}) {
  const name = showFullPath ? `/${file.key}` : getFileName(file.key);

  return (
    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-900/60 transition-colors">
      <button
        onClick={() => actions.onPreview(file)}
        className="flex items-center gap-3 min-w-0 flex-1 text-left group"
      >
        <FileIcon />
        <div className="min-w-0">
          <p className="text-sm font-mono text-zinc-100 group-hover:text-emerald-400 truncate transition-colors">
            {name}
          </p>
          <p className="text-xs text-zinc-500">
            {formatBytes(file.size)}
            {file.lastModified ? ` · ${formatDate(file.lastModified)}` : ""}
          </p>
        </div>
      </button>
      <div className="flex items-center gap-2 shrink-0">
        <button onClick={() => actions.onPreview(file)} className={btn}>
          Preview
        </button>
        <button onClick={() => actions.onViewRaw(file.key)} className={btn}>
          Raw
        </button>
        <button onClick={() => actions.onDownload(file.key)} className={btn}>
          Download
        </button>
        <button
          onClick={() => actions.onDelete(file.key)}
          className="px-3 py-1.5 text-xs rounded-lg bg-red-950/70 text-red-400 hover:bg-red-900"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

