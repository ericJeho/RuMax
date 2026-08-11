/**
 * Minimal class-name joiner. Deliberately not `clsx` + `tailwind-merge`: the component
 * library below never emits conflicting utilities for the same property, so the extra
 * dependency and its runtime cost would buy nothing.
 */
export type ClassValue = string | number | null | undefined | false | ClassValue[];

export function cn(...values: ClassValue[]): string {
  const out: string[] = [];
  for (const value of values) {
    if (!value && value !== 0) continue;
    if (Array.isArray(value)) {
      const nested = cn(...value);
      if (nested) out.push(nested);
    } else {
      out.push(String(value));
    }
  }
  return out.join(' ');
}
