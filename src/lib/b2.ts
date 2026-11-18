import { S3Client } from "@aws-sdk/client-s3";

export const b2 = new S3Client({
  region: process.env.B2_REGION!,
  endpoint: `https://${process.env.B2_ENDPOINT}`,
  credentials: {
    accessKeyId: process.env.B2_KEY_ID!,
    secretAccessKey: process.env.B2_APPLICATION_KEY!,
  },
  // Required for Backblaze B2 S3 compatibility with newer AWS SDK v3 versions
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

export const BUCKET_NAME = process.env.B2_BUCKET_NAME!;

/** Every API route (read and write) requires the admin passphrase. */
export function isAuthorized(req: Request): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return req.headers.get("x-admin-password") === expected;
}
