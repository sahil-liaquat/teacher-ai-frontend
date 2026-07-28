/**
 * The shape of a worksheet field that may carry two languages.
 *
 * A plain `string` is the single-language case, which is why every worksheet
 * already in the database satisfies this type — no migration, no backfill.
 * The paired form is produced only by the backend's composition code, never by
 * Gemini.
 *
 * Deliberately dependency-free so `worksheet-localization.ts` can import it
 * without creating a cycle.
 */
export type LocalizedPair = { primary: string; secondary: string };
export type LocalizedText = string | LocalizedPair;

export const PAIRING_SEPARATOR = " + ";

export function isPaired(value: unknown): value is LocalizedPair {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as LocalizedPair).primary === "string" &&
    typeof (value as LocalizedPair).secondary === "string"
  );
}

/** Both languages, primary first — for copy, share and plain-text export. */
export function plainText(value: unknown): string {
  if (isPaired(value)) return `${value.primary}\n${value.secondary}`;
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}

/** Just the primary line — for headings and filenames. */
export function primaryText(value: unknown): string {
  if (isPaired(value)) return value.primary;
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}

export function pairingName(primary: string, secondary: string): string {
  return `${primary}${PAIRING_SEPARATOR}${secondary}`;
}

const KNOWN = ["English", "Hindi", "Urdu"];

export function parsePairing(value: unknown): LocalizedPair | null {
  const raw = String(value ?? "");
  if (!raw.includes("+")) return null;
  const [left, ...rest] = raw.split("+");
  const title = (part: string) => {
    const trimmed = part.trim();
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  };
  const primary = title(left);
  const secondary = title(rest.join("+"));
  if (!KNOWN.includes(primary) || !KNOWN.includes(secondary)) return null;
  if (primary === secondary) return null;
  return { primary, secondary };
}
