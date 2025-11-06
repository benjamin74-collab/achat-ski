// src/lib/blob.ts
import { put, del } from "@vercel/blob";

export async function uploadToBlob(
  file: File | Blob,
  keyPrefix: string,
  contentType?: string
) {
  const extGuess =
    (contentType && contentType.split("/")[1]) ||
    "bin";
  const timestamp = Date.now();
  const key = `${keyPrefix}/${timestamp}-${Math.random().toString(36).slice(2)}.${extGuess}`;

  const r = await put(key, file, {
    access: "public",
    contentType,
    addRandomSuffix: false,
  });
  return {
    storageKey: r.pathname.replace(/^\//, ""),
    publicUrl: r.url,
  };
}

export async function deleteFromBlob(storageKey: string) {
  await del(storageKey);
}
