import { test, expect } from '@playwright/test';
import { loginAs, USER_CREDENTIALS, shouldHaveAccess } from '../helpers/auth';

/**
 * Edge Case & Error Handling Test Suite
 * 
 * This test suite validates the application's robustness against various
 * error conditions, unauthorized access attempts, and edge cases.
 * 
 * Coverage includes:
 * - Unauthorized access attempts
 * - Invalid inputs and validation errors
 * - Error message display (UI and API)
 * - Network failures and offline handling
 * - 404/500 error pages
 * - Session expiration and token handling
 * - Concurrent user actions
 * - API error responses
 */

test.describe('Edge Case & Error Handling', () => {
  // ===========================================================================
  // 1. UNAUTHORIZED ACCESS ATTEMPTS
  // ===========================================================================
  test.describe('Unauthorized Access Attempts', () => {
    const protectedPaths = [
      '/dashboard',
      '/dashboard/jobs',
      '/dashboard/clients',
      '/dashboard/team',
      '/dashboard/settings',
      '/tech',
      '/portal',
      '/learn',
      '/admin/triage',
      '/admin/company-management',
    ];

    test('unauthenticated user redirected to signin for protected paths', async ({ page }) => {
      // Ensure we're logged out
      await page.goto('/logout');
      
      for (const path of protectedPaths) {
        await page.goto(path);
        // Should redirect to signin page
        await expect(page).toHaveURL(/\/signin/);
        // Clear cookies to simulate fresh session
        await page.context().clearCookies();
      }
    });

    test('role-based access control enforcement', async ({ page }) => {
      const roles = ['admin', 'technician', 'client', 'student'] as const;
      
      for (const role of roles) {
        await loginAs(role, page, true);
        
        // Test each path that should be accessible/inaccessible for this role
        for (const path of protectedPaths) {
          await page.goto(path);
          
          if (shouldHaveAccess(role, path)) {
            // Should not redirect to signin
            await expect(page).not.toHaveURL(/\/signin/);
            // Should show content (or at least not show access denied)
            const error = page.getByText(/access denied|unauthorized/i);
            await expect(error).not.toBeVisible();
          } else {
            // Should show access denied or redirect to unauthorized page
            const hasAccessDenied = await page.getByText(/access denied|unauthorized|not authorized/i).isVisible().catch(() => false);
            const isForbidden = page.url().includes('/403') || page.url().includes('/unauthorized');
            expect(hasAccessDenied || isForbidden).toBeTruthy();
          }
        }
        
        // Logout before next role
        await page.goto('/logout');
      }
    });

    test('cross-company data isolation', async ({ page }) => {
      // This test assumes multi-company setup; we'll verify that users
      // cannot access data from other companies
      // Implementation depends on specific API endpoints
      // Placeholder for now - can be expanded with actual API calls
      test.skip();
    });
  });

  // ===========================================================================
  // 2. INVALID INPUTS AND VALIDATION ERRORS
  // ===========================================================================
  test.describe('Invalid Inputs and Validation Errors', () => {
    test('signin form validation shows appropriate errors', async ({ page }) => {
      await page.goto('/signin');
      
      // Test empty submission
      await page.click('button[type="submit"]');
      await expect(page.getByText(/email.*required|password.*required/i)).toBeVisible();
      
      // Test invalid email format
      await page.fill('input[type="email"]', 'invalid-email');
      await page.fill('input[type="password"]', 'pass');
      await page.click('button[type="submit"]');
      await expect(page.getByText(/valid email|invalid email/i)).toBeVisible();
      
      // Test too short password
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', '123');
      await page.click('button[type="submit"]');
      await expect(page.getByText(/password.*length|too short/i)).toBeVisible();
    });

    test('signup form validation', async ({ page }) => {
      await page.goto('/signup');
      
      // Test password mismatch
      await page.fill('input[type="email"]', 'newuser@example.com');
      await page.fill('input[name="password"]', 'Password123!');
      await page.fill('input[name="confirmPassword"]', 'DifferentPassword123!');
      await page.click('button[type="submit"]');
      await expect(page.getByText(/passwords.*match|confirmation/i)).toBeVisible();
      
      // Test weak password
      await page.fill('input[name="password"]', 'weak');
      await page.fill('input[name="confirmPassword"]', 'weak');
      await page.click('button[type="submit"]');
      await expect(page.getByText(/password.*strong|at least/i)).toBeVisible();
    });

    test('job creation form validation', async ({ page }) => {
      await loginAs('admin', page, true);
      await page.goto('/dashboard/jobs');
      
      // Open new job dialog
      const newJobBtn = page.getByRole('button', { name: /new job/i }).first();
      await newJobBtn.click();
      
      // Try to submit empty form
      const submitBtn = page.locator('button[type="submit"]').first();
      await submitBtn.click();
      
      // Should show validation errors
      await expect(page.getByText(/required|please fill/i)).toBeVisible();
      
      // Test invalid phone number format
      const phoneInput = page.locator('input[type="tel"]').first();
      if (await phoneInput.isVisible()) {
        await phoneInput.fill('invalid-phone');
        await submitBtn.click();
        await expect(page.getByText(/valid phone|phone number/i)).toBeVisible();
      }
    });

    test('API validation errors return appropriate status codes', async ({ page }) => {
      // Test API endpoint with invalid data
      const response = await page.request.post('/api/jobs', {
        data: { invalid: 'data' }
      });
      expect(response.status()).toBeGreaterThanOrEqual(400);
      expect(response.status()).toBeLessThan(500);
      
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(body).toHaveProperty('message');
    });
  });

  // ===========================================================================
  // 3. ERROR MESSAGE DISPLAY
  // ===========================================================================
  test.describe('Error Message Display', () => {
    test('error messages are visible and actionable', async ({ page }) => {
      await page.goto('/signin');
      
      // Submit invalid credentials
      await page.fill('input[type="email"]', 'nonexistent@example.com');
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');
      
      // Error message should be visible
      const errorMessage = page.getByText(/invalid|incorrect|error/i);
      await expect(errorMessage).toBeVisible();
      
      // Error message should have appropriate styling (e.g., red color)
      const color = await errorMessage.evaluate(el => 
        window.getComputedStyle(el).color
      );
      expect(color).toMatch(/rgb\(255,\s*\d+,\s*\d+\)|rgba\(255,\s*\d+,\s*\d+/i);
      
      // Error message should persist until user interaction
      await page.fill('input[type="email"]', '');
      await expect(errorMessage).toBeVisible();
      
      // Error should clear when user starts typing correct info
      await page.fill('input[type="email"]', USER_CREDENTIALS.admin.email);
      await expect(errorMessage).not.toBeVisible();
    });

    test('server error messages are user-friendly', async ({ page }) => {
      // Simulate a server error by navigating to a problematic route
      // This depends on having a test route that throws 500
      // For now, we'll test that error pages render properly
      await page.goto('/non-existent-route-that-should-404');
      await expect(page.getByText(/page not found|404/i)).toBeVisible();
    });

    test('loading states and error recovery', async ({ page }) => {
      await loginAs('admin', page, true);
      await page.goto('/dashboard');
      
      // Simulate a slow network request
      await page.route('**/api/dashboard-data', route => {
        // Delay response to show loading state
        setTimeout(() => route.continue(), 2000);
      });
      
      // Trigger data reload
      const refreshBtn = page.getByRole('button', { name: /refresh|reload/i }).first();
      if (await refreshBtn.isVisible()) {
        await refreshBtn.click();
        // Should show loading indicator
        const loading = page.getByText(/loading/i).or(page.locator('[aria-busy="true"]'));
        await expect(loading).toBeVisible();
      }
    });
  });

  // ===========================================================================
  // 4. NETWORK FAILURES AND OFFLINE HANDLING
  // ===========================================================================
  test.describe('Network Failures and Offline Handling', () => {
    test('offline mode shows appropriate message', async ({ page }) => {
      // Simulate offline mode
      await page.context().setOffline(true);
      
      await page.goto('/');
      // Should show offline indicator or cached content
      const offlineMsg = page.getByText(/offline|no internet|connection/i);
      await expect(offlineMsg).toBeVisible();
      
      // Restore connectivity
      await page.context().setOffline(false);
    });

    test('failed API requests show retry options', async ({ page }) => {
      // Intercept API call and fail it
      await page.route('**/api/dashboard-data', route => {
        route.abort('failed');
      });
      
      await loginAs('admin', page, true);
      await page.goto('/dashboard');
      
      // Should show error with retry button
      const retryBtn = page.getByRole('button', { name: /retry|try again/i });
      await expect(retryBtn).toBeVisible({ timeout: 10000 });
      
      // Click retry should attempt again
      await retryBtn.click();
      // After clicking, loading should appear
      const loading = page.getByText(/loading/i).or(page.locator('[aria-busy="true"]'));
      await expect(loading).toBeVisible();
    });

    test('form submission handles network errors gracefully', async ({ page }) => {
      await loginAs('admin', page, true);
      await page.goto('/dashboard/jobs');
      
      // Open new job dialog
      const newJobBtn = page.getByRole('button', { name: /new job/i }).first();
      await newJobBtn.click();
      
      // Fill valid data
      await page.fill('input[id="job-name"]', 'Test Job Network Error');
      await page.fill('input[id="address"]', '123 Test St');
      
      // Intercept submission and fail
      await page.route('**/api/jobs', route => {
        route.abort('failed');
      });
      
      // Submit form
      const submitBtn = page.locator('button[type="submit"]').first();
      await submitBtn.click();
      
      // Should show network error message
      const errorMsg = page.getByText(/network error|connection failed|try again/i);
      await expect(errorMsg).toBeVisible();
      
      // Form data should be preserved
      const jobNameValue = await page.inputValue('input[id="job-name"]');
      expect(jobNameValue).toBe('Test Job Network Error');
    });
  });

  // ===========================================================================
  // 5. 404/500 ERROR PAGES
  // ===========================================================================
  test.describe('404/500 Error Pages', () => {
    test('404 page for non-existent routes', async ({ page }) => {
      await page.goto('/this-route-does-not-exist');
      await expect(page).toHaveURL(/\/this-route-does-not-exist/);
      await expect(page.getByText(/404|page not found|not found/i)).toBeVisible();
      
      // Should have link back to home
      const homeLink = page.getByRole('link', { name: /home|dashboard|go back/i });
      await expect(homeLink).toBeVisible();
      
      // Clicking home link should navigate to valid page
      await homeLink.click();
      await expect(page).not.toHaveURL(/\/this-route-does-not-exist/);
    });

    test('500 error page for server errors', async ({ page }) => {
      // Navigate to a route that simulates server error
      // This might require a test-specific endpoint
      // For now, we'll test that error boundaries work
      test.skip(); // Need server error simulation endpoint
    });

    test('error page maintains navigation', async ({ page }) => {
      await page.goto('/non-existent-route');
      
      // Navigation menu should still work
      const navLinks = page.locator('nav a').or(page.locator('[role="navigation"] a'));
      const firstNavLink = navLinks.first();
      if (await firstNavLink.isVisible()) {
        await firstNavLink.click();
        await expect(page).not.toHaveURL(/\/non-existent-route/);
      }
    });
  });

  // ===========================================================================
  // 6. SESSION EXPIRATION AND TOKEN HANDLING
  // ===========================================================================
  test.describe('Session Expiration and Token Handling', () => {
    test('expired session redirects to signin', async ({ page }) => {
      await loginAs('admin', page, true);
      await page.goto('/dashboard');
      
      // Simulate token expiration by clearing session storage
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      
      // Clear cookies as well
      await page.context().clearCookies();
      
      // Navigate to protected page
      await page.goto('/dashboard/jobs');
      
      // Should redirect to signin
      await expect(page).toHaveURL(/\/signin/);
      
      // Should show message about session expiration
      const expiredMsg = page.getByText(/session.*expired|login.*again/i);
      await expect(expiredMsg).toBeVisible();
    });

    test('multiple tabs maintain session sync', async ({ page }) => {
      await loginAs('admin', page, true);
      await page.goto('/dashboard');
      
      // Create a new page (simulating new tab)
      const newPage = await page.context().newPage();
      await newPage.goto('/dashboard');
      
      // Should be authenticated in new tab
      await expect(newPage).not.toHaveURL(/\/signin/);
      
      // Logout from original tab
      await page.goto('/logout');
      
      // New tab should also be logged out on next navigation
      await newPage.reload();
      await expect(newPage).toHaveURL(/\/signin/);
      
      await newPage.close();
    });

    test('refresh token rotation works', async ({ page }) => {
      // This test would require mocking the auth flow
      // Placeholder for implementation
      test.skip(); // Requires auth flow mocking
    });
  });

  // ===========================================================================
  // 7. CONCURRENT USER ACTIONS
  // ===========================================================================
  test.describe('Concurrent User Actions', () => {
    test('duplicate form submission prevention', async ({ page }) => {
      await loginAs('admin', page, true);
      await page.goto('/dashboard/jobs');
      
      // Open new job dialog
      const newJobBtn = page.getByRole('button', { name: /new job/i }).first();
      await newJobBtn.click();
      
      // Fill form
      await page.fill('input[id="job-name"]', 'Concurrent Test Job');
      await page.fill('input[id="address"]', '123 Concurrent St');
      
      // Double-click submit button
      const submitBtn = page.locator('button[type="submit"]').first();
      await submitBtn.dblclick();
      
      // Should only create one job (check API calls)
      // For now, verify button becomes disabled after first click
      await expect(submitBtn).toBeDisabled();
      
      // Wait a bit and verify button re-enables (if submission fails)
      await page.waitForTimeout(1000);
      // If still disabled due to pending request, that's okay
    });

    test('race condition handling for overlapping updates', async ({ page }) => {
      await loginAs('admin', page, true);
      await page.goto('/dashboard/jobs');
      
      // Find a job to edit (if any exist)
      const editButtons = page.getByRole('button', { name: /edit/i });
      if (await editButtons.count() > 0) {
        await editButtons.first().click();
        
        // Simulate concurrent edit by another user
        // This would require a more complex setup with multiple browsers
        test.skip(); // Requires multi-user simulation
      } else {
        test.skip(); // No jobs available for edit test
      }
    });

    test('optimistic UI updates roll back on error', async ({ page }) => {
      await loginAs('admin', page, true);
      await page.goto('/dashboard/jobs');
      
      // Find a job with delete button
      const deleteButtons = page.getByRole('button', { name: /delete/i });
      if (await deleteButtons.count() > 0) {
        // Intercept delete API call and fail it
        await page.route('**/api/jobs/*', route => {
          route.abort('failed');
        });
        
        await deleteButtons.first().click();
        
        // Should show error and restore the job item
        const errorMsg = page.getByText(/failed to delete|error/i);
        await expect(errorMsg).toBeVisible();
        
        // Job should still be visible
        await expect(deleteButtons.first()).toBeVisible();
      } else {
        test.skip(); // No jobs available for delete test
      }
    });
  });

  // ===========================================================================
  // 8. API ERROR RESPONSES
  // ===========================================================================
  test.describe('API Error Responses', () => {
    test('API returns appropriate HTTP status codes', async ({ page }) => {
      // Test various error scenarios
      const testCases = [
        { endpoint: '/api/non-existent', expectedStatus: 404 },
        { endpoint: '/api/auth/signin', method: 'POST', data: { invalid: 'data' }, expectedStatus: 400 },
        // Add more endpoints as needed
      ];
      
      for (const tc of testCases) {
        const method = tc.method || 'GET';
        const response = await page.request.fetch(tc.endpoint, {
          method,
          data: tc.data
        });
        expect(response.status()).toBe(tc.expectedStatus);
      }
    });

    test('API error responses include helpful information', async ({ page }) => {
      const response = await page.request.post('/api/auth/signin', {
        data: { email: 'invalid', password: 'invalid' }
      });
      
      expect(response.status()).toBeGreaterThanOrEqual(400);
      
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(body).toHaveProperty('message');
      expect(typeof body.message).toBe('string');
      
      // Error should not expose internal details
      expect(body.message).not.toMatch(/stack trace|internal server error/i);
    });

    test('rate limiting returns 429 status', async ({ page }) => {
      // Make rapid requests to trigger rate limiting
      // This might be tricky in test environment
      test.skip(); // Rate limiting test requires specific setup
    });
  });
});