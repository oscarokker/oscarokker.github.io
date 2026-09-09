"use client";

import Image from "next/image";
import { withBasePath } from "@/lib/base-path";

const PLACEHOLDER_PREFIX = "placeholder:";

export function getPlaceholderTone(src: string): string | null {
  if (!src) return "1";
  if (src.startsWith(PLACEHOLDER_PREFIX)) {
    return src.slice(PLACEHOLDER_PREFIX.length) || "1";
  }
  return null;
}

interface PhotoMediaProps {
  src: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
}

export function PhotoMedia({
  src,
  alt,
  sizes = "100vw",
  priority = false,
}: PhotoMediaProps) {
  const tone = getPlaceholderTone(src);

  if (tone) {
    return (
      <div
        className={`photo-media-placeholder photo-media-placeholder--${tone}`}
        role="img"
        aria-label={alt}
      />
    );
  }

  return (
    <Image
      src={withBasePath(src)}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className="photo-stack-image"
    />
  );
}

interface PhotoStackPreviewProps {
  images: string[];
}

export function PhotoStackPreview({
  images,
}: PhotoStackPreviewProps) {
  const frames = images.slice(0, 3);

  return (
    <div className="photo-stack-frames" aria-hidden>
      {frames.map((src, index) => (
        <div key={`${src}-${index}`} className="photo-stack-frame">
          <PhotoMedia
            src={src}
            alt=""
            sizes="(max-width: 768px) 45vw, 220px"
          />
        </div>
      ))}
    </div>
  );
}
