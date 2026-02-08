import { Page } from "@playwright/test";

/**
 * Clear authentication-related cache from localStorage.
 * This bypasses the 1-minute cache TTL in useSupabaseAuth hook.
 */
export async function clearAuthCache(page: Page) {
  const url = page.url();
  // Skip if page is not on a valid origin (about:blank, data:, etc.)
  if (!url.startsWith("http")) {
    console.log(`[Cache Helper] Skipping cache clear for non-HTTP URL: ${url}`);
    return;
  }
  
  try {
    await page.evaluate(() => {
      // Remove all companies_cache_* keys
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("companies_cache_")) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log(`[Cache Helper] Removed ${keysToRemove.length} cache keys from localStorage`);
      
      // Also clear any other auth-related cache if needed
      const authStateKeys = ["supabase.auth.token", "supabase.auth.session"];
      authStateKeys.forEach(key => localStorage.removeItem(key));
    });
  } catch (err) {
    console.log(`[Cache Helper] Error clearing cache: ${err}`);
  }
}

/**
 * Clear all localStorage (more aggressive).
 */
export async function clearAllLocalStorage(page: Page) {
  const url = page.url();
  if (!url.startsWith("http")) {
    console.log(`[Cache Helper] Skipping localStorage clear for non-HTTP URL: ${url}`);
    return;
  }
  
  try {
    await page.evaluate(() => {
      localStorage.clear();
      console.log(`[Cache Helper] Cleared all localStorage`);
    });
  } catch (err) {
    console.log(`[Cache Helper] Error clearing all localStorage: ${err}`);
  }
}