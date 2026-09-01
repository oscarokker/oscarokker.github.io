"use client";

import Image from "next/image";
import {
  useCallback,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { IntroTileExpanded } from "@/components/tiles/IntroTileExpanded";
import { PhotoStackPreview } from "@/components/tiles/PhotoMedia";
import { PhotoStackTileExpanded } from "@/components/tiles/PhotoStackTileExpanded";
import { useCursorLabelOptional } from "@/hooks/useCursorLabel";
import { useTileExpand } from "@/hooks/useTileExpand";
import { accentClass } from "@/lib/accent";
import { withBasePath } from "@/lib/base-path";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import {
  CopyIcon,
  DownloadIcon,
  ExpandIcon,
  ExternalLinkIcon,
} from "@/components/ChromeIcons";

interface IntroTileProps {
  name: string;
  bio: string;
  paragraphs: string[];
  imageSrc?: string;
}

function TileChromeHint({ children }: { children: ReactNode }) {
  return (
    <span
      className="intro-chrome-icon-btn intro-tile-expand"
      aria-hidden="true"
    >
      {children}
    </span>
  );
}

export function IntroTile({
  name,
  bio,
  paragraphs,
  imageSrc,
}: IntroTileProps) {
  const {
    tileRef,
    mounted,
    visible,
    sourceRect,
    openingPointer,
    measureSourceRect,
    open,
    close,
    handleMorphReady,
    handleExitComplete,
    handleKeyDown,
  } = useTileExpand({ capturePointer: true });

  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <div
        ref={tileRef}
        className={`tile-card-inner intro-tile intro-tile--expandable ${accentClass()}`}
        role="button"
        tabIndex={mounted ? -1 : 0}
        aria-expanded={mounted}
        aria-haspopup="dialog"
        aria-label={`About ${name}. Activate to read more.`}
        onClick={mounted ? undefined : open}
        onKeyDown={mounted ? undefined : handleKeyDown}
      >
        <TileChromeHint>
          <ExpandIcon />
        </TileChromeHint>

        <div className="intro-tile-avatar" aria-hidden={!imageSrc}>
          {imageSrc ? (
            <Image
              src={withBasePath(imageSrc)}
              alt=""
              fill
              sizes="192px"
              className="intro-tile-avatar-image"
              priority
            />
          ) : (
            <span className="intro-tile-avatar-placeholder">{initials}</span>
          )}
        </div>

        <div className="intro-tile-content">
          <div>
            <h1 className="text-display text-[var(--color-text-primary)] m-0 mb-2">
              {name}
            </h1>
            <p className="text-body text-[var(--color-text-secondary)] m-0">
              {bio}
            </p>
          </div>
        </div>
      </div>

      {mounted && sourceRect && (
        <IntroTileExpanded
          name={name}
          bio={bio}
          paragraphs={paragraphs}
          imageSrc={imageSrc}
          visible={visible}
          sourceRect={sourceRect}
          getSourceRect={measureSourceRect}
          openingPointer={openingPointer}
          onClose={close}
          onExitComplete={handleExitComplete}
          onMorphReady={handleMorphReady}
        />
      )}
    </>
  );
}

interface QuoteTileProps {
  text: string;
  subtitle?: string;
  showQuoteIcon?: boolean;
}

export function QuoteTile({ text, subtitle, showQuoteIcon }: QuoteTileProps) {
  return (
    <div
      className={`tile-card-inner items-center justify-center text-center gap-2.5 ${accentClass()}`}
    >
      {showQuoteIcon ? (
        <Image
          src={withBasePath("/quote-symbol.svg")}
          alt=""
          width={24}
          height={24}
          className="shrink-0"
          style={{ opacity: 0.4 }}
          aria-hidden
          unoptimized
        />
      ) : null}
      <blockquote
        className="text-h2 text-[var(--color-text-primary)] m-0 italic"
      >
        &ldquo;{text}&rdquo;
      </blockquote>
      {subtitle ? (
        <p className="text-label text-[var(--color-text-secondary)] m-0">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

interface SocialTileProps {
  label: string;
  href?: string;
  copyValue?: string;
  icon?: string;
  accent?: string;
}

export function SocialTile({
  label,
  href,
  copyValue,
  icon,
  accent,
}: SocialTileProps) {
  const [copied, setCopied] = useState(false);
  const cursor = useCursorLabelOptional();
  const setCursorLabel = cursor?.setCursorLabel;
  const tileRef = useRef<HTMLButtonElement | HTMLAnchorElement | null>(null);

  const handleCopy = useCallback(
    async () => {
      if (!copyValue) return;

      const markCopied = () => {
        setCopied(true);
        setCursorLabel?.({
          text: "Copied!",
          accent,
          icon: "copy",
        });
        window.setTimeout(() => {
          setCopied(false);
          if (!tileRef.current?.matches(":hover")) return;
          setCursorLabel?.({
            text: "Click to copy my email address",
            accent,
            icon: "email",
          });
        }, 1600);
      };

      try {
        await navigator.clipboard.writeText(copyValue);
        markCopied();
      } catch {
        // Fallback for older browsers / denied clipboard permission
        const textarea = document.createElement("textarea");
        textarea.value = copyValue;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        markCopied();
      }
    },
    [copyValue, accent, setCursorLabel],
  );

  const content = (
    <>
      {icon ? (
        <Image
          src={withBasePath(icon)}
          alt=""
          width={64}
          height={64}
          className="social-tile-icon"
          aria-hidden
        />
      ) : (
        <span
          className="text-h1 m-0"
          style={{ color: "var(--tile-accent)" }}
        >
          {label === "LinkedIn" ? "in" : label[0]}
        </span>
      )}
      {!icon && (
        <span className="text-caption text-[var(--color-text-tertiary)] mt-2">
          {label}
        </span>
      )}
    </>
  );

  const className = `tile-card-inner social-tile-hit relative items-center justify-center no-underline h-full ${accentClass(accent)} hover:opacity-90 transition-opacity`;

  if (copyValue) {
    return (
      <button
        ref={(node) => {
          tileRef.current = node;
        }}
        type="button"
        onClick={handleCopy}
        className={`${className} social-tile-button${copied ? " social-tile-button--copied" : ""}`}
        aria-label={
          copied
            ? `${label} copied to clipboard`
            : `Copy ${label} address to clipboard`
        }
      >
        <TileChromeHint>
          <CopyIcon />
        </TileChromeHint>
        {content}
      </button>
    );
  }

  if (!href) return null;

  const opensExternally = href.startsWith("http");

  return (
    <a
      ref={(node) => {
        tileRef.current = node;
      }}
      href={href}
      target={opensExternally ? "_blank" : undefined}
      rel={opensExternally ? "noopener noreferrer" : undefined}
      className={className}
      aria-label={label}
    >
      {opensExternally ? (
        <TileChromeHint>
          <ExternalLinkIcon />
        </TileChromeHint>
      ) : null}
      {content}
    </a>
  );
}

interface MusicTileProps {
  title: string;
  subtitle: string;
  description: string;
  accent?: string;
  coverSrc?: string;
  youtubeId?: string;
  videoTitle?: string;
  videoArtist?: string;
}

function MusicTileFace({
  title,
  subtitle,
  description,
  coverSrc,
}: Pick<MusicTileProps, "title" | "subtitle" | "description" | "coverSrc">) {
  if (coverSrc) {
    return (
      <div
        className="music-tile-cover-wrap"
        aria-hidden
        style={{ backgroundImage: `url("${withBasePath(coverSrc)}")` }}
      />
    );
  }

  return (
    <>
      <div
        className="music-tile-orb"
        style={{ backgroundColor: "var(--tile-accent)" }}
      />
      <span
        className="text-label mb-3 relative z-[2]"
        style={{ color: "var(--tile-accent)" }}
      >
        {subtitle}
      </span>
      <h2 className="text-h2 m-0 mb-2 relative z-[2] text-[var(--color-text-primary)]">
        {title}
      </h2>
      <p className="text-body-sm m-0 relative z-[2] text-[var(--color-text-secondary)]">
        {description}
      </p>
    </>
  );
}

export function MusicTile({
  title,
  subtitle,
  description,
  accent,
  coverSrc,
  youtubeId,
  videoTitle,
  videoArtist,
}: MusicTileProps) {
  const expandable = Boolean(youtubeId);
  const tileRef = useRef<HTMLDivElement>(null);
  const { playTrack } = useMusicPlayer();
  const playLabel = videoTitle ?? title;
  const coverClass = coverSrc ? "music-tile--cover" : "";

  const handleClick = useCallback(() => {
    if (!expandable || !youtubeId) return;

    const rect = tileRef.current?.getBoundingClientRect();
    if (!rect) return;

    playTrack(
      {
        youtubeId,
        title,
        subtitle,
        description,
        videoTitle,
        videoArtist,
        accent,
        coverSrc,
      },
      {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      },
    );
  }, [
    expandable,
    youtubeId,
    title,
    subtitle,
    description,
    videoTitle,
    videoArtist,
    accent,
    coverSrc,
    playTrack,
  ]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleClick();
      }
    },
    [handleClick],
  );

  if (!expandable) {
    return (
      <div
        className={`tile-card-inner music-tile ${coverClass} ${accentClass(accent)} h-full`}
      >
        <MusicTileFace
          title={title}
          subtitle={subtitle}
          description={description}
          coverSrc={coverSrc}
        />
      </div>
    );
  }

  return (
    <div
      ref={tileRef}
      className={`tile-card-inner music-tile music-tile--expandable ${coverClass} ${accentClass(accent)} h-full`}
      role="button"
      tabIndex={0}
      aria-haspopup="dialog"
      aria-label={`${title}. Activate to play ${playLabel}.`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <TileChromeHint>
        <ExpandIcon />
      </TileChromeHint>
      <MusicTileFace
        title={title}
        subtitle={subtitle}
        description={description}
        coverSrc={coverSrc}
      />
    </div>
  );
}

interface LogoTileProps {
  imageSrc: string;
  alt: string;
  label?: string;
  href?: string;
  openInNewTab?: boolean;
  accent?: string;
}

export function LogoTile({
  imageSrc,
  alt,
  label,
  href,
  openInNewTab,
  accent,
}: LogoTileProps) {
  const content = (
    <Image
      src={withBasePath(imageSrc)}
      alt={alt}
      width={512}
      height={128}
      className="logo-tile-image"
      sizes="(max-width: 768px) 100vw, 420px"
      priority={false}
    />
  );

  const className = `tile-card-inner logo-tile ${accentClass(accent)} h-full`;

  if (href) {
    const external =
      openInNewTab ??
      (href.startsWith("http://") || href.startsWith("https://"));

    return (
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className={`${className} no-underline`}
        aria-label={label ?? alt}
      >
        {external ? (
          <TileChromeHint>
            <ExternalLinkIcon />
          </TileChromeHint>
        ) : null}
        {content}
      </a>
    );
  }

  return <div className={className}>{content}</div>;
}

interface PhotoStackTileProps {
  title: string;
  images: string[];
  listingUrl?: string;
  accent?: string;
}

export function PhotoStackTile({
  title,
  images,
  listingUrl,
  accent,
}: PhotoStackTileProps) {
  const {
    tileRef,
    mounted,
    visible,
    sourceRect,
    measureSourceRect,
    open,
    close,
    handleMorphReady,
    handleExitComplete,
    handleKeyDown,
  } = useTileExpand();

  return (
    <>
      <div
        ref={tileRef}
        className={`tile-card-inner photo-stack-tile photo-stack-tile--expandable ${accentClass(accent)} h-full`}
        role="button"
        tabIndex={mounted ? -1 : 0}
        aria-expanded={mounted}
        aria-haspopup="dialog"
        aria-label={`${title}. Activate to view photographs.`}
        onClick={mounted ? undefined : open}
        onKeyDown={mounted ? undefined : handleKeyDown}
      >
        <TileChromeHint>
          <ExpandIcon />
        </TileChromeHint>
        <PhotoStackPreview title={title} images={images} />
      </div>

      {mounted && sourceRect && (
        <PhotoStackTileExpanded
          title={title}
          images={images}
          listingUrl={listingUrl}
          visible={visible}
          sourceRect={sourceRect}
          getSourceRect={measureSourceRect}
          onClose={close}
          onExitComplete={handleExitComplete}
          onMorphReady={handleMorphReady}
        />
      )}
    </>
  );
}

interface CvTileProps {
  logoSrc: string;
  fileSrc: string;
  downloadFileName: string;
  accent?: string;
}

export function CvTile({
  logoSrc,
  fileSrc,
  downloadFileName,
  accent,
}: CvTileProps) {
  return (
    <a
      href={withBasePath(fileSrc)}
      download={downloadFileName}
      className={`tile-card-inner cv-tile no-underline h-full ${accentClass(accent)}`}
      aria-label="Download CV"
    >
      <TileChromeHint>
        <DownloadIcon />
      </TileChromeHint>
      <Image
        src={withBasePath(logoSrc)}
        alt=""
        width={64}
        height={64}
        className="cv-tile-logo"
        aria-hidden
        unoptimized
      />
    </a>
  );
}
