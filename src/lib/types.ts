export type TileCategory = "work" | "music" | "side-quests" | "about";

export type FilterCategory = "all" | TileCategory;

export type TileSize = "1x1" | "2x1" | "1x2" | "2x2";

export type TileVariant =
  | "intro"
  | "case-study"
  | "quote"
  | "social"
  | "music"
  | "cv"
  | "duolingo"
  | "logo"
  | "photo-stack";

interface BaseTileData {
  id: string;
  categories: TileCategory[];
  size: TileSize;
}

export interface IntroTileData extends BaseTileData {
  variant: "intro";
  props: {
    name: string;
    bio: string;
    paragraphs: string[];
    imageSrc?: string;
  };
}

export interface CaseStudyTileData extends BaseTileData {
  variant: "case-study";
  props: {
    title: string;
    subtitle: string;
    slug: string;
    accent?: string;
    coverSrc?: string;
    comingSoon?: boolean;
  };
}

export interface QuoteTileData extends BaseTileData {
  variant: "quote";
  props: {
    text: string;
    subtitle?: string;
    showQuoteIcon?: boolean;
    cursorLabel?: string;
  };
}

export interface SocialTileData extends BaseTileData {
  variant: "social";
  props: {
    label: string;
    href?: string;
    copyValue?: string;
    icon?: string;
    accent?: string;
  };
}

export interface MusicTileData extends BaseTileData {
  variant: "music";
  props: {
    title: string;
    subtitle: string;
    description: string;
    accent?: string;
    coverSrc?: string;
    youtubeId?: string;
    startSeconds?: number;
    videoTitle?: string;
    videoArtist?: string;
  };
}

export interface CvTileData extends BaseTileData {
  variant: "cv";
  props: {
    logoSrc: string;
    fileSrc: string;
    downloadFileName: string;
    accent?: string;
  };
}

export interface DuolingoTileData extends BaseTileData {
  variant: "duolingo";
  props: {
    username: string;
    userId: number;
    accent?: string;
  };
}

export interface LogoTileData extends BaseTileData {
  variant: "logo";
  props: {
    imageSrc: string;
    alt: string;
    label?: string;
    href?: string;
    openInNewTab?: boolean;
    accent?: string;
  };
}

export interface PhotoStackTileData extends BaseTileData {
  variant: "photo-stack";
  props: {
    title: string;
    /** Preview shots for the collapsed stack (first 3). */
    images: string[];
    /** Route that lists the rest of the gallery from disk. */
    listingUrl?: string;
    accent?: string;
  };
}

export type TileData =
  | IntroTileData
  | CaseStudyTileData
  | QuoteTileData
  | SocialTileData
  | MusicTileData
  | CvTileData
  | DuolingoTileData
  | LogoTileData
  | PhotoStackTileData;
