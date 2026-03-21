/**
 * Shared navigation style constants for consistent navigation design.
 * Implements refined "Soft Elevation" design pattern.
 */

export const navFocusRingClasses =
  "focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export const navTransitionClasses = "transition-all duration-200";

export const navTypographyClasses = "text-sm font-medium";

export const navSpacingClasses = "px-3 py-2";

export const navLinkBaseClasses = `${navSpacingClasses} ${navTypographyClasses} ${navTransitionClasses} ${navFocusRingClasses}`;

export const navLinkIconClasses = `inline-flex items-center gap-1.5 ${navLinkBaseClasses}`;