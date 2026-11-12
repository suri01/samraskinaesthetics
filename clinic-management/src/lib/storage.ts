import { mkdir, writeFile, readFile } from "fs/promises";
import path from "path";
import { randomToken } from "./crypto";

const LOCAL_ROOT = path.join(process.cwd(), ".data", "uploads");

export function storageMode(): "local" | "s3" {
  return process.env.S3_BUCKET ? "s3" : "local";
}

export async function putObject(input: {
  clinicId: string;
  contentType: string;
  bytes: Buffer;
  filenameHint?: string;
}): Promise<{ key: string; byteSize: number }> {
  const ext = extensionFor(input.contentType);
  const key = `${input.clinicId}/${new Date().toISOString().slice(0, 10)}/${randomToken(16)}${ext}`;

  if (storageMode() === "s3") {
    // Adapter stub: wire AWS SDK / R2 when credentials exist.
    throw new Error("S3 adapter not configured in this environment — unset S3_BUCKET to use local disk.");
  }

  const full = path.join(LOCAL_ROOT, key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, input.bytes);
  return { key, byteSize: input.bytes.length };
}

export async function getObject(key: string): Promise<{ bytes: Buffer; contentType?: string }> {
  if (storageMode() === "s3") {
    throw new Error("S3 adapter not configured");
  }
  const full = path.join(LOCAL_ROOT, key);
  const bytes = await readFile(full);
  return { bytes };
}

function extensionFor(contentType: string): string {
  if (contentType === "image/jpeg") return ".jpg";
  if (contentType === "image/png") return ".png";
  if (contentType === "image/webp") return ".webp";
  if (contentType === "application/pdf") return ".pdf";
  return ".bin";
}

export const ALLOWED_UPLOAD_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
