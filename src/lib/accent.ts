type AccentColor =
  | "coral"
  | "blue"
  | "violet"
  | "indigo"
  | "teal"
  | "amber"
  | "rose"
  | "green"
  | "orange"
  | "sky";

export function accentClass(accent?: string): string {
  const valid: AccentColor[] = [
    "coral",
    "blue",
    "violet",
    "indigo",
    "teal",
    "amber",
    "rose",
    "green",
    "orange",
    "sky",
  ];
  if (accent && valid.includes(accent as AccentColor)) {
    return `tile-accent-${accent}`;
  }
  return "tile-accent-teal";
}
