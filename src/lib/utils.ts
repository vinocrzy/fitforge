/**
 * Merge class names — filters falsy values and joins with a space.
 * Drop-in for clsx for conditional Tailwind class merging.
 */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
