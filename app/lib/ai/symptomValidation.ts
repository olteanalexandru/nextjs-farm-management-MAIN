// Letters (incl. accented/diacritic), digits, whitespace and common punctuation found in
// free-text descriptions of plant symptoms. Rejects code-like characters to reduce
// prompt-injection and payload-flooding surface for this free-text AI feature.
const SYMPTOM_PATTERN = /^[\p{L}\p{M}0-9\s.,;:'"!?()%/\-]{10,800}$/u;

export function sanitizeSymptomDescription(raw: string): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim().replace(/\s+/g, ' ');
  if (!SYMPTOM_PATTERN.test(trimmed)) return null;
  return trimmed;
}
