"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { withBasePath } from "@/lib/base-path";

const POSTER_SRC = "/ghostlink/neotrance-poster.jpg";
const WEBM_SRC = "/ghostlink/neotrance-bg.webm";
const MP4_SRC = "/ghostlink/neotrance-bg.mp4";

/**
 * First and last frames of the clip don't match. Fade the video out onto the
 * poster (frame 0) across this window, then fade back in after the native
 * loop wraps. One decoder — the poster stands in for the incoming frame.
 */
const LOOP_SEAM_S = 0.65;

interface BeatLabNeoTranceVideoProps {
  /** Expanded shell is open. False while it is closing. */
  active: boolean;
}

function smoothstep(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

function subscribeReducedMotion(onStoreChange: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

function reducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function reducedMotionServer() {
  return false;
}

let pageForceHidden = false;

function subscribePageVisible(onStoreChange: () => void) {
  const onVisibility = () => {
    if (document.visibilityState !== "hidden") pageForceHidden = false;
    onStoreChange();
  };
  const onPageHide = () => {
    pageForceHidden = true;
    onStoreChange();
  };
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pagehide", onPageHide);
  window.addEventListener("pageshow", onVisibility);
  return () => {
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("pagehide", onPageHide);
    window.removeEventListener("pageshow", onVisibility);
  };
}

function pageVisibleSnapshot() {
  return document.visibilityState !== "hidden" && !pageForceHidden;
}

function pageVisibleServer() {
  return true;
}

export function BeatLabNeoTranceVideo({ active }: BeatLabNeoTranceVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const revealedRef = useRef(false);
  const reduced = useSyncExternalStore(
    subscribeReducedMotion,
    reducedMotionSnapshot,
    reducedMotionServer,
  );
  const pageVisible = useSyncExternalStore(
    subscribePageVisible,
    pageVisibleSnapshot,
    pageVisibleServer,
  );
  const [armSources, setArmSources] = useState(false);
  const [readyToken, setReadyToken] = useState(0);

  const posterUrl = withBasePath(POSTER_SRC);
  const showVideo = !reduced && armSources;

  const [trackedShow, setTrackedShow] = useState(showVideo);
  if (showVideo !== trackedShow) {
    setTrackedShow(showVideo);
    if (!showVideo) setReadyToken(0);
  }

  const videoReady = showVideo && readyToken > 0;

  useEffect(() => {
    if (showVideo) return;
    revealedRef.current = false;
  }, [showVideo]);

  useEffect(() => {
    if (reduced || !active || armSources) return;
    let cancelled = false;
    const arm = () => {
      if (!cancelled) setArmSources(true);
    };

    let idleId = 0;
    let timerId = 0;
    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(arm, { timeout: 1600 });
    } else {
      timerId = window.setTimeout(arm, 400);
    }

    return () => {
      cancelled = true;
      if (idleId) window.cancelIdleCallback(idleId);
      if (timerId) window.clearTimeout(timerId);
    };
  }, [reduced, active, armSources]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !showVideo) return;

    let cancelled = false;
    let settled = false;
    let fallbackTimer = 0;
    const settle = () => {
      if (cancelled || settled) return;
      settled = true;
      window.clearTimeout(fallbackTimer);
      setReadyToken((token) => token + 1);
    };
    const armFallback = () => {
      if (settled || fallbackTimer) return;
      fallbackTimer = window.setTimeout(settle, 800);
    };

    video.muted = true;
    video.addEventListener("canplaythrough", settle);
    video.addEventListener("canplay", armFallback);
    video.addEventListener("loadeddata", armFallback);

    if (video.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
      queueMicrotask(settle);
    } else if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      armFallback();
    }

    return () => {
      cancelled = true;
      window.clearTimeout(fallbackTimer);
      video.removeEventListener("canplaythrough", settle);
      video.removeEventListener("canplay", armFallback);
      video.removeEventListener("loadeddata", armFallback);
      video.pause();
    };
  }, [showVideo]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoReady || reduced) return;

    const shouldPlay = active && pageVisible;
    if (!shouldPlay) {
      video.pause();
      return;
    }

    let cancelled = false;

    if (!revealedRef.current) {
      revealedRef.current = true;
      video.style.opacity = "0";
      const frame = window.requestAnimationFrame(() => {
        if (cancelled) return;
        video.style.transition = "opacity 360ms ease";
        video.style.opacity = "1";
      });
      const clearTransition = () => {
        video.style.transition = "";
        video.removeEventListener("transitionend", clearTransition);
      };
      video.addEventListener("transitionend", clearTransition);
      void video.play().then(
        () => {
          if (cancelled) video.pause();
        },
        () => {
          if (cancelled) return;
          window.cancelAnimationFrame(frame);
          video.style.opacity = "0";
          revealedRef.current = false;
        },
      );
      return () => {
        cancelled = true;
        window.cancelAnimationFrame(frame);
        video.removeEventListener("transitionend", clearTransition);
      };
    }

    if (
      Number.isFinite(video.duration) &&
      video.currentTime < video.duration - LOOP_SEAM_S
    ) {
      video.style.transition = "";
      video.style.opacity = "1";
    }
    void video.play().then(
      () => {
        if (cancelled) video.pause();
      },
      () => {
        if (cancelled) return;
        video.style.opacity = "0";
      },
    );
    return () => {
      cancelled = true;
    };
  }, [videoReady, active, pageVisible, reduced]);

  useEffect(() => {
    if (!videoReady || !active || !pageVisible || reduced) return;
    const video = videoRef.current;
    if (!video) return;

    let raf = 0;
    let fading = false;

    const tick = () => {
      raf = window.requestAnimationFrame(tick);
      if (video.paused || !Number.isFinite(video.duration) || video.duration <= 0) {
        return;
      }
      const remaining = video.duration - video.currentTime;
      const inSeam = remaining < LOOP_SEAM_S && video.currentTime > 1;
      if (inSeam) {
        fading = true;
        video.style.transition = "none";
        video.style.opacity = String(smoothstep(remaining / LOOP_SEAM_S));
        return;
      }
      if (fading) {
        fading = false;
        video.style.transition = "opacity 220ms linear";
        video.style.opacity = "1";
      }
    };

    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [videoReady, active, pageVisible, reduced]);

  const mode = reduced ? "reduced" : videoReady && active ? "video" : "poster";

  return (
    <div
      className="beat-lab-world-bg beat-lab-neotrance-video"
      aria-hidden
      data-world-bg="neo-trance"
      data-neotrance-bg={mode}
    >
      <div
        className="beat-lab-neotrance-poster"
        style={{ backgroundImage: `url("${posterUrl}")` }}
      />
      {showVideo ? (
        <video
          ref={videoRef}
          className="beat-lab-neotrance-media"
          muted
          playsInline
          loop
          preload="auto"
          controls={false}
          disablePictureInPicture
          poster={posterUrl}
        >
          <source src={withBasePath(WEBM_SRC)} type="video/webm" />
          <source src={withBasePath(MP4_SRC)} type="video/mp4" />
        </video>
      ) : null}
      <div className="beat-lab-neotrance-scrim" />
    </div>
  );
}
