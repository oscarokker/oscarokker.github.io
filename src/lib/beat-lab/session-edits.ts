import type { CompositionId } from "@/lib/beat-lab/compositions";
import type { SectionId } from "@/lib/beat-lab/sections";
import { sectionEditKey } from "@/lib/beat-lab/sections";

const STORAGE_KEY = "beat-lab-section-edits-v1";

export type SectionEditMap = Record<string, string>;

function readStorage(): SectionEditMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as SectionEditMap;
    return parsed && typeof parsed === "object" ? parsed : {};
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
