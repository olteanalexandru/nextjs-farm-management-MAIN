// Letters (incl. accented/diacritic), digits, spaces and a few punctuation marks
// commonly found in crop names/varieties (e.g. "Jerusalem artichoke", "Pak-choi").
const CROP_NAME_PATTERN = /^[\p{L}\p{M}0-9\s'’.\-()]{2,60}$/u;

export function sanitizeCropNameQuery(raw: string): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim().replace(/\s+/g, ' ');
  if (!CROP_NAME_PATTERN.test(trimmed)) return null;
  return trimmed;
}
