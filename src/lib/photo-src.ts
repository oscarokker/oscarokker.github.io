import { withBasePath } from "@/lib/base-path";

const PHOTO_WIDTHS = [640, 1080, 1920] as const;

/**
 * Gallery overlay used to hit `/_next/image?q=80`. That endpoint does not
 * exist in a static export, so these helpers now point at the public file.
 */
export const GALLERY_PHOTO_QUALITY = 80;

export function optimizedPhotoSrc(src: string): string {
  return withBasePath(src);
}

export function optimizedPhotoSrcSet(src: string): string {
  const url = withBasePath(src);
  return PHOTO_WIDTHS.map((width) => `${url} ${width}w`).join(", ");
}

export const GALLERY_PHOTO_SIZES =
  "(max-width: 560px) 50vw, min(40vw, 520px)";
