const MONTHS = new Set([
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
]);

function titleCaseWord(word: string): string {
  if (!word) return word;
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function decodePath(src: string): string {
  const path = src.split(/[?#]/, 1)[0] ?? src;
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

/** `manaslu-august-2024` → `Manaslu, August 2024` */
export function labelFromAlbumFolder(folder: string): string {
  const parts = folder.split("-").filter(Boolean);
  if (parts.length === 0) return "";

  const year = parts.at(-1) ?? "";
  const month = parts.at(-2) ?? "";
  const place = parts.slice(0, -2);

  if (
    place.length > 0 &&
    /^\d{4}$/.test(year) &&
    MONTHS.has(month.toLowerCase())
  ) {
    return `${place.map(titleCaseWord).join(" ")}, ${titleCaseWord(month)} ${year}`;
  }

  return parts.map(titleCaseWord).join(" ");
}

/** Parent folder of a public photo URL, e.g. `/himalayan-trekking/manaslu-august-2024/file.jpg`. */
export function albumCaptionFromPhotoSrc(src: string): string | null {
  const segments = decodePath(src).split("/").filter(Boolean);
  if (segments.length < 2) return null;
  const folder = segments.at(-2);
  if (!folder) return null;
  const label = labelFromAlbumFolder(folder);
  return label || null;
}
