export const RESET_PHRASES = [
  'fresh marigold bloom',
  'new wedding dawn',
  'silver diya glow',
  'saffron silk ribbon',
  'golden mandap arch',
  'jasmine garland knot',
  'copper kalash shine',
  'ivory lotus petal',
  'sacred fire spark',
  'crimson bridal veil',
  'velvet dhol beat',
  'rosewood thali set',
  'amber henna stain',
  'clean ledger slate',
] as const;

/**
 * Picks a random confirmation phrase from RESET_PHRASES, avoiding an
 * immediate repeat when previousPhrase is provided.
 */
export function pickRandomResetPhrase(previousPhrase?: string): string {
  const candidates =
    previousPhrase && RESET_PHRASES.length > 1
      ? RESET_PHRASES.filter((phrase) => phrase !== previousPhrase)
      : RESET_PHRASES;
  const index = Math.floor(Math.random() * candidates.length);
  return candidates[index] ?? RESET_PHRASES[0];
}

/**
 * Checks whether the user-entered confirmation matches the displayed phrase,
 * ignoring leading/trailing whitespace and letter case for mobile keyboards.
 */
export function matchesResetPhrase(input: string, target: string): boolean {
  const normalizedTarget = target.trim().toLowerCase();
  if (!normalizedTarget) return false;
  return input.trim().toLowerCase() === normalizedTarget;
}
