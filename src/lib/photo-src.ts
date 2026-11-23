import { withBasePath } from "@/lib/base-path";

/**
 * Gallery files are already ~1600px-long-edge WebPs. Static export has no
 * `/_next/image` optimizer, so the browser loads that file directly.
 */
export function optimizedPhotoSrc(src: string): string {
  return withBasePath(src);
}
