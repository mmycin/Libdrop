import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { b2, BUCKET_NAME, isAuthorized } from "@/lib/b2";

function sanitizeFolderPath(folder: string): string {
  return folder
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .split("/")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0 && segment !== "." && segment !== "..")
    .map((segment) => segment.replace(/[^a-zA-Z0-9._ -]/g, "_"))
    .join("/");
}

function buildObjectKey(folder: string, filename: string): string {
  const cleanFolder = sanitizeFolderPath(folder);
  const baseName = filename.split("/").pop()?.split("\\").pop() || "file";
  const cleanFile = baseName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const safeFile =
    !cleanFile || cleanFile === "." || cleanFile === ".." ? "file" : cleanFile;
  return cleanFolder ? `${cleanFolder}/${safeFile}` : safeFile;
}

export async function POST(req: Request) {
  if (!process.env.ADMIN_PASSWORD || !isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, folder, filename, contentType } = body as {
      action?: string;
      folder?: string;
      filename?: string;
      contentType?: string;
    };

    const cleanFolder = sanitizeFolderPath(folder || "");

    if (action === "create-folder") {
      if (!cleanFolder) {
        return NextResponse.json(
          { error: "Folder path is required" },
          { status: 400 }
        );
      }

      const key = `${cleanFolder}/.keep`;
      await b2.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
          Body: "",
          ContentType: "text/plain; charset=utf-8",
        })
      );

      return NextResponse.json({ created: true, folder: cleanFolder, key });
    }

    const key = buildObjectKey(folder || "", filename || "file");
    const resolvedType = contentType || "text/plain; charset=utf-8";

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: resolvedType,
    });

    const uploadUrl = await getSignedUrl(b2, command, { expiresIn: 300 });
    return NextResponse.json({ uploadUrl, key });
  } catch (error) {
    console.error("Upload POST error:", error);
    return NextResponse.json(
      { error: "Failed to process upload request" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  if (!process.env.ADMIN_PASSWORD || !isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const key = buildObjectKey(folder, file.name || "file");
    const buffer = Buffer.from(await file.arrayBuffer());

    await b2.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: file.type || "text/plain; charset=utf-8",
      })
    );

    return NextResponse.json({ uploaded: true, key });
  } catch (error) {
    console.error("Upload PUT error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

