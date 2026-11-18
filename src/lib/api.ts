import { UnauthorizedError } from "./types";

/** Authenticated JSON request to our own API. Throws on any non-2xx. */
export async function apiRequest<T = unknown>(
  url: string,
  password: string,
  init: { method?: string; body?: unknown } = {}
): Promise<T> {
  const res = await fetch(url, {
    method: init.method ?? "GET",
    cache: "no-store",
    headers: {
      "x-admin-password": password,
      ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (res.status === 401) throw new UnauthorizedError();
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data as T;
}

export async function verifyPassphrase(candidate: string): Promise<boolean> {
  const res = await fetch("/api/auth", {
    method: "POST",
    headers: { "x-admin-password": candidate },
  });
  return res.ok;
}

export function xhrUpload(
  url: string,
  body: XMLHttpRequestBodyInit,
  headers: Record<string, string>,
  onProgress: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v);
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) onProgress(Math.round((ev.loaded / ev.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else if (xhr.status === 401) reject(new UnauthorizedError());
      else reject(new Error(`Upload failed with status ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error("Network/CORS error"));
    xhr.send(body);
  });
}

