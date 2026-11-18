"use client";

import { useRef, useState } from "react";
import type { UploadProgress } from "@/lib/types";

export default function UploadPanel({
  currentPath,
  progress,
  onUpload,
}: {
  currentPath: string;
  progress: UploadProgress | null;
  onUpload: (files: File[], folder: string) => Promise<void>;
}) {
  // Re-syncs to the browsed folder whenever it changes (key pattern, no effect).
  const [override, setOverride] = useState<{ path: string; value: string }>({
    path: currentPath,
    value: currentPath,
  });
  const folder = override.path === currentPath ? override.value : currentPath;

  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function run(files: File[]) {
    if (!files.length) return;
    await onUpload(files, folder);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragActive(false);
        void run(Array.from(e.dataTransfer.files ?? []));
      }}
      className={`p-4 rounded-xl border transition-colors space-y-3 flex flex-col justify-between ${
        dragActive
          ? "bg-emerald-950/30 border-emerald-500"
          : "bg-zinc-900/70 border-zinc-800"
      }`}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-zinc-200">
            Upload Source Files
          </h2>
          <span className="text-xs text-zinc-500">Drag & drop or browse</span>
        </div>
        <div className="flex items-center rounded-lg bg-zinc-950 border border-zinc-800 focus-within:border-emerald-500/60 overflow-hidden">
          <span className="pl-3 pr-1.5 py-2 text-xs font-mono text-zinc-500 shrink-0">
            Target: /
          </span>
          <input
            type="text"
            placeholder="Root (leave empty) or Course/Lab"
            value={folder}
            onChange={(e) =>
              setOverride({ path: currentPath, value: e.target.value })
            }
            className="w-full pr-3 py-2 text-sm bg-transparent focus:outline-none font-mono"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center justify-center gap-2 w-full cursor-pointer py-2 px-4 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors">
          <span>Select Files (Multi-file supported)</span>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => void run(Array.from(e.target.files ?? []))}
          />
        </label>

        {progress && (
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-mono text-zinc-400">
              <span className="truncate">
                ({progress.current}/{progress.total}) {progress.filename}
              </span>
              <span>{progress.percent}%</span>
            </div>
            <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

