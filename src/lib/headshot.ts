/** 320w only — the master PNG is 320px; a 480w upsample reads softer. */
export const HEADSHOT_AVIF_SRCSET = [
  { src: "/oscar-rode-profile-picture-320.avif", width: 320 },
] as const;

export const HEADSHOT_WEBP_SRCSET = [
  { src: "/oscar-rode-profile-picture-320.webp", width: 320 },
] as const;

/** Collapsed intro tile: 10rem (160px) desktop, ~69–72px on mobile. */
export const HEADSHOT_TILE_SIZES = "(max-width: 767px) 72px, 160px";

/** Expanded intro avatar is 8rem (128px). */
export const HEADSHOT_EXPANDED_SIZES = "128px";
