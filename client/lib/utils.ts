import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge class names with Tailwind CSS utility classes
 * @param inputs - Array of class values (strings, objects, arrays)
 * @returns Single merged class string with deduplication
 * @example
 * ```ts
 * cn("px-4", "py-2", { "font-bold": true }, ["text-red-500", "rounded"])
 * // Returns: "px-4 py-2 font-bold text-red-500 rounded"
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
