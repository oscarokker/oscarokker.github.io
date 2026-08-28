import { promises as fs } from "node:fs";
import path from "node:path";

export const HIMALAYA_PHOTO_DIR = "himalayan-trekking";

/** Disk folder names, streamed in this order: Manaslu, then Annapurna. */
export const HIMALAYA_ALBUM_FOLDERS = [
  "manaslu-august-2024",
  "annapurna-july-2024",
] as const;

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

function toPublicUrl(...segments: string[]): string {
  return `/${segments.map((segment) => encodeURI(segment)).join("/")}`;
}

async function listImagesInFolder(folder: string): Promise<string[]> {
  const dir = path.join(process.cwd(), "public", HIMALAYA_PHOTO_DIR, folder);

  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  return entries
    .filter(
      (entry) =>
        entry.isFile() &&
        IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()),
    )
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, "en"))
    .map((name) => toPublicUrl(HIMALAYA_PHOTO_DIR, folder, name));
}

export async function listHimalayaPhotoUrls(): Promise<string[]> {
  const photos: string[] = [];

  for (const folder of HIMALAYA_ALBUM_FOLDERS) {
    photos.push(...(await listImagesInFolder(folder)));
  }

  return photos;
}
