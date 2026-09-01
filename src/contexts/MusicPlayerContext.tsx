"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export interface MusicTrack {
  youtubeId: string;
  startSeconds?: number;
  title: string;
  subtitle: string;
  description: string;
  videoTitle?: string;
  videoArtist?: string;
  accent?: string;
  coverSrc?: string;
}

export interface MusicSourceRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

type PlayerState = "hidden" | "expanded" | "mini";

interface MusicPlayerContextValue {
  currentTrack: MusicTrack | null;
  playerState: PlayerState;
  sourceRect: MusicSourceRect | null;
  playTrack: (track: MusicTrack, sourceRect: MusicSourceRect) => void;
  dockToMini: () => void;
  expandPlayer: () => void;
  stopPlayer: () => void;
  setSourceRect: (rect: MusicSourceRect | null) => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextValue | null>(null);

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState>("hidden");
  const [sourceRect, setSourceRect] = useState<MusicSourceRect | null>(null);

  const playTrack = useCallback((track: MusicTrack, rect: MusicSourceRect) => {
    setCurrentTrack(track);
    setSourceRect(rect);
    setPlayerState("expanded");
  }, []);

  const dockToMini = useCallback(() => {
    setPlayerState("mini");
  }, []);

  const expandPlayer = useCallback(() => {
    setPlayerState("expanded");
  }, []);

  const stopPlayer = useCallback(() => {
    setPlayerState("hidden");
    // Clear immediately to prevent race with next playTrack
    setCurrentTrack(null);
    setSourceRect(null);
  }, []);

  return (
    <MusicPlayerContext.Provider
      value={{
        currentTrack,
        playerState,
        sourceRect,
        playTrack,
        dockToMini,
        expandPlayer,
        stopPlayer,
        setSourceRect,
      }}
    >
      {children}
    </MusicPlayerContext.Provider>
  );
}

export function useMusicPlayer() {
  const context = useContext(MusicPlayerContext);
  if (!context) {
    throw new Error("useMusicPlayer must be used within MusicPlayerProvider");
  }
  return context;
}
