/**
 * Capitalizes the first letter of each word in a string, preserving normal spacing.
 * E.g., "akash pawar" -> "Akash Pawar"
 * Does not force changes on email addresses or non-string inputs.
 */
export function capitalizeWords(input?: string): string {
  if (!input) return '';
  return input
    .trim()
    .split(/\s+/)
    .map(word => {
      if (!word) return '';
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}
