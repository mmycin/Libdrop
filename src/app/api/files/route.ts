import { NextResponse } from "next/server";
import {
  ListObjectsV2Command,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  type _Object,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { b2, BUCKET_NAME, isAuthorized } from "@/lib/b2";

interface FileEntry {
  key: string;
  size: number;
  lastModified: string;
}

const TEXT_CODE_EXT_RE =
  /\.(java|py|cpp|c|h|hpp|cs|ts|tsx|js|jsx|mjs|cjs|go|rs|rb|php|swift|kt|scala|txt|md|json|yaml|yml|toml|xml|html|css|scss|sql|sh|bash|zsh|dockerfile|makefile|env|gitignore)$/i;
const TEXT_CODE_NAME_RE = /^(Dockerfile|Makefile|\.gitignore|\.env(\..+)?)$/i;

async function listAllObjects(prefix?: string): Promise<_Object[]> {
  const objects: _Object[] = [];
  let continuationToken: string | undefined;

  do {
    const data = await b2.send(
      new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    );
    if (data.Contents) {
      objects.push(...data.Contents);
    }
    continuationToken = data.IsTruncated ? data.NextContinuationToken : undefined;
  } while (continuationToken);

  return objects;
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) return unauthorized();

  try {
    const objects = await listAllObjects();
    const folderSet = new Set<string>();
    const files: FileEntry[] = [];

    for (const item of objects) {
      if (!item.Key) continue;

      const isFolderMarker =
        item.Key.endsWith("/.keep") ||
        item.Key.endsWith("/") ||
        item.Key === ".keep";

      const trimmedKey = item.Key.replace(/\/+$/, "");
      const segments = trimmedKey.split("/").filter(Boolean);
      const folderDepth = item.Key.endsWith("/")
        ? segments.length
        : Math.max(0, segments.length - 1);

      for (let i = 1; i <= folderDepth; i++) {
        folderSet.add(segments.slice(0, i).join("/"));
      }

      if (!isFolderMarker) {
        files.push({
          key: item.Key,
          size: item.Size ?? 0,
          lastModified: item.LastModified?.toISOString() ?? "",
        });
      }
    }

    files.sort((a, b) => a.key.localeCompare(b.key));
    const folders = Array.from(folderSet).sort((a, b) => a.localeCompare(b));

    return NextResponse.json(
      { files, folders },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Files GET error:", error);
    const detail =
      error instanceof Error ? `${error.name}: ${error.message}` : "Unknown error";
    return NextResponse.json(
      { error: `Failed to list files from storage (${detail})` },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) return unauthorized();

  try {
    const body = await req.json();
    const { key, mode = "view" } = body as {
      key?: string;
      mode?: "view" | "download" | "content";
    };

    if (!key || typeof key !== "string") {
      return NextResponse.json({ error: "File key is required" }, { status: 400 });
    }

    if (mode === "content") {
      const data = await b2.send(
        new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
        })
      );
      const content = (await data.Body?.transformToString("utf-8")) ?? "";
      return NextResponse.json({ content, key });
    }

    const filename = key.split("/").pop() || "file";
    const isTextCode =
      TEXT_CODE_EXT_RE.test(filename) || TEXT_CODE_NAME_RE.test(filename);
    const safeDispositionName = filename.replace(/["\\\r\n]/g, "_");

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ...(mode === "download"
        ? {
            ResponseContentDisposition: `attachment; filename="${safeDispositionName}"`,
          }
        : isTextCode
        ? { ResponseContentType: "text/plain; charset=utf-8" }
        : {}),
    });

    const url = await getSignedUrl(b2, command, { expiresIn: 3600 });
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Files POST error:", error);
    return NextResponse.json(
      { error: "Failed to access file" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  if (!process.env.ADMIN_PASSWORD || !isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { key, folderPrefix } = body as {
      key?: string;
      folderPrefix?: string;
    };

    if (folderPrefix && typeof folderPrefix === "string") {
      const cleanPrefix = folderPrefix.trim().replace(/^\/+|\/+$/g, "");
      if (!cleanPrefix) {
        return NextResponse.json(
          { error: "Valid folderPrefix is required" },
          { status: 400 }
        );
      }

      const objects = await listAllObjects(`${cleanPrefix}/`);
      const keysToDelete = objects
        .map((obj) => obj.Key)
        .filter((k): k is string => Boolean(k));

      for (let i = 0; i < keysToDelete.length; i += 1000) {
        const batch = keysToDelete.slice(i, i + 1000).map((k) => ({ Key: k }));
        await b2.send(
          new DeleteObjectsCommand({
            Bucket: BUCKET_NAME,
            Delete: { Objects: batch },
          })
        );
      }

      return NextResponse.json({
        deleted: true,
        folderPrefix: cleanPrefix,
        count: keysToDelete.length,
      });
    }

    if (key && typeof key === "string") {
      await b2.send(
        new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
        })
      );
      return NextResponse.json({ deleted: true, key });
    }

    return NextResponse.json(
      { error: "key or folderPrefix is required" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Files DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete target" },
      { status: 500 }
    );
  }
}

