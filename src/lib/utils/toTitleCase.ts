// ═══════════════════════════════════════════════════════════════════
// Title Case utility — "air bike" → "Air Bike"
// Keeps small words lowercase when not first/last (a, an, the, etc.)
// ═══════════════════════════════════════════════════════════════════

const SMALL_WORDS = new Set([
  'a', 'an', 'the', 'and', 'but', 'or', 'nor', 'for', 'yet', 'so',
  'in', 'on', 'at', 'to', 'of', 'by', 'up', 'as', 'is', 'if',
  'it', 'vs', 'via', 'with',
]);

export function toTitleCase(str: string): string {
  if (!str) return str;

  return str
    .split(' ')
    .map((word, i, arr) => {
      // Always capitalize first and last word
      if (i === 0 || i === arr.length - 1) {
        return capitalize(word);
      }
      // Keep small words lowercase
      if (SMALL_WORDS.has(word.toLowerCase())) {
        return word.toLowerCase();
      }
      return capitalize(word);
    })
    .join(' ');
}

function capitalize(word: string): string {
  if (!word) return word;
  // Handle parenthesized words: "(kneeling)" → "(Kneeling)"
  if (word.startsWith('(') && word.length > 1) {
    return '(' + word.charAt(1).toUpperCase() + word.slice(2);
  }
  return word.charAt(0).toUpperCase() + word.slice(1);
}
