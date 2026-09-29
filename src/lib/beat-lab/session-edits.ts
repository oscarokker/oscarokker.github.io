import type { CompositionId } from "@/lib/beat-lab/compositions";
import type { SectionId } from "@/lib/beat-lab/sections";
import { sectionEditKey } from "@/lib/beat-lab/sections";

const STORAGE_KEY = "beat-lab-section-edits-v2";
const LEGACY_STORAGE_KEY = "beat-lab-section-edits-v1";

/** Best-effort migration from six-tab ids → four worlds. */
function migrateLegacyEdits(legacy: SectionEditMap): SectionEditMap {
  const tranceSectionMap: Partial<Record<string, SectionId>> = {
    intro: "intro",
    groove: "build-up",
    build: "chorus-1",
    drop: "chorus-2",
    outro: "outro",
  };
  const next: SectionEditMap = {};
  for (const [key, value] of Object.entries(legacy)) {
    if (key.startsWith("trance:")) {
      const legacySection = key.slice("trance:".length);
      const mapped = tranceSectionMap[legacySection];
      if (mapped) next[`neo-trance:${mapped}`] = value;
      continue;
    }
    if (
      key.startsWith("house:") ||
      key.startsWith("rock:") ||
      key.startsWith("firecracker:") ||
      key.startsWith("sixteen:") ||
      key.startsWith("weird:")
    ) {
      continue;
    }
    next[key] = value;
  }
  return next;
}

export type SectionEditMap = Record<string, string>;

function readStorage(): SectionEditMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SectionEditMap;
      return parsed && typeof parsed === "object" ? parsed : {};
    }
    const legacyRaw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!legacyRaw) return {};
    const legacy = JSON.parse(legacyRaw) as SectionEditMap;
    const migrated =
      legacy && typeof legacy === "object" ? migrateLegacyEdits(legacy) : {};
    if (Object.keys(migrated).length > 0) {
      writeStorage(migrated);
    }
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    return migrated;
  } catch {
    return {};
  }
}

function writeStorage(map: SectionEditMap): void {
  if (typeof window === "undefined") return;
  try {
    if (Object.keys(map).length === 0) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    }
  } catch {
    /* quota / private mode */
  }
}

export function loadPersistedSectionEdits(): SectionEditMap {
  return readStorage();
}

export function persistSectionEdits(map: SectionEditMap): void {
  writeStorage(map);
}

export function effectiveSectionSource(
  compositionId: CompositionId,
  sectionId: SectionId,
  defaults: (id: CompositionId, sid: SectionId) => string,
  edits: SectionEditMap,
): string {
  const key = sectionEditKey(compositionId, sectionId);
  return edits[key] ?? defaults(compositionId, sectionId);
}

export function commitSectionEdit(
  edits: SectionEditMap,
  compositionId: CompositionId,
  sectionId: SectionId,
  source: string,
  persist = true,
): SectionEditMap {
  const key = sectionEditKey(compositionId, sectionId);
  const next = { ...edits, [key]: source };
  if (persist) persistSectionEdits(next);
  return next;
}

export function clearSectionEdit(
  edits: SectionEditMap,
  compositionId: CompositionId,
  sectionId: SectionId,
  persist = true,
): SectionEditMap {
  const key = sectionEditKey(compositionId, sectionId);
  if (!(key in edits)) return edits;
  const next = { ...edits };
  delete next[key];
  if (persist) persistSectionEdits(next);
  return next;
}

export function clearTrackEdits(
  edits: SectionEditMap,
  compositionId: CompositionId,
  persist = true,
): SectionEditMap {
  const prefix = `${compositionId}:`;
  const next: SectionEditMap = {};
  for (const [k, v] of Object.entries(edits)) {
    if (!k.startsWith(prefix)) next[k] = v;
  }
  if (persist) persistSectionEdits(next);
  return next;
}
