export const BINARY_EXT_RE =
  /\.(zip|tar|gz|7z|rar|pdf|png|jpe?g|gif|webp|ico|svgz|mp3|mp4|wav|webm|exe|dll|so|dylib|class|jar|war|bin|woff2?|ttf|eot)$/i;

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getFileName(key: string): string {
  return key.split("/").pop() || key;
}

export function getFolderDir(key: string): string {
  const parts = key.split("/");
  return parts.length > 1 ? parts.slice(0, -1).join("/") : "";
}

