/**
 * Shared navigation style constants for consistent navigation design.
 * Implements the "Borderless Color Shift" design pattern.
 */

export const navFocusRingClasses =
  "focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export const navTransitionClasses = "transition-colors";

export const navTypographyClasses = "text-sm font-medium";

export const navSpacingClasses = "px-3 py-2";

export const navLinkBaseClasses = `${navSpacingClasses} ${navTypographyClasses} ${navTransitionClasses} ${navFocusRingClasses}`;

export const navLinkIconClasses = `inline-flex items-center gap-1.5 ${navLinkBaseClasses}`;