"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest, xhrUpload } from "@/lib/api";
import { BINARY_EXT_RE, getFileName, getFolderDir } from "@/lib/format";
import {
  UnauthorizedError,
  type Banner,
  type FileItem,
  type PreviewState,
  type UploadProgress,
  type ViewMode,
} from "@/lib/types";
import Header from "./Header";
import StatusBanner from "./StatusBanner";
import CreateFolderForm from "./CreateFolderForm";
import UploadPanel from "./UploadPanel";
import SearchToolbar from "./SearchToolbar";
import SearchResults from "./SearchResults";
import ExplorerView from "./ExplorerView";
import GroupedView from "./GroupedView";
import PreviewModal from "./PreviewModal";
import type { FileActions } from "./FileRow";

interface ListResponse {
  files: FileItem[];
  folders: string[];
}

export default function Hub({
  password,
  onLogout,
}: {
  password: string;
  onLogout: () => void;
}) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [currentPath, setCurrentPath] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("explorer");
  const [search, setSearch] = useState("");

  const [banner, setBanner] = useState<Banner | null>(null);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [progress, setProgress] = useState<UploadProgress | null>(null);

  const showStatus = useCallback(
    (type: Banner["type"], text: string) => setBanner({ type, text }),
    []
  );

  /** Route any failure to the right place (401 logs out). */
  const handleError = useCallback(
    (err: unknown, fallback: string) => {
      if (err instanceof UnauthorizedError) {
        onLogout();
        return;
      }
      showStatus("error", err instanceof Error ? err.message : fallback);
    },
    [onLogout, showStatus]
  );

  const loadList = useCallback(
    () => apiRequest<ListResponse>("/api/files", password),
    [password]
  );

  const applyList = useCallback((data: ListResponse) => {
    setFiles(Array.isArray(data.files) ? data.files : []);
    setFolders(Array.isArray(data.folders) ? data.folders : []);
    setListError(null);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      applyList(await loadList());
    } catch (err) {
      if (err instanceof UnauthorizedError) onLogout();
      else
        setListError(
          err instanceof Error ? err.message : "Could not connect to storage"
        );
    } finally {
      setLoading(false);
    }
  }, [applyList, loadList, onLogout]);

  useEffect(() => {
    let cancelled = false;
    loadList()
      .then((data) => {
        if (!cancelled) applyList(data);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof UnauthorizedError) onLogout();
        else
          setListError(
            err instanceof Error ? err.message : "Could not connect to storage"
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadList, applyList, onLogout]);

  // ---------- actions ----------

  const createFolder = useCallback(
    async (fullPath: string): Promise<boolean> => {
      setBanner(null);
      try {
        const data = await apiRequest<{ folder: string }>("/api/upload", password, {
          method: "POST",
          body: { action: "create-folder", folder: fullPath },
        });
        await refresh();
        setCurrentPath(data.folder);
        setViewMode("explorer");
        showStatus("success", `Created folder /${data.folder}`);
        return true;
      } catch (err) {
        handleError(err, "Could not create folder");
        return false;
      }
    },
    [password, refresh, showStatus, handleError]
  );

  const uploadFiles = useCallback(
    async (selected: File[], rawFolder: string) => {
      setBanner(null);
      const folder = rawFolder.trim().replace(/^\/+|\/+$/g, "");
      let uploaded = 0;

      try {
        for (let i = 0; i < selected.length; i++) {
          const file = selected[i];
          const contentType = file.type || "text/plain; charset=utf-8";
          const report = (percent: number) =>
            setProgress({
              filename: file.name,
              percent,
              current: i + 1,
              total: selected.length,
            });
          report(0);

          const { uploadUrl } = await apiRequest<{ uploadUrl: string }>(
            "/api/upload",
            password,
            {
              method: "POST",
              body: { folder, filename: file.name, contentType },
            }
          );

          try {
            await xhrUpload(uploadUrl, file, { "Content-Type": contentType }, report);
          } catch {
            // Direct-to-B2 failed (likely CORS) — fall back to server upload.
            const form = new FormData();
            form.append("file", file);
            form.append("folder", folder);
            await xhrUpload(
              "/api/upload",
              form,
              { "x-admin-password": password },
              report
            );
          }
          uploaded++;
        }
      } catch (err) {
        handleError(err, "Upload failed");
      } finally {
        setProgress(null);
      }

      if (uploaded > 0) {
        await refresh();
        showStatus(
          "success",
          `Uploaded ${uploaded} file${uploaded > 1 ? "s" : ""} to /${folder || "Root"}.`
        );
      }
    },
    [password, refresh, showStatus, handleError]
  );

  const openSigned = useCallback(
    async (key: string, mode: "view" | "download") => {
      try {
        const { url } = await apiRequest<{ url: string }>("/api/files", password, {
          method: "POST",
          body: { key, mode },
        });
        if (mode === "download") {
          const a = document.createElement("a");
          a.href = url;
          a.download = getFileName(key);
          a.rel = "noopener noreferrer";
          document.body.appendChild(a);
          a.click();
          a.remove();
        } else {
          window.open(url, "_blank", "noopener,noreferrer");
        }
      } catch (err) {
        handleError(err, "Could not open file");
      }
    },
    [password, handleError]
  );

  const openPreview = useCallback(
    async (file: FileItem) => {
      const fail = (error: string) =>
        setPreview({ key: file.key, content: "", loading: false, error });

      if (BINARY_EXT_RE.test(file.key))
        return fail("Binary or archive file cannot be previewed. Use Raw or Download.");
      if (file.size > 2 * 1024 * 1024)
        return fail("File exceeds 2 MB preview limit. Use Raw or Download.");

      setPreview({ key: file.key, content: "", loading: true, error: null });
      try {
        const data = await apiRequest<{ content: string }>("/api/files", password, {
          method: "POST",
          body: { key: file.key, mode: "content" },
        });
        setPreview({
          key: file.key,
          content: data.content ?? "",
          loading: false,
          error: null,
        });
      } catch (err) {
        if (err instanceof UnauthorizedError) onLogout();
        else fail(err instanceof Error ? err.message : "Failed to preview file");
      }
    },
    [password, onLogout]
  );

  const deleteFile = useCallback(
    async (key: string) => {
      if (!window.confirm(`Delete "${key}"?`)) return;
      try {
        await apiRequest("/api/files", password, {
          method: "DELETE",
          body: { key },
        });
        setPreview((p) => (p?.key === key ? null : p));
        await refresh();
        showStatus("success", `Deleted ${key}`);
      } catch (err) {
        handleError(err, "Could not delete file");
      }
    },
    [password, refresh, showStatus, handleError]
  );

  const deleteFolder = useCallback(
    async (folderPrefix: string) => {
      if (
        !window.confirm(
          `Delete folder "/${folderPrefix}" and ALL files/subfolders inside it?`
        )
      )
        return;
      try {
        await apiRequest("/api/files", password, {
          method: "DELETE",
          body: { folderPrefix },
        });
        setCurrentPath((cur) =>
          cur === folderPrefix || cur.startsWith(`${folderPrefix}/`)
            ? folderPrefix.split("/").slice(0, -1).join("/")
            : cur
        );
        await refresh();
        showStatus("success", `Deleted folder /${folderPrefix}`);
      } catch (err) {
        handleError(err, "Could not delete folder");
      }
    },
    [password, refresh, showStatus, handleError]
  );

  const actions: FileActions = {
    onPreview: openPreview,
    onViewRaw: (key) => void openSigned(key, "view"),
    onDownload: (key) => void openSigned(key, "download"),
    onDelete: (key) => void deleteFile(key),
  };

  // ---------- derived data ----------

  const subfolders = useMemo(() => {
    const prefix = currentPath ? `${currentPath}/` : "";
    return folders.filter((f) => {
      if (currentPath && !f.startsWith(prefix)) return false;
      const rest = currentPath ? f.slice(prefix.length) : f;
      return rest.length > 0 && !rest.includes("/");
    });
  }, [folders, currentPath]);

  const directFiles = useMemo(() => {
    const prefix = currentPath ? `${currentPath}/` : "";
    return files.filter((f) => {
      if (!currentPath) return !f.key.includes("/");
      if (!f.key.startsWith(prefix)) return false;
      const rest = f.key.slice(prefix.length);
      return rest.length > 0 && !rest.includes("/");
    });
  }, [files, currentPath]);

  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const folder of folders) {
      const prefix = `${folder}/`;
      counts[folder] = files.filter((f) => f.key.startsWith(prefix)).length;
    }
    return counts;
  }, [folders, files]);

  const term = search.trim().toLowerCase();
  const matchingFolders = useMemo(
    () => (term ? folders.filter((f) => f.toLowerCase().includes(term)) : []),
    [folders, term]
  );
  const matchingFiles = useMemo(
    () => (term ? files.filter((f) => f.key.toLowerCase().includes(term)) : []),
    [files, term]
  );

  const grouped = useMemo(() => {
    const groups: Record<string, FileItem[]> = {};
    for (const folder of folders) groups[folder] = [];
    for (const file of files) {
      (groups[getFolderDir(file.key) || "(Root)"] ??= []).push(file);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [files, folders]);

  // ---------- render ----------

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-6 md:p-10 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        <Header onRefresh={() => void refresh()} onLogout={onLogout} />

        {banner && (
          <StatusBanner banner={banner} onDismiss={() => setBanner(null)} />
        )}

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CreateFolderForm currentPath={currentPath} onCreate={createFolder} />
          <UploadPanel
            currentPath={currentPath}
            progress={progress}
            onUpload={uploadFiles}
          />
        </section>

        <SearchToolbar
          search={search}
          onSearch={setSearch}
          viewMode={viewMode}
          onViewMode={setViewMode}
        />

        {listError ? (
          <div className="p-6 rounded-xl border border-red-900/60 bg-red-950/20 text-sm text-red-300 break-words">
            {listError}
          </div>
        ) : loading ? (
          <div className="p-10 rounded-xl border border-zinc-800 bg-zinc-900/40 text-center text-sm text-zinc-500">
            Loading repository tree from Backblaze B2...
          </div>
        ) : term ? (
          <SearchResults
            term={search.trim()}
            folders={matchingFolders}
            files={matchingFiles}
            folderCounts={folderCounts}
            actions={actions}
            onOpenFolder={(path) => {
              setCurrentPath(path);
              setViewMode("explorer");
              setSearch("");
            }}
          />
        ) : viewMode === "explorer" ? (
          <ExplorerView
            currentPath={currentPath}
            subfolders={subfolders}
            files={directFiles}
            folderCounts={folderCounts}
            actions={actions}
            onNavigate={setCurrentPath}
            onDeleteFolder={(p) => void deleteFolder(p)}
          />
        ) : (
          <GroupedView
            groups={grouped}
            actions={actions}
            onNavigate={(path) => {
              setCurrentPath(path);
              setViewMode("explorer");
            }}
            onDeleteFolder={(p) => void deleteFolder(p)}
          />
        )}
      </div>

      {preview && (
        <PreviewModal
          preview={preview}
          onClose={() => setPreview(null)}
          onViewRaw={(key) => void openSigned(key, "view")}
          onDownload={(key) => void openSigned(key, "download")}
          onError={(msg) => showStatus("error", msg)}
        />
      )}
    </main>
  );
}

