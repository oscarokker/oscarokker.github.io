/** Full PNG for JSON-LD, Open Graph, and the picture fallback. */
export const HEADSHOT_PNG = "/oscar-rode-profile-picture.png";

/** 320w and 480w so 160 CSS px is 1:1 at DSF 2 and 3 (expanded 128 px is covered). */
export const HEADSHOT_AVIF_SRCSET = [
  { src: "/oscar-rode-profile-picture-320.avif", width: 320 },
  { src: "/oscar-rode-profile-picture-480.avif", width: 480 },
] as const;

export const HEADSHOT_WEBP_SRCSET = [
  { src: "/oscar-rode-profile-picture-320.webp", width: 320 },
  { src: "/oscar-rode-profile-picture-480.webp", width: 480 },
] as const;

/** Collapsed intro tile: 10rem (160px) desktop, max 120px on mobile. */
export const HEADSHOT_TILE_SIZES = "(max-width: 767px) 120px, 160px";

/** Expanded intro avatar is 8rem (128px). */
export const HEADSHOT_EXPANDED_SIZES = "128px";
