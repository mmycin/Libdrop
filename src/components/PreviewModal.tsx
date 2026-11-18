"use client";

import { useEffect, useMemo, useState } from "react";
import type { PreviewState } from "@/lib/types";

export default function PreviewModal({
  preview,
  onClose,
  onViewRaw,
  onDownload,
  onError,
}: {
  preview: PreviewState;
  onClose: () => void;
  onViewRaw: (key: string) => void;
  onDownload: (key: string) => void;
  onError: (msg: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const lines = useMemo(
    () => (preview.content ? preview.content.split(/\r?\n/) : []),
    [preview.content]
  );

  async function copy() {
    try {
      await navigator.clipboard.writeText(preview.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      onError("Clipboard access failed.");
    }
  }

  const btn =
    "px-3 py-1.5 text-xs rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[88vh] rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 bg-zinc-900 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-mono text-zinc-100 truncate min-w-0">
            /{preview.key}
          </p>
          <div className="flex items-center gap-2 shrink-0">
            {!preview.loading && !preview.error && (
              <button
                onClick={copy}
                className="px-3 py-1.5 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors"
              >
                {copied ? "Copied!" : "Copy Code"}
              </button>
            )}
            <button onClick={() => onViewRaw(preview.key)} className={btn}>
              Raw
            </button>
            <button onClick={() => onDownload(preview.key)} className={btn}>
              Download
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs rounded-lg border border-zinc-700 hover:bg-zinc-800 text-zinc-300"
            >
              Close
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 bg-zinc-950 font-mono text-xs leading-6">
          {preview.loading ? (
            <div className="py-12 text-center text-zinc-400">
              Loading file contents...
            </div>
          ) : preview.error ? (
            <div className="py-10 text-center text-zinc-400">
              <p>{preview.error}</p>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <tbody>
                {lines.map((line, i) => (
                  <tr key={i} className="hover:bg-zinc-900/60">
                    <td className="select-none pr-4 text-right text-zinc-600 align-top w-10">
                      {i + 1}
                    </td>
                    <td className="whitespace-pre text-zinc-200">
                      {line || " "}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

